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
              <img 
                src="https://www.cemi.se/wp-content/uploads/2020/05/cemi_logga.svg" 
                alt="CEMI" 
                className="h-8"
              />
              <img 
                src="https://www.cemi.se/wp-content/uploads/2020/05/phm_logga.svg" 
                alt="PHM Partner" 
                className="h-8"
              />
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
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <img 
              src="https://www.cemi.se/wp-content/uploads/2020/05/cemi_logga.svg" 
              alt="CEMI" 
              className="h-6"
            />
            <p className="text-sm text-gray-600">© {new Date().getFullYear()} CEMI. Garden Inspection Management System.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}