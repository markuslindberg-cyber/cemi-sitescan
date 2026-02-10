import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, MapPin, Camera } from 'lucide-react';

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

export default function ReportContent({ inspection, site, points }) {
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
    <div className="space-y-6 bg-white print:bg-white">
      <Card className="print:shadow-none">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl mb-2">Inspection Report</CardTitle>
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
          {site.location && (
            <div className="flex items-center gap-2 text-gray-700 mb-4">
              <MapPin className="w-4 h-4" />
              {site.location}
            </div>
          )}
          {site.description && (
            <p className="text-gray-600 mb-4">{site.description}</p>
          )}
          {inspection.notes && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">General Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{inspection.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="print:shadow-none">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{summary.low}</div>
              <div className="text-sm text-gray-600 mt-1">Low Severity</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">{summary.medium}</div>
              <div className="text-sm text-gray-600 mt-1">Medium Severity</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">{summary.high}</div>
              <div className="text-sm text-gray-600 mt-1">High Severity</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">{summary.critical}</div>
              <div className="text-sm text-gray-600 mt-1">Critical Severity</div>
            </div>
          </div>
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

                    {point.photo_urls && point.photo_urls.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Camera className="w-4 h-4" />
                          Photos ({point.photo_urls.length})
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {point.photo_urls.map((url, photoIndex) => (
                            <img
                              key={photoIndex}
                              src={url}
                              alt={`Point ${index + 1} photo ${photoIndex + 1}`}
                              className="w-full h-48 object-cover rounded-lg border"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="print:block hidden text-center text-sm text-gray-600 pt-6 border-t">
        <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        <p className="mt-1">Garden Inspection App</p>
      </div>
    </div>
  );
}