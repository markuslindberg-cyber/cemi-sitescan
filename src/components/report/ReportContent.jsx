import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, MapPin, Camera } from 'lucide-react';
import ReportFrontPage from './ReportFrontPage';
import ReportSummaryPage from './ReportSummaryPage';
import ReportHeader from './ReportHeader';
import ReportFooter from './ReportFooter';

const severityColors = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200'
};

const markerColors = {
  low: 'bg-blue-500 border-blue-600',
  medium: 'bg-yellow-500 border-yellow-600',
  high: 'bg-orange-500 border-orange-600',
  critical: 'bg-red-500 border-red-600'
};

export default function ReportContent({ inspection, site, customer, points }) {
  const getSummary = () => {
    const summary = {
      low: points.filter(p => p.severity === 'low').length,
      medium: points.filter(p => p.severity === 'medium').length,
      high: points.filter(p => p.severity === 'high').length,
      critical: points.filter(p => p.severity === 'critical').length
    };
    return summary;
  };

  const summary = getSummary();

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 2cm 1.5cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .report-page { padding: 0 !important; margin: 0 !important; }
          .report-content { padding-top: 60px; padding-bottom: 120px; }
          .report-section { page-break-inside: avoid; margin-bottom: 30px; padding: 20px 0; }
          .report-section:first-child { border-bottom: 2px solid #e5e7eb; padding-bottom: 25px; }
          .map-section { page-break-before: always; page-break-after: always; }
          .map-container { position: relative; width: 100%; max-height: 650px; background: #f9fafb; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; }
          .map-image { width: 100%; height: auto; max-height: 650px; object-fit: contain; display: block; }
          .map-marker { position: absolute; transform: translate(-50%, -100%); }
          .marker-pin { width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); }
          .inspection-point { page-break-inside: avoid; margin-bottom: 25px; padding-bottom: 25px; border-bottom: 1px solid #e5e7eb; }
          .inspection-point:last-child { border-bottom: none; }
          .point-number { flex-shrink: 0; width: 36px; height: 36px; background: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; color: #374151; }
          .photos-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 10px; }
          .photo-item { page-break-inside: avoid; }
          .photo-image { width: 100%; height: 200px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb; display: block; }
          .photo-comment { margin-top: 6px; font-size: 11px; color: #6b7280; font-style: italic; background: #f9fafb; padding: 8px; border-radius: 4px; }
          .gps-info { margin-top: 10px; font-size: 11px; color: #6b7280; background: #f9fafb; padding: 8px 12px; border-radius: 4px; }
          h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }
          p { orphans: 3; widows: 3; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @media screen {
          .report-page { max-width: 1200px; margin: 0 auto; padding: 2rem; }
          .report-content { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
          .report-section { margin-bottom: 2rem; }
          .map-container { position: relative; width: 100%; background: #f9fafb; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; }
          .map-image { width: 100%; height: auto; display: block; }
          .map-marker { position: absolute; transform: translate(-50%, -100%); }
          .marker-pin { width: 32px; height: 32px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); }
          .inspection-point { margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid #e5e7eb; }
          .inspection-point:last-child { border-bottom: none; }
          .point-number { flex-shrink: 0; width: 40px; height: 40px; background: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; color: #374151; }
          .photos-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }
          .photo-image { width: 100%; height: 250px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb; }
          .photo-comment { margin-top: 0.5rem; font-size: 0.875rem; color: #6b7280; font-style: italic; background: #f9fafb; padding: 0.5rem; border-radius: 4px; }
          .gps-info { margin-top: 0.75rem; font-size: 0.875rem; color: #6b7280; background: #f9fafb; padding: 0.5rem 0.75rem; border-radius: 4px; }
        }
      `}</style>
      {/* Front Page */}
      <ReportFrontPage inspection={inspection} site={site} customer={customer} />
      
      {/* Summary Page */}
      <ReportSummaryPage inspection={inspection} site={site} customer={customer} points={points} />
      
      {/* Detailed Report Pages */}
      <div className="report-page bg-white print:bg-white p-0 print:break-before-page">
        <ReportHeader />

        <div className="report-content">
          <div className="report-section">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {inspection.report_title || 'Detailed Inspection Report'}
                </h1>
                <h2 className="text-xl text-gray-600">{site.name}</h2>
              </div>
              <div className="text-right text-sm text-gray-600">
                <div className="flex items-center gap-2 justify-end mb-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(inspection.inspection_date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <User className="w-4 h-4" />
                  {inspection.inspector_name}
                </div>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              {customer && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Customer</p>
                  <p className="text-base font-semibold text-gray-900">{customer.name}</p>
                  {customer.project_number && (
                    <p className="text-sm text-gray-600">Project: {customer.project_number}</p>
                  )}
                </div>
              )}
              {site.location && (
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{site.location}</span>
                </div>
              )}
              {site.description && (
                <p className="text-sm text-gray-600">{site.description}</p>
              )}
            </div>
          </div>

          {site.map_image_url && (
            <div className="report-section map-section">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Annotated Map</h2>
              <div className="map-container">
                <img
                  src={site.map_image_url}
                  alt="Site map"
                  className="map-image"
                />
                {points.map((point, index) => (
                  <div
                    key={point.id}
                    className="map-marker"
                    style={{
                      left: `${point.x_position}%`,
                      top: `${point.y_position}%`
                    }}
                  >
                    <div className={`marker-pin ${markerColors[point.severity || 'medium']}`}>
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="report-section">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Inspection Points ({points.length})</h2>
            <div className="space-y-8">
              {points.map((point, index) => (
                <div key={point.id} className="inspection-point">
                  <div className="flex items-start gap-4">
                    <div className="point-number">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant="secondary" className={`${severityColors[point.severity || 'medium']} border text-xs px-2 py-1`}>
                          {point.severity || 'medium'}
                        </Badge>
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {point.issue_type?.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {point.notes && (
                        <p className="text-sm text-gray-700 mb-4 leading-relaxed">{point.notes}</p>
                      )}

                      {point.photo_details && point.photo_details.length > 0 && (
                        <div className="photos-section">
                          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                            <Camera className="w-3.5 h-3.5" />
                            Photos ({point.photo_details.length})
                          </div>
                          <div className="photos-grid">
                            {point.photo_details.map((photo, photoIndex) => (
                              <div key={photoIndex} className="photo-item">
                                <img
                                  src={photo.url}
                                  alt={`Point ${index + 1} photo ${photoIndex + 1}`}
                                  className="photo-image"
                                />
                                {photo.comment && (
                                  <p className="photo-comment">
                                    {photo.comment}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {point.latitude && point.longitude && (
                        <div className="gps-info">
                          GPS: {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <ReportFooter />
      </div>
    </>
  );
}