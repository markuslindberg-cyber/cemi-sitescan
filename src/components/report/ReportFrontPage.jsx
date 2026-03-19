import React from 'react';

export default function ReportFrontPage({ inspection, site, customer }) {
  return (
    <div className="flex-1 flex flex-col justify-center bg-white p-4 md:p-8 print:p-0">
      {/* Main content */}
      <div className="flex flex-col items-center justify-center text-center px-4 md:px-8">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698b067db5e721251596eb5e/0e240ccf1_image.png" 
          alt="CEMI Logo" 
          className="h-40 md:h-48 object-contain mb-8"
        />
        <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-4">
          {inspection.report_title || 'Trädgårdsbesiktningsrapport'}
        </h1>

        <div className="w-24 h-1 bg-red-600 mb-6 md:mb-8"></div>

        <h2 className="text-2xl md:text-3xl text-gray-700 mb-8 md:mb-12">{site.name}</h2>
        
        <div className="bg-gray-50 rounded-lg p-8 max-w-2xl w-full space-y-4 text-left">
          {customer && (
            <div className="border-b pb-4">
              <p className="text-sm text-gray-500 uppercase tracking-wide">Kund</p>
              <p className="text-xl font-semibold text-gray-800">{customer.name}</p>
              {customer.project_number && (
                <p className="text-gray-600">Projektnummer: {customer.project_number}</p>
              )}
            </div>
          )}
          
          <div className="border-b pb-4">
            <p className="text-sm text-gray-500 uppercase tracking-wide">Besiktningsdatum</p>
            <p className="text-xl font-semibold text-gray-800">
              {new Date(inspection.inspection_date).toLocaleDateString('sv-SE', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          <div className="border-b pb-4">
            <p className="text-sm text-gray-500 uppercase tracking-wide">Besiktningsman</p>
            <p className="text-xl font-semibold text-gray-800">{inspection.inspector_name}</p>
          </div>
          
          {site.location && (
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Plats</p>
              <p className="text-xl font-semibold text-gray-800">{site.location}</p>
            </div>
          )}
        </div>
        </div>
        </div>
  );
}