import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, MapPin, Camera } from 'lucide-react';
import ReportFrontPage from './ReportFrontPage';
import ReportSummaryPage from './ReportSummaryPage';

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
          @page { 
            size: A4 portrait; 
            margin: 20mm;
          }
          html, body { 
            margin: 0 !important; 
            padding: 0 !important;
            background: white !important;
          }
          * { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
          }
          h1 { font-size: 24pt !important; }
          h2 { font-size: 18pt !important; }
          p, div { font-size: 11pt !important; }
          .inspection-point-item {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-before: always !important;
            page-break-after: auto !important;
          }
          .inspection-point-item:first-child {
            page-break-before: auto !important;
          }
        }
      `}</style>
      {/* Front Page */}
      <ReportFrontPage inspection={inspection} site={site} customer={customer} />
      
      {/* Summary Page */}
      <ReportSummaryPage inspection={inspection} site={site} customer={customer} points={points} />
      
      {/* Detailed Report Pages */}
      <div className="print:break-before-page bg-white p-4 md:p-8 print:p-0">
          {/* Header Section */}
          <div className="mb-6 pb-4 border-b-2 border-gray-300">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight">
              {inspection.report_title || 'Detailed Inspection Report'}
            </h1>
            <h2 className="text-xl md:text-2xl text-gray-700 mb-4">{site.name}</h2>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Inspection Date</p>
                <p className="text-base font-semibold text-gray-900">
                  {new Date(inspection.inspection_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Inspector</p>
                <p className="text-base font-semibold text-gray-900">{inspection.inspector_name}</p>
              </div>
              {customer && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Customer</p>
                  <p className="text-base font-semibold text-gray-900">{customer.name}</p>
                  {customer.project_number && (
                    <p className="text-sm text-gray-600">Project: {customer.project_number}</p>
                  )}
                </div>
              )}
              {site.location && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Location</p>
                  <p className="text-base text-gray-900">{site.location}</p>
                </div>
              )}
            </div>
          </div>

          {/* Map Section */}
          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Site Map Overview</h2>
            <div className="relative w-full bg-gray-50 border border-gray-300 rounded-lg overflow-hidden min-h-[300px]">
              {inspection.map_screenshot_url ? (
                <img
                  src={inspection.map_screenshot_url}
                  alt="Site map with inspection points"
                  className="w-full h-auto object-contain"
                />
              ) : site.map_image_url ? (
                  <>
                    <img
                      src={site.map_image_url}
                      alt="Site map"
                      className="w-full h-auto max-h-[600px] object-contain"
                    />
                    {points.map((point, index) => (
                      <div
                        key={point.id}
                        className="absolute transform -translate-x-1/2 -translate-y-full print:hidden"
                        style={{
                          left: `${point.x_position}%`,
                          top: `${point.y_position}%`
                        }}
                      >
                        <div className={`w-8 h-8 rounded-full border-3 border-white shadow-lg flex items-center justify-center ${markerColors[point.severity || 'medium']}`}>
                          <span className="text-white text-sm font-bold">{index + 1}</span>
                        </div>
                      </div>
                    ))}
                  </>
                ) : site.map_type === 'google_maps' && site.google_maps_center ? (
                  <div className="w-full bg-gray-50 border border-gray-300 rounded-lg overflow-hidden">
                    <iframe
                      src={`https://maps.apple.com/?ll=${site.google_maps_center.lat},${site.google_maps_center.lng}&z=${site.google_maps_zoom || 18}&t=k&adr=1`}
                      width="100%"
                      height="400"
                      style={{ border: 0 }}
                      allowFullScreen={true}
                      loading="lazy"
                      className="w-full h-[400px]"
                    />
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <p>No map configured for this site</p>
                  </div>
                )}
            </div>
          </div>

          {/* Inspection Points */}
          <div className="print:break-before-page">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Detailed Findings ({points.length} Points)</h2>
            
            {points.map((point, index) => (
              <div key={point.id} className="inspection-point-item mb-6 pb-6 border-b border-gray-200 last:border-b-0 print:break-inside-avoid">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={`${severityColors[point.severity || 'medium']} border font-semibold uppercase text-xs px-3 py-1`}>
                        {point.severity || 'medium'}
                      </Badge>
                      <span className="text-base font-semibold text-gray-800 capitalize">
                        {point.issue_type?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {point.notes && (
                      <p className="text-base text-gray-700 leading-relaxed mb-4">{point.notes}</p>
                    )}

                    {point.photo_details && point.photo_details.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-3">
                          <Camera className="w-4 h-4" />
                          Documentation ({point.photo_details.length} {point.photo_details.length === 1 ? 'Photo' : 'Photos'})
                        </div>
                        <div className="grid grid-cols-2 gap-3 print:gap-2">
                          {point.photo_details.map((photo, photoIndex) => (
                            <div key={photoIndex}>
                              <img
                                src={photo.url}
                                alt={`Point ${index + 1} photo ${photoIndex + 1}`}
                                className="w-full h-auto object-contain rounded-lg border border-gray-300"
                              />
                              {photo.comment && (
                                <p className="mt-1 text-xs text-gray-600 italic bg-gray-50 p-1.5 rounded print:text-[9pt]">
                                  {photo.comment}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {point.latitude && point.longitude && (
                      <div className="mt-3 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded inline-block">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        GPS: {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
      </div>
    </>
  );
}