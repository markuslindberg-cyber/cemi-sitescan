import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@2.5.2';

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

    const severityLabel = { low: 'Låg', medium: 'Medel', high: 'Hög', critical: 'Kritisk' };
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

    // Helper to fetch image as base64
    const fetchImageBase64 = async (url) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const buf = await res.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const base64 = btoa(binary);
        const ct = res.headers.get('content-type') || 'image/jpeg';
        return { base64, format: ct.includes('png') ? 'PNG' : 'JPEG' };
      } catch {
        return null;
      }
    };

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const pageH = 297;
    const margin = 20;
    const contentW = pageW - margin * 2;

    const addPageHeader = (pageNum) => {
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Sida ${pageNum}`, pageW - margin, margin - 8, { align: 'right' });
      doc.setDrawColor(220);
      doc.line(margin, margin - 6, pageW - margin, margin - 6);
      doc.setTextColor(20);
    };

    const addWrappedText = (text, x, y, maxW, fontSize, color = [20, 20, 20], fontStyle = 'normal') => {
      doc.setFontSize(fontSize);
      doc.setTextColor(...color);
      doc.setFont('helvetica', fontStyle);
      const lines = doc.splitTextToSize(String(text || ''), maxW);
      doc.text(lines, x, y);
      return y + lines.length * (fontSize * 0.4);
    };

    // ---- PAGE 1: FRONT PAGE ----
    addPageHeader(1);
    let y = margin + 10;

    // Logo
    const logoData = await fetchImageBase64('https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698b067db5e721251596eb5e/0e240ccf1_image.png');
    if (logoData) {
      doc.addImage(logoData.base64, logoData.format, pageW / 2 - 25, y, 50, 20, undefined, 'FAST');
    }
    y += 30;

    // Title
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    const title = inspection.report_title || 'Tillsynsrapport';
    doc.text(title, pageW / 2, y, { align: 'center' });
    y += 8;

    // Red underline
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(1.5);
    doc.line(pageW / 2 - 15, y, pageW / 2 + 15, y);
    doc.setLineWidth(0.2);
    doc.setDrawColor(220);
    y += 10;

    // Site name
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text(site?.name || '', pageW / 2, y, { align: 'center' });
    y += 20;

    // Info rows
    const infoRows = [
      customer ? ['KUND', `${customer.name}${customer.project_number ? '\nProjektnummer: ' + customer.project_number : ''}`] : null,
      ['BESIKTNINGSDATUM', formatDate(inspection.inspection_date)],
      ['BESIKTNINGSMAN', inspection.inspector_name || ''],
      ['ANLEDNING', reasonLabel[inspection.reason_category] || ''],
      site?.location ? ['PLATS', site.location] : null,
    ].filter(Boolean);

    doc.setDrawColor(220);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, contentW, infoRows.length * 16, 'S');

    infoRows.forEach((row, i) => {
      const rowY = y + i * 16;
      if (i > 0) {
        doc.line(margin, rowY, margin + contentW, rowY);
      }
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120);
      doc.text(row[0], margin + 4, rowY + 5);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20);
      const lines = doc.splitTextToSize(row[1], contentW - 8);
      doc.text(lines, margin + 4, rowY + 11);
    });

    // ---- PAGE 2: SUMMARY ----
    doc.addPage();
    addPageHeader(2);
    y = margin + 10;

    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20);
    doc.text('Sammanfattning', margin, y);
    y += 12;

    // Overview box
    doc.setDrawColor(220);
    doc.rect(margin, y, contentW, 30, 'S');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20);
    doc.text('Besiktningsöversikt', margin + 4, y + 6);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text('Besiktningsnummer', margin + 4, y + 13);
    doc.text('Plats', margin + contentW / 2 + 4, y + 13);
    doc.text('Datum', margin + 4, y + 22);
    doc.text('Besiktningsman', margin + contentW / 2 + 4, y + 22);
    doc.setTextColor(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(inspection.inspection_number || '', margin + 4, y + 18);
    doc.text(site?.name || '', margin + contentW / 2 + 4, y + 18);
    doc.text(inspection.inspection_date || '', margin + 4, y + 27);
    doc.text(inspection.inspector_name || '', margin + contentW / 2 + 4, y + 27);
    y += 36;

    // Severity grid
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(20);
    doc.text('Allvarlighetsgrad', margin + 4, y);
    y += 6;
    const sevColors = { low: [219, 234, 254], medium: [254, 249, 195], high: [255, 237, 213], critical: [254, 226, 226] };
    const sevTextColors = { low: [30, 64, 175], medium: [133, 77, 14], high: [154, 52, 18], critical: [153, 27, 27] };
    const severities = ['low', 'medium', 'high', 'critical'];
    const boxW = (contentW - 4) / 2;
    const boxH = 18;
    severities.forEach((s, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = margin + col * (boxW + 4);
      const by = y + row * (boxH + 2);
      const count = allPoints.filter(p => p.severity === s).length;
      const pct = allPoints.length > 0 ? Math.round((count / allPoints.length) * 100) : 0;
      doc.setFillColor(...sevColors[s]);
      doc.roundedRect(bx, by, boxW, boxH, 2, 2, 'F');
      doc.setDrawColor(...sevColors[s]);
      doc.roundedRect(bx, by, boxW, boxH, 2, 2, 'S');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...sevTextColors[s]);
      doc.text(String(count), bx + boxW / 2, by + 10, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60);
      doc.text(`${severityLabel[s]}`, bx + boxW / 2, by + 15, { align: 'center' });
    });
    y += boxH * 2 + 10;

    // Key observations
    const keyObs = [];
    if (allPoints.filter(p => p.severity === 'critical').length > 0) keyObs.push({ color: [220, 38, 38], text: `${allPoints.filter(p => p.severity === 'critical').length} kritiska noteringar` });
    if (allPoints.filter(p => p.severity === 'high').length > 0) keyObs.push({ color: [234, 88, 12], text: `${allPoints.filter(p => p.severity === 'high').length} noteringar med hög prioritet` });
    if (allPoints.filter(p => p.severity === 'medium').length > 0) keyObs.push({ color: [202, 138, 4], text: `${allPoints.filter(p => p.severity === 'medium').length} noteringar med medelprioritetet` });
    if (allPoints.filter(p => p.severity === 'low').length > 0) keyObs.push({ color: [37, 99, 235], text: `${allPoints.filter(p => p.severity === 'low').length} noteringar med låg prioritet` });

    if (keyObs.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(20);
      doc.text('Viktiga iakttagelser', margin + 4, y);
      y += 6;
      doc.setDrawColor(220);
      doc.rect(margin, y, contentW, keyObs.length * 10 + 4, 'S');
      keyObs.forEach((o, i) => {
        doc.setFillColor(...o.color);
        doc.circle(margin + 8, y + 5 + i * 10, 2, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(20);
        doc.text(o.text, margin + 14, y + 7 + i * 10);
      });
    }

    // ---- PAGE 3: OVERVIEW + MAP ----
    doc.addPage();
    addPageHeader(3);
    y = margin + 10;

    // Inspection number badge
    doc.setFillColor(31, 41, 55);
    doc.roundedRect(margin, y, 30, 7, 1, 1, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255);
    doc.text(inspection.inspection_number || '', margin + 15, y + 5, { align: 'center' });
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text('Besiktnings-ID', margin + 34, y + 5);
    y += 12;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20);
    doc.text(inspection.report_title || 'Detaljerad besiktningsrapport', margin, y);
    y += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text(site?.name || '', margin, y);
    y += 10;
    doc.setDrawColor(200);
    doc.line(margin, y, margin + contentW, y);
    y += 8;

    // Map image
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20);
    doc.text('Platsöversikt', margin, y);
    y += 6;

    const mapUrl = inspection.map_screenshot_url || site?.map_image_url;
    if (mapUrl) {
      const mapImg = await fetchImageBase64(mapUrl);
      if (mapImg) {
        const maxImgH = 100;
        doc.addImage(mapImg.base64, mapImg.format, margin, y, contentW, maxImgH, undefined, 'FAST');
        y += maxImgH + 6;
      }
    } else {
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text('Ingen karta konfigurerad', margin, y + 10);
      y += 20;
    }

    // Point index
    doc.addPage();
    addPageHeader(3);
    y = margin + 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20);
    doc.text(`Detaljerade fynd (${allPoints.length} punkter)`, margin, y);
    y += 8;
    doc.setDrawColor(220);
    doc.setFillColor(249, 250, 251);
    doc.rect(margin, y, contentW, Math.ceil(allPoints.length / 2) * 8 + 12, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60);
    doc.text('Punktöversikt:', margin + 4, y + 7);
    doc.setFont('helvetica', 'normal');
    allPoints.forEach((p, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      doc.text(`Punkt ${i + 1}: Sida ${i + 4}`, margin + 4 + col * (contentW / 2), y + 14 + row * 8);
    });

    // ---- INSPECTION POINT PAGES ----
    for (let index = 0; index < allPoints.length; index++) {
      const point = allPoints[index];
      doc.addPage();
      addPageHeader(index + 4);
      y = margin + 10;

      // Number circle
      doc.setFillColor(31, 41, 55);
      doc.circle(margin + 6, y + 4, 6, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255);
      doc.text(String(index + 1), margin + 6, y + 6, { align: 'center' });

      // Severity badge
      const sev = point.severity || 'medium';
      doc.setFillColor(...sevColors[sev]);
      doc.roundedRect(margin + 16, y, 20, 8, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...sevTextColors[sev]);
      doc.text(severityLabel[sev].toUpperCase(), margin + 26, y + 5.5, { align: 'center' });

      // Issue type
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20);
      doc.text(issueTypeLabel[point.issue_type] || (point.issue_type || '').replace(/_/g, ' '), margin + 40, y + 6);
      y += 14;

      // Notes
      if (point.notes) {
        const noteLines = doc.splitTextToSize(point.notes, contentW - 10);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55);
        doc.text(noteLines, margin + 10, y);
        y += noteLines.length * 5 + 4;
      }

      // Photos
      if (point.photo_details && point.photo_details.length > 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60);
        doc.text(`📷 Dokumentation (${point.photo_details.length} ${point.photo_details.length === 1 ? 'foto' : 'foton'})`, margin + 10, y);
        y += 6;

        const photoW = (contentW - 10 - 4) / 2;
        const photoH = 60;

        for (let pi = 0; pi < point.photo_details.length; pi++) {
          const photo = point.photo_details[pi];
          const col = pi % 2;
          const row = Math.floor(pi / 2);

          if (col === 0 && pi > 0) {
            // Check if we need a new page
            if (y + photoH + 10 > pageH - margin) {
              doc.addPage();
              addPageHeader(index + 4);
              y = margin + 10;
            }
          }

          const px = margin + 10 + col * (photoW + 4);
          const py = y + row * (photoH + (photo.comment ? 14 : 4));

          const imgData = await fetchImageBase64(photo.url);
          if (imgData) {
            doc.addImage(imgData.base64, imgData.format, px, py, photoW, photoH, undefined, 'FAST');
          } else {
            doc.setDrawColor(200);
            doc.rect(px, py, photoW, photoH, 'S');
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Bild ej tillgänglig', px + photoW / 2, py + photoH / 2, { align: 'center' });
          }

          if (photo.comment) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(80);
            const commentLines = doc.splitTextToSize(photo.comment, photoW);
            doc.text(commentLines, px, py + photoH + 4);
          }

          // Advance y after each row
          if (col === 1 || pi === point.photo_details.length - 1) {
            y += photoH + (photo.comment ? 14 : 8);
          }
        }
      }

      // GPS
      if (point.latitude && point.longitude) {
        if (y + 10 > pageH - margin) {
          doc.addPage();
          addPageHeader(index + 4);
          y = margin + 10;
        }
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120);
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(margin + 10, y, 70, 8, 1, 1, 'F');
        doc.text(`📍 GPS: ${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`, margin + 14, y + 5.5);
      }
    }

    const pdfOutput = doc.output('arraybuffer');
    const pdfBytes = new Uint8Array(pdfOutput);

    return new Response(pdfBytes, {
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