import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MapPin, Calendar, User, FileText, Pencil, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Badge } from '@/components/ui/badge';
import EditCustomerDialog from '../components/customers/EditCustomerDialog';
import CreateSiteDialog from '../components/sites/CreateSiteDialog';

export default function Customer() {
  const urlParams = new URLSearchParams(window.location.search);
  const customerId = urlParams.get('id');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateSiteDialog, setShowCreateSiteDialog] = useState(false);

  const { data: customer, isLoading: customerLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      const customers = await base44.entities.Customer.list();
      return customers.find(c => c.id === customerId);
    },
    enabled: !!customerId
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['customer-sites', customerId],
    queryFn: () => base44.entities.Site.filter({ customer_id: customerId }, '-updated_date'),
    enabled: !!customerId
  });

  const { data: allInspections = [] } = useQuery({
    queryKey: ['all-inspections-for-customer'],
    queryFn: () => base44.entities.Inspection.list('-inspection_date'),
    enabled: sites.length > 0
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list()
  });

  const customerInspections = allInspections.filter(i =>
    sites.some(s => s.id === i.site_id)
  );

  const getManagerName = (managerId) => {
    const user = users.find(u => u.id === managerId);
    return user ? user.full_name : managerId;
  };

  const getSiteName = (siteId) => {
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : 'Okänd plats';
  };

  if (customerLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900">Kunden hittades inte</h2>
          <Link to={createPageUrl('Customers')}>
            <Button className="mt-4">Tillbaka till kunder</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link to={createPageUrl('Customers')}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till kunder
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex flex-col gap-3">
                <CardTitle className="text-2xl">{customer.name}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)} className="w-fit">
                  <Pencil className="w-4 h-4 mr-2" />
                  Redigera
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.project_number && (
                <div className="text-sm text-gray-500 mb-2">
                  Projekt: <span className="font-semibold text-gray-700">{customer.project_number}</span>
                </div>
              )}
              {customer.contact_person && (
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="w-4 h-4" />
                  {customer.contact_person}
                </div>
              )}
              {customer.email && <p className="text-gray-600">{customer.email}</p>}
              {customer.phone && <p className="text-gray-600">{customer.phone}</p>}
              {customer.address && (
                <p className="text-gray-600 flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {customer.address}
                </p>
              )}
              {customer.account_manager && (
                <div className="flex items-center gap-2 text-gray-700 mt-4">
                  <User className="w-4 h-4" />
                  <span className="text-sm text-gray-600">Kundasvarig: </span>
                  <span className="font-semibold">{getManagerName(customer.account_manager)}</span>
                </div>
              )}
              {customer.notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Anteckningar:</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{customer.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistik</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Totalt platser</span>
                <span className="font-semibold text-lg">{sites.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Totalt inspektioner</span>
                <span className="font-semibold text-lg">{customerInspections.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Slutförda</span>
                <span className="font-semibold text-lg">
                  {customerInspections.filter(i => i.status === 'completed').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Platser ({sites.length})
                </CardTitle>
                <Button size="sm" onClick={() => setShowCreateSiteDialog(true)} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-1" />
                  Ny plats
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sites.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Inga platser för denna kund</p>
              ) : (
               <div className="space-y-3">
                  {sites.map(site => (
                    <Link key={site.id} to={createPageUrl(`Site?id=${site.id}`)}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-3 sm:p-4">
                          <h4 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{site.name}</h4>
                          {site.location && (
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{site.location}</p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
               </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Senaste inspektioner
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customerInspections.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Inga inspektioner ännu</p>
              ) : (
               <div className="space-y-3">
                  {customerInspections.slice(0, 10).map(inspection => (
                    <Link
                      key={inspection.id}
                      to={createPageUrl(
                        inspection.status === 'completed'
                          ? `Report?id=${inspection.id}`
                          : `Inspection?id=${inspection.id}`
                      )}
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <Badge
                              variant={inspection.status === 'completed' ? 'default' : 'secondary'}
                              className={`text-xs sm:text-sm ${
                                inspection.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {inspection.status === 'completed' ? 'Slutförd' : 'Pågående'}
                            </Badge>
                            <span className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 whitespace-nowrap">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                              {new Date(inspection.inspection_date).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <h4 className="font-semibold text-sm text-gray-900 truncate">
                            {getSiteName(inspection.site_id)}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1 truncate">{inspection.inspector_name}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
               </div>
              )}
            </CardContent>
          </Card>
        </div>

        <EditCustomerDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          customer={customer}
        />

        <CreateSiteDialog
          open={showCreateSiteDialog}
          onOpenChange={setShowCreateSiteDialog}
          defaultCustomerId={customerId}
        />
      </div>
    </div>
  );
}