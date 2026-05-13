import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import puppeteer from 'npm:puppeteer-core@23.11.1';
import chromium from 'npm:@sparticuz/chromium@133.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inspectionId } = await req.json();
    if (!inspectionId) {
      return Response.json({ error: 'Missing inspectionId' }, { status: 400 });
    }

    // Fetch all data needed for the report
    const [inspections, allPoints] = await Promise.all([
      base44.asServiceRole.entities.Inspection.list(),
      base44.asServiceRole.entities.InspectionPoint.filter({ inspection_id: inspectionId }),
    ]);

    const inspection = inspections.find(i => i.id === inspectionId);
    if (!inspection) {
      return Response.json({ error: 'Inspection not found' }, { status: 404 });
    }

    const [sites, customers] = await Promise.all([
      base44.asServiceRole.entities.Site.list(),
      base44.asServiceRole.entities.Customer.list(),
    ]);

    const site = sites.find(s => s.id === inspection.site_id);
    const customer = site?.customer_id ? customers.find(c => c.id === site.customer_id) : null;

    // Build the HTML for the report
    const html = buildReportHtml({ inspection, site, customer, points: allPoints });

    // Launch puppeteer
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });

    // Wait a bit more for images to render fully
    await new Promise(resolve => setTimeout(resolve, 2000));

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      printBackground: true,
    });

    await browser.close();

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rapport-${inspection.inspection_number || inspectionId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildReportHtml({ inspection, site, customer, points }) {
  const severityLabel = { low: 'Låg', medium: 'Medel', high: 'Hög', critical: 'Kritisk' };
  const severityColor = { low: '#dbeafe', medium: '#fef9c3', high: '#ffedd5', critical: '#fee2e2' };
  const severityTextColor = { low: '#1e40af', medium: '#854d0e', high: '#9a3412', critical: '#991b1b' };
  const issueTypeLabel = {
    improvement_suggestions: 'Förbättringsförslag',
    issue_damage: 'Skada',
    plant_health: 'Växthälsa',
    maintenance: 'Underhåll',
    safety_concern: 'Säkerhetsrisk',
    deviation: 'Avvikelse',
    general: 'General',
  };
  const reasonLabel = {
    tillsyn: 'Tillsyn',
    besiktning: 'Besiktning',
    ny_kundbesiktning: 'Ny kundbesiktning',
    anbud_kalkylering: 'Anbud/kalkylering',
    egenkontroll: 'Egenkontroll',
    other: inspection.reason_custom || 'Övrigt',
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  const totalPoints = points.length;
  const countBySeverity = (s) => points.filter(p => p.severity === s).length;
  const countByType = (t) => points.filter(p => p.issue_type === t).length;
  const pct = (n) => totalPoints > 0 ? Math.round((n / totalPoints) * 100) : 0;

  const summaryBySeverity = ['low', 'medium', 'high', 'critical'].map(s => ({
    label: severityLabel[s], count: countBySeverity(s), pct: pct(countBySeverity(s)), color: severityColor[s], textColor: severityTextColor[s]
  }));

  const summaryByType = Object.keys(issueTypeLabel).filter(t => t !== 'general').map(t => ({
    label: issueTypeLabel[t], count: countByType(t), pct: pct(countByType(t))
  }));

  const keyObservations = [];
  if (countBySeverity('critical') > 0) keyObservations.push({ color: '#dc2626', text: `${countBySeverity('critical')} kritiska noteringar` });
  if (countBySeverity('high') > 0) keyObservations.push({ color: '#ea580c', text: `${countBySeverity('high')} noteringar med hög prioritet` });
  if (countBySeverity('medium') > 0) keyObservations.push({ color: '#ca8a04', text: `${countBySeverity('medium')} noteringar med medelprioritetet` });
  if (countBySeverity('low') > 0) keyObservations.push({ color: '#2563eb', text: `${countBySeverity('low')} noteringar med låg prioritet` });

  // Build inspection point pages
  const pointPages = points.map((point, index) => {
    const photos = (point.photo_details || []).map((photo, pi) => `
      <div style="break-inside:avoid; margin-bottom:8px;">
        <img src="${photo.url}" crossorigin="anonymous" style="width:100%; height:auto; border-radius:8px; border:1px solid #d1d5db; display:block;" />
        ${photo.comment ? `<p style="font-size:10px; color:#4b5563; font-style:italic; margin-top:4px; background:#f9fafb; padding:6px; border-radius:4px;">${photo.comment}</p>` : ''}
      </div>
    `).join('');

    const photoGrid = point.photo_details && point.photo_details.length > 0 ? `
      <div style="margin-top:12px;">
        <div style="display:flex; align-items:center; gap:8px; font-size:13px; font-weight:600; color:#374151; margin-bottom:10px;">
          📷 Dokumentation (${point.photo_details.length} ${point.photo_details.length === 1 ? 'foto' : 'foton'})
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          ${photos}
        </div>
      </div>
    ` : '';

    const gps = point.latitude && point.longitude ? `
      <div style="margin-top:10px; font-size:11px; color:#6b7280; background:#f9fafb; padding:6px 10px; border-radius:6px; display:inline-block;">
        📍 GPS: ${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}
      </div>
    ` : '';

    return `
      <div style="page-break-before:always; padding: 0;">
        <div style="text-align:right; font-size:9pt; color:#666; border-bottom:1px solid #e5e7eb; margin-bottom:8px; padding-bottom:4px;">Sida ${index + 4}</div>
        <div style="display:flex; gap:16px; align-items:flex-start;">
          <div style="flex-shrink:0; width:40px; height:40px; background:#1f2937; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:18px;">${index + 1}</div>
          <div style="flex:1;">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px; flex-wrap:wrap;">
              <span style="background:${severityColor[point.severity || 'medium']}; color:${severityTextColor[point.severity || 'medium']}; border:1px solid; padding:3px 12px; border-radius:6px; font-weight:600; font-size:11px; text-transform:uppercase;">
                ${severityLabel[point.severity || 'medium']}
              </span>
              <span style="font-size:13px; font-weight:600; color:#1f2937;">
                ${issueTypeLabel[point.issue_type] || (point.issue_type || '').replace(/_/g, ' ')}
              </span>
            </div>
            ${point.notes ? `<p style="font-size:13px; color:#374151; line-height:1.6; margin-bottom:12px;">${point.notes}</p>` : ''}
            ${photoGrid}
            ${gps}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Map image for overview page
  const mapHtml = inspection.map_screenshot_url
    ? `<img src="${inspection.map_screenshot_url}" crossorigin="anonymous" style="width:100%; height:auto; border:1px solid #d1d5db; border-radius:8px;" />`
    : site?.map_image_url
    ? `<img src="${site.map_image_url}" crossorigin="anonymous" style="width:100%; height:auto; border:1px solid #d1d5db; border-radius:8px;" />`
    : `<div style="padding:20px; text-align:center; color:#9ca3af;">Ingen karta konfigurerad</div>`;

  return `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; background: white; }
    .page { padding: 0; }
    .page-header { text-align:right; font-size:9pt; color:#666; border-bottom:1px solid #e5e7eb; margin-bottom:8px; padding-bottom:4px; }
    h1 { font-size: 28pt; font-weight: 800; }
    h2 { font-size: 18pt; font-weight: 700; }
    table { width:100%; border-collapse:collapse; }
    td, th { padding: 4px 8px; }
  </style>
</head>
<body>

<!-- PAGE 1: FRONT PAGE -->
<div class="page">
  <div class="page-header">Sida 1</div>
  <div style="text-align:center; padding: 40px 0 30px;">
    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698b067db5e721251596eb5e/0e240ccf1_image.png" crossorigin="anonymous" style="height:80px; object-fit:contain;" />
    <div style="margin-top:16px; font-size:13px; color:#374151;">
      <span style="font-weight:700; color:#7c3aed;">phm</span> partner
    </div>
  </div>
  <div style="text-align:center; margin: 40px 0;">
    <h1 style="font-size:32pt; color:#111827;">${inspection.report_title || 'Tillsynsrapport'}</h1>
    <div style="width:60px; height:4px; background:#dc2626; margin:16px auto;"></div>
    <h2 style="font-size:20pt; font-weight:400; color:#374151;">${site?.name || ''}</h2>
  </div>
  <div style="margin-top:40px; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
    ${customer ? `
    <div style="padding:16px 20px; border-bottom:1px solid #e5e7eb;">
      <p style="font-size:9px; text-transform:uppercase; letter-spacing:0.1em; color:#6b7280; margin-bottom:4px;">KUND</p>
      <p style="font-weight:700; font-size:14px;">${customer.name}</p>
      ${customer.project_number ? `<p style="font-size:12px; color:#6b7280;">Projektnummer: ${customer.project_number}</p>` : ''}
    </div>` : ''}
    <div style="padding:16px 20px; border-bottom:1px solid #e5e7eb;">
      <p style="font-size:9px; text-transform:uppercase; letter-spacing:0.1em; color:#6b7280; margin-bottom:4px;">BESIKTNINGSDATUM</p>
      <p style="font-weight:700; font-size:14px;">${formatDate(inspection.inspection_date)}</p>
    </div>
    <div style="padding:16px 20px; border-bottom:1px solid #e5e7eb;">
      <p style="font-size:9px; text-transform:uppercase; letter-spacing:0.1em; color:#6b7280; margin-bottom:4px;">BESIKTNINGSMAN</p>
      <p style="font-weight:700; font-size:14px;">${inspection.inspector_name || ''}</p>
    </div>
    <div style="padding:16px 20px; border-bottom:1px solid #e5e7eb;">
      <p style="font-size:9px; text-transform:uppercase; letter-spacing:0.1em; color:#6b7280; margin-bottom:4px;">ANLEDNING</p>
      <p style="font-weight:700; font-size:14px;">${reasonLabel[inspection.reason_category] || ''}</p>
    </div>
    ${site?.location ? `
    <div style="padding:16px 20px;">
      <p style="font-size:9px; text-transform:uppercase; letter-spacing:0.1em; color:#6b7280; margin-bottom:4px;">PLATS</p>
      <p style="font-weight:700; font-size:14px;">${site.location}</p>
    </div>` : ''}
  </div>
</div>

<!-- PAGE 2: SUMMARY -->
<div class="page" style="page-break-before:always;">
  <div class="page-header">Sida 2</div>
  <h2 style="font-size:22pt; font-weight:800; margin-bottom:20px;">Sammanfattning</h2>

  <div style="border:1px solid #e5e7eb; border-radius:8px; padding:16px; margin-bottom:16px;">
    <p style="font-weight:700; font-size:13px; margin-bottom:12px;">Besiktningsöversikt</p>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
      <div>
        <p style="font-size:11px; color:#6b7280;">Besiktningsnummer</p>
        <p style="font-weight:700; font-size:13px; background:#f3f4f6; display:inline-block; padding:2px 8px; border-radius:4px; font-family:monospace;">${inspection.inspection_number || ''}</p>
      </div>
      <div>
        <p style="font-size:11px; color:#6b7280;">Plats</p>
        <p style="font-weight:700; font-size:13px;">${site?.name || ''}</p>
      </div>
      <div>
        <p style="font-size:11px; color:#6b7280;">Datum</p>
        <p style="font-weight:700; font-size:13px;">${inspection.inspection_date || ''}</p>
      </div>
      <div>
        <p style="font-size:11px; color:#6b7280;">Besiktningsman</p>
        <p style="font-weight:700; font-size:13px;">${inspection.inspector_name || ''}</p>
      </div>
      <div>
        <p style="font-size:11px; color:#6b7280;">Totalt antal punkter</p>
        <p style="font-weight:700; font-size:13px;">${totalPoints}</p>
      </div>
    </div>
  </div>

  <div style="border:1px solid #e5e7eb; border-radius:8px; padding:16px; margin-bottom:16px;">
    <p style="font-weight:700; font-size:13px; margin-bottom:12px;">Allvarlighetsgrad</p>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
      ${summaryBySeverity.map(s => `
        <div style="border:1px solid #e5e7eb; border-radius:6px; padding:12px; text-align:center;">
          <p style="font-size:20px; font-weight:700; color:${s.textColor};">${s.count}</p>
          <p style="font-size:12px; color:#374151;">${s.label}</p>
          <p style="font-size:11px; color:#6b7280;">${s.pct}%</p>
        </div>
      `).join('')}
    </div>
  </div>

  <div style="border:1px solid #e5e7eb; border-radius:8px; padding:16px; margin-bottom:16px;">
    <p style="font-weight:700; font-size:13px; margin-bottom:12px;">Ärendekategorier</p>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
      ${summaryByType.map(t => `
        <div style="border:1px solid #e5e7eb; border-radius:6px; padding:10px;">
          <p style="font-size:18px; font-weight:700; color:#374151;">${t.count}</p>
          <p style="font-size:12px; color:#374151;">${t.label}</p>
          <p style="font-size:11px; color:#6b7280;">${t.pct}%</p>
        </div>
      `).join('')}
    </div>
  </div>

  ${keyObservations.length > 0 ? `
  <div style="border:1px solid #e5e7eb; border-radius:8px; padding:16px;">
    <p style="font-weight:700; font-size:13px; margin-bottom:10px;">Viktiga iakttagelser</p>
    ${keyObservations.map(o => `
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px; background:#f9fafb; padding:8px 12px; border-radius:6px;">
        <span style="color:${o.color}; font-size:18px;">●</span>
        <span style="font-size:13px;">${o.text}</span>
      </div>
    `).join('')}
  </div>` : ''}
</div>

<!-- PAGE 3: DETAILED OVERVIEW WITH MAP -->
<div class="page" style="page-break-before:always;">
  <div class="page-header">Sida 3</div>
  <div style="margin-bottom:16px; padding-bottom:16px; border-bottom:2px solid #d1d5db;">
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
      <span style="background:#1f2937; color:white; padding:3px 12px; border-radius:4px; font-size:12px; font-weight:700; font-family:monospace;">${inspection.inspection_number}</span>
      <span style="font-size:12px; color:#6b7280;">Besiktnings-ID</span>
    </div>
    <h1 style="font-size:22pt; font-weight:800; margin-bottom:6px;">${inspection.report_title || 'Detaljerad besiktningsrapport'}</h1>
    <h2 style="font-size:14pt; font-weight:400; color:#374151; margin-bottom:14px;">${site?.name || ''}</h2>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
      <div>
        <p style="font-size:9px; text-transform:uppercase; letter-spacing:0.1em; color:#6b7280; margin-bottom:3px;">Besiktningsdatum</p>
        <p style="font-weight:600; font-size:13px;">${formatDate(inspection.inspection_date)}</p>
      </div>
      <div>
        <p style="font-size:9px; text-transform:uppercase; letter-spacing:0.1em; color:#6b7280; margin-bottom:3px;">Besiktningsman</p>
        <p style="font-weight:600; font-size:13px;">${inspection.inspector_name || ''}</p>
      </div>
      ${customer ? `
      <div>
        <p style="font-size:9px; text-transform:uppercase; letter-spacing:0.1em; color:#6b7280; margin-bottom:3px;">Kund</p>
        <p style="font-weight:600; font-size:13px;">${customer.name}</p>
        ${customer.project_number ? `<p style="font-size:11px; color:#6b7280;">Projekt: ${customer.project_number}</p>` : ''}
      </div>` : ''}
      ${site?.location ? `
      <div>
        <p style="font-size:9px; text-transform:uppercase; letter-spacing:0.1em; color:#6b7280; margin-bottom:3px;">Plats</p>
        <p style="font-size:13px;">${site.location}</p>
      </div>` : ''}
    </div>
  </div>

  <h2 style="font-size:16pt; font-weight:700; margin-bottom:12px;">Platsöversikt</h2>
  ${mapHtml}

  <div style="margin-top:24px; page-break-before:always;">
    <h2 style="font-size:16pt; font-weight:700; margin-bottom:12px;">Detaljerade fynd (${points.length} punkter)</h2>
    <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:16px;">
      <p style="font-size:13px; font-weight:600; color:#374151; margin-bottom:10px;">Punktöversikt:</p>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
        ${points.map((p, i) => `
          <div style="font-size:12px; color:#4b5563;">
            <span style="font-weight:600;">Punkt ${i + 1}:</span> Sida ${i + 4}
          </div>
        `).join('')}
      </div>
    </div>
  </div>
</div>

<!-- INSPECTION POINT PAGES -->
${pointPages}

</body>
</html>`;
}