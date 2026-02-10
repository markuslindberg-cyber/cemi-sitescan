/* Print-specific styles for professional PDF reports */

@media print {
  /* Page setup */
  @page {
    size: A4;
    margin: 2cm 1.5cm;
  }

  body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Report page layout */
  .report-page {
    padding: 0 !important;
    margin: 0 !important;
  }

  .report-content {
    padding-top: 60px; /* Space for header */
    padding-bottom: 120px; /* Space for footer */
  }

  /* Report sections */
  .report-section {
    page-break-inside: avoid;
    margin-bottom: 30px;
    padding: 20px 0;
  }

  .report-section:first-child {
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 25px;
  }

  /* Map section */
  .map-section {
    page-break-before: always;
    page-break-after: always;
  }

  .map-container {
    position: relative;
    width: 100%;
    max-height: 650px;
    background: #f9fafb;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
  }

  .map-image {
    width: 100%;
    height: auto;
    max-height: 650px;
    object-fit: contain;
    display: block;
  }

  .map-marker {
    position: absolute;
    transform: translate(-50%, -100%);
  }

  .marker-pin {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  /* Inspection points */
  .inspection-point {
    page-break-inside: avoid;
    margin-bottom: 25px;
    padding-bottom: 25px;
    border-bottom: 1px solid #e5e7eb;
  }

  .inspection-point:last-child {
    border-bottom: none;
  }

  .point-number {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    background: #f3f4f6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 16px;
    color: #374151;
  }

  /* Photos section */
  .photos-section {
    margin-top: 15px;
  }

  .photos-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin-top: 10px;
  }

  .photo-item {
    page-break-inside: avoid;
  }

  .photo-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    display: block;
  }

  .photo-comment {
    margin-top: 6px;
    font-size: 11px;
    color: #6b7280;
    font-style: italic;
    background: #f9fafb;
    padding: 8px;
    border-radius: 4px;
  }

  /* GPS info */
  .gps-info {
    margin-top: 10px;
    font-size: 11px;
    color: #6b7280;
    background: #f9fafb;
    padding: 8px 12px;
    border-radius: 4px;
  }

  /* Typography adjustments for print */
  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
  }

  p {
    orphans: 3;
    widows: 3;
  }

  /* Hide screen-only elements */
  nav, .print\:hidden {
    display: none !important;
  }

  /* Ensure proper color rendering */
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}

/* Screen styles for report preview */
@media screen {
  .report-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .report-content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .report-section {
    margin-bottom: 2rem;
  }

  .map-container {
    position: relative;
    width: 100%;
    background: #f9fafb;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
  }

  .map-image {
    width: 100%;
    height: auto;
    display: block;
  }

  .map-marker {
    position: absolute;
    transform: translate(-50%, -100%);
  }

  .marker-pin {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 2px solid white;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .inspection-point {
    margin-bottom: 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .inspection-point:last-child {
    border-bottom: none;
  }

  .point-number {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    background: #f3f4f6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 18px;
    color: #374151;
  }

  .photos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .photo-image {
    width: 100%;
    height: 250px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .photo-comment {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;
    font-style: italic;
    background: #f9fafb;
    padding: 0.5rem;
    border-radius: 4px;
  }

  .gps-info {
    margin-top: 0.75rem;
    font-size: 0.875rem;
    color: #6b7280;
    background: #f9fafb;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
  }
}