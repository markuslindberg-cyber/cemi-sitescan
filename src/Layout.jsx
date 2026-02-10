import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Building2, Users, FileText, Menu, X } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const navItems = [
    { name: 'Sites', path: 'Home', icon: Building2 },
    { name: 'Customers', path: 'Customers', icon: Users },
    { name: 'Inspections', path: 'Inspections', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 10 L80 10 L80 60 L60 80 L20 80 Z" fill="#B91E3C"/>
                  <text x="50" y="62" fontFamily="Arial, sans-serif" fontSize="48" fontWeight="bold" fill="white" textAnchor="middle">C</text>
                </svg>
                <span className="text-xl font-bold" style={{ color: '#B91E3C' }}>CEMI</span>
              </div>
              <div className="h-8 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <svg width="32" height="20" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="4" cy="4" r="3" fill="#E57373"/>
                  <circle cx="12" cy="4" r="3" fill="#E57373"/>
                  <circle cx="20" cy="4" r="3" fill="#E57373"/>
                  <circle cx="4" cy="12" r="3" fill="#E57373"/>
                  <circle cx="12" cy="12" r="3" fill="#E57373"/>
                  <circle cx="20" cy="12" r="3" fill="#E57373"/>
                </svg>
                <span className="text-base font-semibold text-gray-700">
                  <span className="font-bold">phm</span> partner
                </span>
              </div>
            </div>
            
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="bg-white border-b shadow-lg print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.path;
                return (
                  <Link key={item.path} to={createPageUrl(item.path)} onClick={() => setIsMenuOpen(false)}>
                    <button
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                        isActive
                          ? 'bg-green-100 text-green-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1">{children}</div>
      
      <footer className="bg-white border-t mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-gray-600 text-center">© {new Date().getFullYear()} CEMI. Garden Inspection Management System.</p>
        </div>
      </footer>
    </div>
  );
}