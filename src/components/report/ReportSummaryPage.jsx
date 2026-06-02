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

  const allCategoryDefs = [
    { key: 'improvement_suggestions', label: 'Förbättringsförslag', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' },
    { key: 'issue_damage',            label: 'Skada',               bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-600' },
    { key: 'plant_health',            label: 'Växthälsa',           bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-600' },
    { key: 'maintenance',             label: 'Underhåll',           bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-600' },
    { key: 'safety_concern',          label: 'Säkerhetsrisk',       bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
    { key: 'deviation',               label: 'Avvikelse',           bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-600' },
    { key: 'general',                 label: 'Allmänt',             bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-600' },
  ];

  const summary = getSummary();
  const total = points.length;

  const usedCategories = allCategoryDefs
    .map(def => ({ ...def, count: points.filter(p => p.issue_type === def.key).length }))
    .filter(c => c.count > 0)
    .slice(0, 4);

  return (
    <div className="flex flex-col bg-white p-4 md:p-8 print:p-0">
      <div className="space-y-3 print:space-y-2 flex-1">
        <h1 className="text-2xl font-bold text-gray-800 mb-3 print:mb-2 print:text-xl">Sammanfattning</h1>
        
        {/* Overview Card */}
        <Card className="print:shadow-none">
          <CardHeader className="print:p-3 print:pb-2">
            <CardTitle className="print:text-base">Besiktningsöversikt</CardTitle>
          </CardHeader>
          <CardContent className="print:p-3 print:pt-0">
             <div className="grid grid-cols-2 gap-3 print:gap-2">
               <div>
                 <p className="text-sm text-gray-500">Besiktningsnummer</p>
                 <p className="text-lg font-semibold font-mono bg-gray-100 px-2 py-1 rounded inline-block">{inspection.inspection_number}</p>
               </div>
               <div>
                 <p className="text-sm text-gray-500">Plats</p>
                 <p className="text-lg font-semibold">{site.name}</p>
               </div>
               <div>
                 <p className="text-sm text-gray-500">Datum</p>
                 <p className="text-lg font-semibold">
                   {new Date(inspection.inspection_date).toLocaleDateString()}
                 </p>
               </div>
               <div>
                 <p className="text-sm text-gray-500">Besiktningsman</p>
                 <p className="text-lg font-semibold">{inspection.inspector_name}</p>
               </div>
               <div>
                 <p className="text-sm text-gray-500">Totalt antal punkter</p>
                 <p className="text-lg font-semibold">{total}</p>
               </div>
             </div>
           </CardContent>
        </Card>

        {/* Severity Summary */}
        <Card className="print:shadow-none">
          <CardHeader className="print:p-3 print:pb-2">
            <CardTitle className="print:text-base">Allvarlighetsgrad</CardTitle>
          </CardHeader>
          <CardContent className="print:p-3 print:pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:gap-2">
              <div className="text-center p-4 print:p-2 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="text-3xl print:text-2xl font-bold text-blue-600">{summary.low}</div>
                <div className="text-xs print:text-[10px] text-gray-600 mt-1">Låg</div>
                <div className="text-xs print:text-[9px] text-gray-500">
                  {total > 0 ? Math.round((summary.low / total) * 100) : 0}%
                </div>
              </div>
              <div className="text-center p-4 print:p-2 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                <div className="text-3xl print:text-2xl font-bold text-yellow-600">{summary.medium}</div>
                <div className="text-xs print:text-[10px] text-gray-600 mt-1">Medel</div>
                <div className="text-xs print:text-[9px] text-gray-500">
                  {total > 0 ? Math.round((summary.medium / total) * 100) : 0}%
                </div>
              </div>
              <div className="text-center p-4 print:p-2 bg-orange-50 rounded-lg border-2 border-orange-200">
                <div className="text-3xl print:text-2xl font-bold text-orange-600">{summary.high}</div>
                <div className="text-xs print:text-[10px] text-gray-600 mt-1">Hög</div>
                <div className="text-xs print:text-[9px] text-gray-500">
                  {total > 0 ? Math.round((summary.high / total) * 100) : 0}%
                </div>
              </div>
              <div className="text-center p-4 print:p-2 bg-red-50 rounded-lg border-2 border-red-200">
                <div className="text-3xl print:text-2xl font-bold text-red-600">{summary.critical}</div>
                <div className="text-xs print:text-[10px] text-gray-600 mt-1">Kritisk</div>
                <div className="text-xs print:text-[9px] text-gray-500">
                  {total > 0 ? Math.round((summary.critical / total) * 100) : 0}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        {usedCategories.length > 0 && (
          <Card className="print:shadow-none">
            <CardHeader className="print:p-3 print:pb-2">
              <CardTitle className="print:text-base">Ärendekategorier</CardTitle>
            </CardHeader>
            <CardContent className="print:p-3 print:pt-0">
              <div className="grid grid-cols-2 gap-3 print:gap-2">
                {usedCategories.map(cat => (
                  <div key={cat.key} className={`p-3 print:p-2 ${cat.bg} rounded-lg border ${cat.border}`}>
                    <div className={`text-2xl print:text-xl font-bold ${cat.text}`}>{cat.count}</div>
                    <div className="text-xs print:text-[10px] text-gray-600 mt-1">{cat.label}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {total > 0 ? Math.round((cat.count / total) * 100) : 0}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Findings */}
        <Card className="print:shadow-none">
          <CardHeader className="print:p-3 print:pb-2">
            <CardTitle className="print:text-base">Viktiga iakttagelser</CardTitle>
          </CardHeader>
          <CardContent className="print:p-3 print:pt-0">
            <div className="space-y-2 print:space-y-1">
              {summary.critical > 0 && (
                <div className="flex items-start gap-2 p-2 print:p-1.5 bg-red-50 rounded-lg border border-red-200">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-1.5 print:mt-1"></div>
                  <p className="text-sm print:text-xs text-gray-700">
                    <span className="font-semibold text-red-600">{summary.critical}</span> kritisk{summary.critical > 1 ? 'a' : ''} punkt{summary.critical > 1 ? 'er' : ''} som kräver omedelbar åtgärd
                  </p>
                </div>
              )}
              {summary.high > 0 && (
                <div className="flex items-start gap-2 p-2 print:p-1.5 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-1.5 print:mt-1"></div>
                  <p className="text-sm print:text-xs text-gray-700">
                    <span className="font-semibold text-orange-600">{summary.high}</span> punkt{summary.high > 1 ? 'er' : ''} med hög prioritet identifierad{summary.high > 1 ? 'e' : ''}
                  </p>
                </div>
              )}
              {summary.medium > 0 && (
                <div className="flex items-start gap-2 p-2 print:p-1.5 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="w-2 h-2 bg-yellow-600 rounded-full mt-1.5 print:mt-1"></div>
                  <p className="text-sm print:text-xs text-gray-700">
                    <span className="font-semibold text-yellow-600">{summary.medium}</span> observation{summary.medium > 1 ? 'er' : ''} med medelhög prioritet
                  </p>
                </div>
              )}
              {summary.low > 0 && (
                <div className="flex items-start gap-2 p-2 print:p-1.5 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 print:mt-1"></div>
                  <p className="text-sm print:text-xs text-gray-700">
                    <span className="font-semibold text-blue-600">{summary.low}</span> notering{summary.low > 1 ? 'ar' : ''} med låg prioritet
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {inspection.notes && (
          <Card className="print:shadow-none">
            <CardHeader className="print:p-3 print:pb-2">
              <CardTitle className="print:text-base">Allmänna anteckningar</CardTitle>
            </CardHeader>
            <CardContent className="print:p-3 print:pt-0">
              <p className="text-sm print:text-xs text-gray-700 whitespace-pre-wrap">{inspection.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}