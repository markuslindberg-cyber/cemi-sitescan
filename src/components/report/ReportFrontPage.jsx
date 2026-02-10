import React from 'react';

export default function ReportFrontPage({ inspection, site, customer }) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-white print:break-after-page p-0 print:p-8">
      {/* Header with logos */}
      <div className="hidden print:block border-b border-gray-300 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 bg-red-600 flex items-center justify-center" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%)' }}>
              <div className="text-white font-bold text-xl">C</div>
            </div>
            <span className="text-2xl font-bold text-gray-800">CEMI</span>
          </div>
          <div className="h-12 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            </div>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            </div>
            <span className="text-lg font-semibold text-gray-700 ml-1">
              <span className="font-bold">phm</span> partner
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          {inspection.report_title || 'Garden Inspection Report'}
        </h1>
        
        <div className="w-24 h-1 bg-red-600 mb-8"></div>
        
        <h2 className="text-3xl text-gray-700 mb-12">{site.name}</h2>
        
        <div className="bg-gray-50 rounded-lg p-8 max-w-2xl w-full space-y-4 text-left">
          {customer && (
            <div className="border-b pb-4">
              <p className="text-sm text-gray-500 uppercase tracking-wide">Customer</p>
              <p className="text-xl font-semibold text-gray-800">{customer.name}</p>
              {customer.project_number && (
                <p className="text-gray-600">Project Number: {customer.project_number}</p>
              )}
            </div>
          )}
          
          <div className="border-b pb-4">
            <p className="text-sm text-gray-500 uppercase tracking-wide">Inspection Date</p>
            <p className="text-xl font-semibold text-gray-800">
              {new Date(inspection.inspection_date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          <div className="border-b pb-4">
            <p className="text-sm text-gray-500 uppercase tracking-wide">Inspector</p>
            <p className="text-xl font-semibold text-gray-800">{inspection.inspector_name}</p>
          </div>
          
          {site.location && (
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide">Location</p>
              <p className="text-xl font-semibold text-gray-800">{site.location}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer with cityscape */}
      <div className="hidden print:block mt-8">
        <div className="relative h-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-green-50"></div>
          <div className="absolute top-2 left-20 w-16 h-8 bg-green-100 rounded-full opacity-60"></div>
          <div className="absolute top-4 right-32 w-12 h-6 bg-green-100 rounded-full opacity-60"></div>
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-1">
            <div className="w-8 h-8 bg-green-600 rounded-full mb-2"></div>
            <div className="w-6 h-16 bg-red-900"></div>
            <div className="w-8 h-24 bg-red-800"></div>
            <div className="w-10 h-20 bg-orange-300"></div>
            <div className="w-8 h-8 bg-green-500 rounded-full mb-2"></div>
            <div className="w-12 h-32 bg-red-700"></div>
            <div className="w-10 h-28 bg-orange-200"></div>
            <div className="w-8 h-8 bg-green-600 rounded-full mb-2"></div>
            <div className="w-8 h-20 bg-red-900"></div>
            <div className="w-14 h-36 bg-red-800"></div>
            <div className="w-8 h-8 bg-green-500 rounded-full mb-2"></div>
            <div className="w-10 h-24 bg-orange-300"></div>
            <div className="w-8 h-16 bg-red-700"></div>
            <div className="w-8 h-8 bg-green-600 rounded-full mb-2"></div>
            <div className="w-12 h-28 bg-red-900"></div>
            <div className="w-8 h-8 bg-green-500 rounded-full mb-2"></div>
            <div className="w-10 h-20 bg-orange-200"></div>
            <div className="w-8 h-24 bg-red-800"></div>
            <div className="w-8 h-8 bg-green-600 rounded-full mb-2"></div>
          </div>
          <div className="absolute bottom-8 left-1/4 bg-white px-2 py-1 rounded shadow-sm">
            <span className="text-red-600 font-bold text-sm">C CEMI</span>
          </div>
        </div>
      </div>
    </div>
  );
}