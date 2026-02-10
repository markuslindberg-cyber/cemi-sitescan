import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportSummaryPage({ inspection, site, customer, points }) {
  const getSummary = () => {
    const summary = {
      low: points.filter(p => p.severity === 'low').length,
      medium: points.filter(p => p.severity === 'medium').length,
      high: points.filter(p => p.severity === 'high').length,
      critical: points.filter(p => p.severity === 'critical').length
    };
    return summary;
  };

  const getCategorySummary = () => {
    const categories = {
      improvement_suggestions: points.filter(p => p.issue_type === 'improvement_suggestions').length,
      issue_damage: points.filter(p => p.issue_type === 'issue_damage').length,
      plant_health: points.filter(p => p.issue_type === 'plant_health').length,
      maintenance: points.filter(p => p.issue_type === 'maintenance').length,
      safety_concern: points.filter(p => p.issue_type === 'safety_concern').length
    };
    return categories;
  };

  const summary = getSummary();
  const categories = getCategorySummary();
  const total = points.length;

  return (
    <div className="min-h-screen bg-white print:break-after-page p-0 print:p-8">
      
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Executive Summary</h1>
        
        {/* Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Inspection Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Site</p>
                <p className="text-lg font-semibold">{site.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="text-lg font-semibold">
                  {new Date(inspection.inspection_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Inspector</p>
                <p className="text-lg font-semibold">{inspection.inspector_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Inspection Points</p>
                <p className="text-lg font-semibold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Severity Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="text-4xl font-bold text-blue-600">{summary.low}</div>
                <div className="text-sm text-gray-600 mt-2">Low Severity</div>
                <div className="text-xs text-gray-500 mt-1">
                  {total > 0 ? Math.round((summary.low / total) * 100) : 0}%
                </div>
              </div>
              <div className="text-center p-6 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                <div className="text-4xl font-bold text-yellow-600">{summary.medium}</div>
                <div className="text-sm text-gray-600 mt-2">Medium Severity</div>
                <div className="text-xs text-gray-500 mt-1">
                  {total > 0 ? Math.round((summary.medium / total) * 100) : 0}%
                </div>
              </div>
              <div className="text-center p-6 bg-orange-50 rounded-lg border-2 border-orange-200">
                <div className="text-4xl font-bold text-orange-600">{summary.high}</div>
                <div className="text-sm text-gray-600 mt-2">High Severity</div>
                <div className="text-xs text-gray-500 mt-1">
                  {total > 0 ? Math.round((summary.high / total) * 100) : 0}%
                </div>
              </div>
              <div className="text-center p-6 bg-red-50 rounded-lg border-2 border-red-200">
                <div className="text-4xl font-bold text-red-600">{summary.critical}</div>
                <div className="text-sm text-gray-600 mt-2">Critical Severity</div>
                <div className="text-xs text-gray-500 mt-1">
                  {total > 0 ? Math.round((summary.critical / total) * 100) : 0}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Issue Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-3xl font-bold text-purple-600">{categories.improvement_suggestions}</div>
                <div className="text-sm text-gray-600 mt-2">Improvement Suggestions</div>
                <div className="text-xs text-gray-500 mt-1">
                  {total > 0 ? Math.round((categories.improvement_suggestions / total) * 100) : 0}%
                </div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-3xl font-bold text-red-600">{categories.issue_damage}</div>
                <div className="text-sm text-gray-600 mt-2">Issue / Damage</div>
                <div className="text-xs text-gray-500 mt-1">
                  {total > 0 ? Math.round((categories.issue_damage / total) * 100) : 0}%
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-3xl font-bold text-green-600">{categories.plant_health}</div>
                <div className="text-sm text-gray-600 mt-2">Plant Health</div>
                <div className="text-xs text-gray-500 mt-1">
                  {total > 0 ? Math.round((categories.plant_health / total) * 100) : 0}%
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{categories.maintenance}</div>
                <div className="text-sm text-gray-600 mt-2">Maintenance</div>
                <div className="text-xs text-gray-500 mt-1">
                  {total > 0 ? Math.round((categories.maintenance / total) * 100) : 0}%
                </div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-3xl font-bold text-orange-600">{categories.safety_concern}</div>
                <div className="text-sm text-gray-600 mt-2">Safety Concern</div>
                <div className="text-xs text-gray-500 mt-1">
                  {total > 0 ? Math.round((categories.safety_concern / total) * 100) : 0}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Findings */}
        <Card>
          <CardHeader>
            <CardTitle>Key Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.critical > 0 && (
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                  <p className="text-gray-700">
                    <span className="font-semibold text-red-600">{summary.critical}</span> critical issue{summary.critical > 1 ? 's' : ''} requiring immediate attention
                  </p>
                </div>
              )}
              {summary.high > 0 && (
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                  <p className="text-gray-700">
                    <span className="font-semibold text-orange-600">{summary.high}</span> high priority item{summary.high > 1 ? 's' : ''} identified
                  </p>
                </div>
              )}
              {summary.medium > 0 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
                  <p className="text-gray-700">
                    <span className="font-semibold text-yellow-600">{summary.medium}</span> medium priority observation{summary.medium > 1 ? 's' : ''}
                  </p>
                </div>
              )}
              {summary.low > 0 && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <p className="text-gray-700">
                    <span className="font-semibold text-blue-600">{summary.low}</span> low priority note{summary.low > 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {inspection.notes && (
          <Card>
            <CardHeader>
              <CardTitle>General Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{inspection.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <ReportFooter />
    </div>
  );
}