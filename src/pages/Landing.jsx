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
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        backgroundImage: 'url(https://media.base44.com/images/public/698b067db5e721251596eb5e/bbb18a68d_0286130d-b419-4706-9d1f-80337e32bb89.jpg)',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center'
      }}
    >
      <div className="w-full max-w-2xl mx-auto">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698b067db5e721251596eb5e/0e240ccf1_image.png"
            alt="CEMI Logo"
            className="h-16 object-contain mb-2"
          />
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Cemi platsbesiktning</h1>
          <p className="text-gray-500 mt-0.5 text-xs">Välj ett område för att komma igång</p>
        </div>

        {/* Nav buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={createPageUrl(item.path)}>
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${item.bg} ${item.border} transition-all duration-150 shadow-sm hover:shadow-md cursor-pointer`}>
                   <div className={`w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm flex-shrink-0`}>
                     <Icon className={`w-5 h-5 ${item.iconColor}`} />
                   </div>
                   <div>
                     <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                     <p className="text-xs text-gray-500">{item.description}</p>
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