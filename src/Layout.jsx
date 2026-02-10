import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Building2, Users, FileText } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const navItems = [
    { name: 'Sites', path: 'Home', icon: Building2 },
    { name: 'Customers', path: 'Customers', icon: Users },
    { name: 'Inspections', path: 'Inspections', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-red-600 flex items-center justify-center" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%)' }}>
                    <div className="text-white font-bold text-lg">C</div>
                  </div>
                  <span className="text-xl font-bold text-gray-800">CEMI</span>
                </div>
                <div className="h-8 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                  </div>
                  <span className="text-base font-semibold text-gray-700 ml-1">
                    <span className="font-bold">phm</span> partner
                  </span>
                </div>
              </div>
              <div className="hidden md:flex gap-1 ml-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPageName === item.path;
                  return (
                    <Link key={item.path} to={createPageUrl(item.path)}>
                      <button
                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                          isActive
                            ? 'bg-green-100 text-green-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.name}
                      </button>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="flex-1">{children}</div>
      
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-600 flex items-center justify-center" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%)' }}>
                <div className="text-white font-bold">C</div>
              </div>
              <span className="text-lg font-bold text-gray-800">CEMI</span>
            </div>
            <p className="text-sm text-gray-600">© {new Date().getFullYear()} CEMI. Garden Inspection Management System.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}