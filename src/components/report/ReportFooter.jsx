import React from 'react';

export default function ReportFooter() {
  return (
    <div className="mt-8 pt-6 border-t border-gray-200 print:fixed print:bottom-0 print:left-0 print:right-0 print:bg-white">
      <div className="flex justify-end">
        <div className="w-full max-w-4xl">
          {/* Cityscape illustration */}
          <div className="relative h-32 overflow-hidden">
            {/* Sky background */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-green-50"></div>
            
            {/* Clouds */}
            <div className="absolute top-2 left-20 w-16 h-8 bg-green-100 rounded-full opacity-60"></div>
            <div className="absolute top-4 right-32 w-12 h-6 bg-green-100 rounded-full opacity-60"></div>
            
            {/* Buildings silhouette */}
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-1">
              {/* Trees and buildings pattern */}
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
            
            {/* CEMI logo on the cityscape */}
            <div className="absolute bottom-8 left-1/4 bg-white px-2 py-1 rounded shadow-sm">
              <span className="text-red-600 font-bold text-sm">C CEMI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}