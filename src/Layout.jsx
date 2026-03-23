import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Building2, Users, FileText, Menu, X, Home, Trash2 } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const navItems = [
    { name: 'Områden', path: 'Home', icon: Building2 },
    { name: 'Kunder', path: 'Customers', icon: Users },
    { name: 'Inspektioner', path: 'Inspections', icon: FileText },
    { name: 'Användare', path: 'Users', icon: Users }
  ];

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: 'url(https://media.base44.com/images/public/698b067db5e721251596eb5e/bbb18a68d_0286130d-b419-4706-9d1f-80337e32bb89.jpg)',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center'
      }}
    >
      <nav className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Link to={createPageUrl('Landing')}>
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698b067db5e721251596eb5e/0e240ccf1_image.png" 
                  alt="CEMI Logo" 
                  className="h-10 object-contain cursor-pointer"
                />
              </Link>
              <Link to={createPageUrl('Landing')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700 transition-colors">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Startsida</span>
              </Link>
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
          <p className="text-sm text-gray-600 text-center">© {new Date().getFullYear()} CEMI. Utemiljöbesiktningssystem.</p>
        </div>
      </footer>
    </div>
  );
}