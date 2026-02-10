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
      {/* Front Page */}
      <ReportFrontPage inspection={inspection} site={site} customer={customer} />
      
      {/* Summary Page */}
      <ReportSummaryPage inspection={inspection} site={site} customer={customer} points={points} />
      
      {/* Detailed Report Pages */}
      <div className="space-y-6 bg-white print:bg-white p-0 print:p-8 print:break-before-page print:pt-24 print:pb-40">
        <ReportHeader />
        
        <Card className="print:shadow-none">
          <CardHeader className="border-b">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">Detailed Inspection Report</CardTitle>
                <h2 className="text-xl text-gray-700">{site.name}</h2>
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
          </CardHeader>
          <CardContent className="p-6">
            {customer && (
              <div className="mb-4 pb-4 border-b">
                <p className="text-sm text-gray-500">Customer</p>
                <p className="text-lg font-semibold text-gray-800">{customer.name}</p>
                {customer.project_number && (
                  <p className="text-sm text-gray-600">Project: {customer.project_number}</p>
                )}
              </div>
            )}
            {site.location && (
              <div className="flex items-center gap-2 text-gray-700 mb-4">
                <MapPin className="w-4 h-4" />
                {site.location}
              </div>
            )}
            {site.description && (
              <p className="text-gray-600 mb-4">{site.description}</p>
            )}
          </CardContent>
        </Card>

        {site.map_image_url && (
          <Card className="print:shadow-none print:break-inside-avoid">
            <CardHeader>
              <CardTitle>Annotated Map</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={site.map_image_url}
                  alt="Site map"
                  className="w-full object-contain"
                />
                {points.map((point, index) => (
                  <div
                    key={point.id}
                    className="absolute transform -translate-x-1/2 -translate-y-full"
                    style={{
                      left: `${point.x_position}%`,
                      top: `${point.y_position}%`
                    }}
                  >
                    <div className={`w-8 h-8 rounded-full ${markerColors[point.severity || 'medium']} border-2 flex items-center justify-center shadow-lg`}>
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="print:shadow-none">
          <CardHeader>
            <CardTitle>Inspection Points ({points.length})</CardTitle>
          </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {points.map((point, index) => (
              <div key={point.id} className="border-b last:border-b-0 pb-6 last:pb-0 print:break-inside-avoid">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-lg">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="secondary" className={`${severityColors[point.severity || 'medium']} border`}>
                        {point.severity || 'medium'} severity
                      </Badge>
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {point.issue_type?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    
                    {point.notes && (
                      <p className="text-gray-700 mb-3 whitespace-pre-wrap">{point.notes}</p>
                    )}

                    {point.photo_details && point.photo_details.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Camera className="w-4 h-4" />
                          Photos ({point.photo_details.length})
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {point.photo_details.map((photo, photoIndex) => (
                            <div key={photoIndex} className="space-y-2">
                              <img
                                src={photo.url}
                                alt={`Point ${index + 1} photo ${photoIndex + 1}`}
                                className="w-full h-64 object-cover rounded-lg border"
                              />
                              {photo.comment && (
                                <p className="text-sm text-gray-600 italic bg-gray-50 p-2 rounded">
                                  {photo.comment}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {point.latitude && point.longitude && (
                      <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        GPS: {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          </CardContent>
        </Card>

        <ReportFooter />
      </div>
    </>
  );
}