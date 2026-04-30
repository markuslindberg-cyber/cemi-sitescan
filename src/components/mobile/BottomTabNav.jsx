import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, Users, FileText, User } from 'lucide-react';
import { createPageUrl } from '../../utils';

export default function BottomTabNav({ currentUser }) {
  const location = useLocation();

  const tabs = [
    { name: 'Områden', path: 'Home', icon: Building2 },
    { name: 'Kunder', path: 'Customers', icon: Users },
    { name: 'Inspektioner', path: 'Inspections', icon: FileText },
    { name: 'Profil', path: 'Users', icon: User }
  ];

  const isActive = (path) => {
    return location.pathname === `/${path === 'Home' ? '' : path}` || 
           location.pathname === `/` && path === 'Home';
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          return (
            <Link
              key={tab.path}
              to={createPageUrl(tab.path)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors select-none ${
                active ? 'text-green-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}