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

    // Try supabase render first, fall back to direct URL
    const toResizedUrl = (url) => {
      // base44.app/api/apps/{appId}/files/mp/public/{appId}/{file}
      const base44Match = url.match(/base44\.app\/api\/apps\/([^/]+)\/files\/mp\/public\/([^/]+)\/([^?]+)/);
      if (base44Match) {
        return `https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/render/image/public/base44-prod/public/${base44Match[2]}/${base44Match[3]}?width=900&quality=70&resize=contain`;
      }
      const supabaseMatch = url.match(/https:\/\/([^/]+\.supabase\.co)\/storage\/v1\/object\/public\/([^?]+)/);
      if (supabaseMatch) {
        return `https://${supabaseMatch[1]}/storage/v1/render/image/public/${supabaseMatch[2]}?width=900&quality=70&resize=contain`;
      }
      return url;
    };

    // Fetch image as base64, trying resized then original URL
    const fetchImageBase64 = async (url) => {
      if (!url) return null;
      const attempts = [toResizedUrl(url), url];
      for (const attemptUrl of attempts) {
        try {
          const res = await fetch(attemptUrl, { redirect: 'follow' });
          if (!res.ok) continue;
          const buf = await res.arrayBuffer();
          if (buf.byteLength > 3 * 1024 * 1024) continue; // skip > 3MB
          const bytes = new Uint8Array(buf);
          const chunkSize = 8192;
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
          }
          const base64 = btoa(binary);
          const ct = res.headers.get('content-type') || 'image/jpeg';
          const format = ct.includes('png') ? 'PNG' : 'JPEG';
          console.log(`OK image (${buf.byteLength} bytes): ${attemptUrl}`);
          return { base64, format };
        } catch (e) {
          console.log(`Failed: ${attemptUrl} -> ${e.message}`);
        }
      }
      return null;
    };

    // Pre-fetch all images in parallel to save time
    const mapUrl = inspection.map_screenshot_url || site?.map_image_url;
    const logoUrl = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/render/image/public/base44-prod/public/698b067db5e721251596eb5e/0e240ccf1_image.png';

    // Fetch images in small batches to avoid memory limit
    const allPhotoUrls = allPoints.flatMap(p => (p.photo_details || []).slice(0, 2).map(ph => ph.url));
    const uniqueUrls = [...new Set([logoUrl, mapUrl, ...allPhotoUrls].filter(Boolean))];
    const imageCache = {};
    const batchSize = 3;
    for (let i = 0; i < uniqueUrls.length; i += batchSize) {
      const batch = uniqueUrls.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(url => fetchImageBase64(url)));
      batch.forEach((url, idx) => { imageCache[url] = results[idx]; });
    }
    const getImage = (url) => url ? imageCache[url] || null : null;

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

    // Logo
    const logoImg = getImage(logoUrl);
    if (logoImg) {
      const logoH = 18;
      const logoW = 50;
      doc.addImage(logoImg.base64, logoImg.format, margin, y, logoW, logoH, undefined, 'FAST');
      y += logoH + 8;
    } else {
      y += 4;
    }

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
    if (mapUrl) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20);
      doc.text('Platskarta', margin, y);
      y += 6;
      const mapImg = getImage(mapUrl);
      if (mapImg) {
        const maxImgH = 100;
        doc.addImage(mapImg.base64, mapImg.format, margin, y, contentW, maxImgH, undefined, 'FAST');

        // Draw inspection point markers on top of the map
        const markerColors = {
          low: [59, 130, 246],
          medium: [234, 179, 8],
          high: [249, 115, 22],
          critical: [239, 68, 68],
        };
        allPoints.forEach((point, idx) => {
          if (point.x_position == null || point.y_position == null) return;
          const mx = margin + (point.x_position / 100) * contentW;
          const my = y + (point.y_position / 100) * maxImgH;
          const color = markerColors[point.severity] || markerColors.medium;
          doc.setFillColor(...color);
          doc.circle(mx, my, 3.5, 'F');
          doc.setFontSize(6);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.text(String(idx + 1), mx, my + 2, { align: 'center' });
        });

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

      // Photos - max 2 per point for performance
      const photos = (point.photo_details || []).slice(0, 2);
      if (photos.length > 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60);
        doc.text(`Foton (${photos.length})`, margin, y);
        y += 6;

        const photoW = (contentW - 4) / 2;
        const photoH = 55;

        const photoImages = photos.map(p => getImage(p.url));

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
          const imgData = photoImages[pi];
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

    const pdfBase64 = doc.output('datauristring');

    return Response.json({
      pdf_base64: pdfBase64,
      filename: `rapport-${inspection.inspection_number || inspectionId}.pdf`,
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});