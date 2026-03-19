import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Building2, Users, FileText, ClipboardList, UserCog } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const navItems = [
  {
    path: 'Home',
    label: 'Platser',
    description: 'Hantera platser och starta inspektioner',
    icon: Building2,
    color: 'from-green-500 to-emerald-600',
    bg: 'bg-green-50 hover:bg-green-100',
    border: 'border-green-200',
    iconColor: 'text-green-600',
  },
  {
    path: 'Customers',
    label: 'Kunder',
    description: 'Visa och hantera kundregister',
    icon: Users,
    color: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50 hover:bg-blue-100',
    border: 'border-blue-200',
    iconColor: 'text-blue-600',
  },
  {
    path: 'Inspections',
    label: 'Inspektioner',
    description: 'Översikt över alla genomförda inspektioner',
    icon: ClipboardList,
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50 hover:bg-amber-100',
    border: 'border-amber-200',
    iconColor: 'text-amber-600',
  },
  {
    path: 'Users',
    label: 'Användare',
    description: 'Administrera systemanvändare och roller',
    icon: UserCog,
    color: 'from-purple-500 to-violet-600',
    bg: 'bg-purple-50 hover:bg-purple-100',
    border: 'border-purple-200',
    iconColor: 'text-purple-600',
  },
];

export default function Landing() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user?.role === 'admin') setIsAdmin(true);
    });
  }, []);

  const visibleItems = navItems.filter(item => item.path !== 'Users' || isAdmin);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl mx-auto">

        {/* Logo */}
        <div className="flex flex-col items-center mb-12">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698b067db5e721251596eb5e/0e240ccf1_image.png"
            alt="CEMI Logo"
            className="h-20 object-contain mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Cemi platsbesiktning</h1>
          <p className="text-gray-500 mt-1 text-sm">Välj ett område för att komma igång</p>
        </div>

        {/* Nav buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={createPageUrl(item.path)}>
                <div className={`flex items-center gap-4 p-5 rounded-2xl border ${item.bg} ${item.border} transition-all duration-150 shadow-sm hover:shadow-md cursor-pointer`}>
                  <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${item.iconColor}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}