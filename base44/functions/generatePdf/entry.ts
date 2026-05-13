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
      general: 'Generellt',
    };
    const reasonLabel = {
      tillsyn: 'Tillsyn',
      besiktning: 'Besiktning',
      ny_kundbesiktning: 'Ny kundbesiktning',
      anbud_kalkylering: 'Anbud/kalkylering',
      egenkontroll: 'Egenkontroll',
      other: inspection.reason_custom || 'Övrigt',
    };

    // Fetch image as base64 - with size limit to prevent OOM
    const fetchImageBase64 = async (url) => {
      try {
        if (!url) return null;
        const res = await fetch(url);
        if (!res.ok) return null;
        const buf = await res.arrayBuffer();
        // Skip images larger than 1MB to avoid OOM
        if (buf.byteLength > 1024 * 1024) return null;
        const bytes = new Uint8Array(buf);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
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

    const addPageHeader = (label) => {
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(label, pageW - margin, margin - 8, { align: 'right' });
      doc.setDrawColor(220);
      doc.line(margin, margin - 6, pageW - margin, margin - 6);
      doc.setTextColor(20);
    };

    // ---- PAGE 1: FRONT PAGE ----
    addPageHeader('Sida 1');
    let y = margin + 10;

    // Title
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    const title = inspection.report_title || 'Tillsynsrapport';
    const titleLines = doc.splitTextToSize(title, contentW);
    doc.text(titleLines, pageW / 2, y, { align: 'center' });
    y += titleLines.length * 12 + 4;

    // Red underline
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(1.5);
    doc.line(pageW / 2 - 20, y, pageW / 2 + 20, y);
    doc.setLineWidth(0.2);
    doc.setDrawColor(220);
    y += 8;

    // Site name
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    doc.text(site?.name || '', pageW / 2, y, { align: 'center' });
    y += 18;

    // Info rows
    const infoRows = [
      customer ? ['KUND', customer.name + (customer.project_number ? ' | Nr: ' + customer.project_number : '')] : null,
      ['BESIKTNINGSDATUM', inspection.inspection_date || ''],
      ['BESIKTNINGSMAN', inspection.inspector_name || ''],
      ['ANLEDNING', reasonLabel[inspection.reason_category] || ''],
      site?.location ? ['PLATS', site.location] : null,
    ].filter(Boolean);

    doc.setDrawColor(220);
    doc.setLineWidth(0.2);

    infoRows.forEach((row) => {
      doc.rect(margin, y, contentW, 16, 'S');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(120);
      doc.text(row[0], margin + 4, y + 5);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20);
      const valLines = doc.splitTextToSize(row[1], contentW - 8);
      doc.text(valLines[0], margin + 4, y + 12);
      y += 16;
    });

    // ---- PAGE 2: SUMMARY ----
    doc.addPage();
    addPageHeader('Sida 2');
    y = margin + 10;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20);
    doc.text('Sammanfattning', margin, y);
    y += 12;

    // Severity counts
    const sevColors = {
      low: [219, 234, 254],
      medium: [254, 249, 195],
      high: [255, 237, 213],
      critical: [254, 226, 226],
    };
    const sevTextColors = {
      low: [30, 64, 175],
      medium: [133, 77, 14],
      high: [154, 52, 18],
      critical: [153, 27, 27],
    };

    const boxW = (contentW - 4) / 2;
    const boxH = 20;
    const severities = ['low', 'medium', 'high', 'critical'];

    severities.forEach((s, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = margin + col * (boxW + 4);
      const by = y + row * (boxH + 4);
      const count = allPoints.filter(p => p.severity === s).length;
      doc.setFillColor(...sevColors[s]);
      doc.roundedRect(bx, by, boxW, boxH, 2, 2, 'F');
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...sevTextColors[s]);
      doc.text(String(count), bx + boxW / 2, by + 12, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60);
      doc.text(severityLabel[s], bx + boxW / 2, by + 18, { align: 'center' });
    });
    y += boxH * 2 + 12;

    // Total
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);
    doc.text(`Totalt antal noteringar: ${allPoints.length}`, margin, y);
    y += 10;

    // Notes
    if (inspection.notes) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20);
      doc.text('Anteckningar', margin, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60);
      const noteLines = doc.splitTextToSize(inspection.notes, contentW);
      doc.text(noteLines, margin, y);
      y += noteLines.length * 5 + 6;
    }

    // Map image on page 2
    const mapUrl = inspection.map_screenshot_url || site?.map_image_url;
    if (mapUrl) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20);
      doc.text('Platskarta', margin, y);
      y += 6;
      const mapImg = await fetchImageBase64(mapUrl);
      if (mapImg) {
        const maxImgH = 90;
        doc.addImage(mapImg.base64, mapImg.format, margin, y, contentW, maxImgH, undefined, 'FAST');
        y += maxImgH + 6;
      }
    }

    // ---- INSPECTION POINT PAGES ----
    for (let index = 0; index < allPoints.length; index++) {
      const point = allPoints[index];
      doc.addPage();
      addPageHeader(`Punkt ${index + 1} av ${allPoints.length}`);
      y = margin + 10;

      // Header row
      doc.setFillColor(31, 41, 55);
      doc.circle(margin + 6, y + 4, 6, 'F');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255);
      doc.text(String(index + 1), margin + 6, y + 6, { align: 'center' });

      const sev = point.severity || 'medium';
      doc.setFillColor(...sevColors[sev]);
      doc.roundedRect(margin + 16, y, 24, 8, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...sevTextColors[sev]);
      doc.text(severityLabel[sev].toUpperCase(), margin + 28, y + 5.5, { align: 'center' });

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20);
      const itLabel = issueTypeLabel[point.issue_type] || (point.issue_type || '').replace(/_/g, ' ');
      doc.text(itLabel, margin + 44, y + 6);
      y += 16;

      if (point.notes) {
        const noteLines = doc.splitTextToSize(point.notes, contentW - 4);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55);
        doc.text(noteLines, margin, y);
        y += noteLines.length * 5 + 6;
      }

      // Photos - max 4 per point to avoid OOM
      const photos = (point.photo_details || []).slice(0, 4);
      if (photos.length > 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60);
        doc.text(`Foton (${photos.length})`, margin, y);
        y += 6;

        const photoW = (contentW - 4) / 2;
        const photoH = 55;

        for (let pi = 0; pi < photos.length; pi++) {
          const photo = photos[pi];
          const col = pi % 2;
          if (col === 0 && pi > 0) {
            y += photoH + (photos[pi - 1]?.comment ? 16 : 6);
            if (y + photoH > pageH - margin) {
              doc.addPage();
              addPageHeader(`Punkt ${index + 1} av ${allPoints.length}`);
              y = margin + 10;
            }
          }

          const px = margin + col * (photoW + 4);
          const imgData = await fetchImageBase64(photo.url);
          if (imgData) {
            doc.addImage(imgData.base64, imgData.format, px, y, photoW, photoH, undefined, 'FAST');
          } else {
            doc.setDrawColor(200);
            doc.rect(px, y, photoW, photoH, 'S');
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text('Bild ej tillgänglig', px + photoW / 2, y + photoH / 2, { align: 'center' });
          }
          if (photo.comment) {
            doc.setFontSize(7);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(80);
            const cLines = doc.splitTextToSize(photo.comment, photoW);
            doc.text(cLines[0], px, y + photoH + 4);
          }
        }
        y += photoH + 8;
      }

      // GPS
      if (point.latitude && point.longitude) {
        if (y + 10 > pageH - margin) {
          doc.addPage();
          addPageHeader(`Punkt ${index + 1} av ${allPoints.length}`);
          y = margin + 10;
        }
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120);
        doc.text(`GPS: ${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`, margin, y + 5);
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