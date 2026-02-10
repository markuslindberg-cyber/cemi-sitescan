import React from 'react';

export default function ReportHeader() {
  return (
    <div className="border-b border-gray-300 pb-4 mb-6 print:pb-2 print:mb-4">
      <div className="flex items-center gap-4">
        {/* CEMI Logo */}
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 bg-red-600 flex items-center justify-center" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%)' }}>
            <div className="text-white font-bold text-xl">C</div>
          </div>
          <span className="text-2xl font-bold text-gray-800">CEMI</span>
        </div>
        
        {/* Divider */}
        <div className="h-12 w-px bg-gray-300"></div>
        
        {/* PHM Partner Logo */}
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
  );
}