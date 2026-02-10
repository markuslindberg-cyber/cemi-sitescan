import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MapPin, Calendar, User, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Badge } from '@/components/ui/badge';

export default function Customer() {
  const urlParams = new URLSearchParams(window.location.search);
  const customerId = urlParams.get('id');

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

  const customerInspections = allInspections.filter(i => 
    sites.some(s => s.id === i.site_id)
  );

  const getSiteName = (siteId) => {
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : 'Unknown Site';
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
          <h2 className="text-2xl font-bold text-gray-900">Customer not found</h2>
          <Link to={createPageUrl('Customers')}>
            <Button className="mt-4">Back to Customers</Button>
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
            Back to Customers
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl">{customer.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.project_number && (
                <div className="text-sm text-gray-500 mb-2">
                  Project: <span className="font-semibold text-gray-700">{customer.project_number}</span>
                </div>
              )}
              {customer.contact_person && (
                <div className="flex items-center gap-2 text-gray-700">
                  <User className="w-4 h-4" />
                  {customer.contact_person}
                </div>
              )}
              {customer.email && (
                <p className="text-gray-600">{customer.email}</p>
              )}
              {customer.phone && (
                <p className="text-gray-600">{customer.phone}</p>
              )}
              {customer.address && (
                <p className="text-gray-600 flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {customer.address}
                </p>
              )}
              {customer.notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Notes:</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{customer.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Sites</span>
                <span className="font-semibold text-lg">{sites.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Inspections</span>
                <span className="font-semibold text-lg">{customerInspections.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Completed</span>
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
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Sites ({sites.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sites.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No sites for this customer</p>
              ) : (
                <div className="space-y-3">
                  {sites.map(site => (
                    <Link key={site.id} to={createPageUrl(`Site?id=${site.id}`)}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-gray-900 mb-1">{site.name}</h4>
                          {site.location && (
                            <p className="text-sm text-gray-600">{site.location}</p>
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
                Recent Inspections
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customerInspections.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No inspections yet</p>
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
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge
                              variant={inspection.status === 'completed' ? 'default' : 'secondary'}
                              className={
                                inspection.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {inspection.status === 'completed' ? 'Completed' : 'In Progress'}
                            </Badge>
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(inspection.inspection_date).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {getSiteName(inspection.site_id)}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {inspection.inspector_name}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}