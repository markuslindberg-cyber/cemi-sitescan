import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Building2, MapPin, Calendar, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import CreateCustomerDialog from '../components/customers/CreateCustomerDialog';
import ImportExcelDialog from '../components/import/ImportExcelDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Customers() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [sortBy, setSortBy] = useState('updated');

  const { data: allCustomers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list()
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['all-sites'],
    queryFn: () => base44.entities.Site.list()
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ['all-inspections'],
    queryFn: () => base44.entities.Inspection.list()
  });

  const getSortedCustomers = () => {
    let sorted = [...allCustomers];
    if (sortBy === 'updated') {
      sorted.sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
    } else if (sortBy === 'sites') {
      sorted.sort((a, b) => {
        const countA = sites.filter(s => s.customer_id === a.id).length;
        const countB = sites.filter(s => s.customer_id === b.id).length;
        return countB - countA;
      });
    } else if (sortBy === 'manager') {
      sorted.sort((a, b) => (a.account_manager || '').localeCompare(b.account_manager || ''));
    }
    return sorted;
  };

  const customers = getSortedCustomers();

  const getCustomerStats = (customerId) => {
    const customerSites = sites.filter(s => s.customer_id === customerId);
    const siteIds = customerSites.map(s => s.id);
    const customerInspections = inspections.filter(i => siteIds.includes(i.site_id));
    
    return {
      sitesCount: customerSites.length,
      inspectionsCount: customerInspections.length,
      lastInspection: customerInspections.length > 0 
        ? customerInspections.sort((a, b) => new Date(b.inspection_date) - new Date(a.inspection_date))[0].inspection_date
        : null
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Kunder</h1>
            <p className="text-gray-600 mt-2">Hantera dina kunder och deras platser</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowImportDialog(true)}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Upload className="w-5 h-5 mr-2" />
              Importera Excel
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Lägg till kund
            </Button>
          </div>
        </div>

        {customersLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : customers.length === 0 ? (
          <Card className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Inga kunder ännu</h3>
            <p className="text-gray-600 mb-6">Skapa din första kund för att börja hantera platser och inspektioner</p>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-5 h-5 mr-2" />
              Skapa första kunden
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customers.map(customer => {
              const stats = getCustomerStats(customer.id);
              return (
                <Link key={customer.id} to={createPageUrl(`Customer?id=${customer.id}`)}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{customer.name}</h3>
                          {customer.contact_person && (
                            <p className="text-sm text-gray-600 truncate">{customer.contact_person}</p>
                          )}
                        </div>
                      </div>

                      {customer.email && (
                        <p className="text-sm text-gray-600 mb-2 truncate">{customer.email}</p>
                      )}
                      {customer.phone && (
                        <p className="text-sm text-gray-600 mb-3">{customer.phone}</p>
                      )}

                      <div className="pt-3 border-t space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            Platser
                          </span>
                          <span className="font-semibold">{stats.sitesCount}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Inspektioner</span>
                          <span className="font-semibold">{stats.inspectionsCount}</span>
                          </div>
                          {stats.lastInspection && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Senaste
                            </span>
                            <span className="text-gray-700">
                              {new Date(stats.lastInspection).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        <CreateCustomerDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
        <ImportExcelDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          type="customers"
        />
      </div>
    </div>
  );
}