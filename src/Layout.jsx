import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { Building2, Users } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const navItems = [
    { name: 'Home', path: 'Home', icon: Building2 },
    { name: 'Customers', path: 'Customers', icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-green-700">Garden Inspections</h1>
              <div className="hidden md:flex gap-1">
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
      <div>{children}</div>
    </div>
  );
}