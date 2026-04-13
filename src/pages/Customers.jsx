import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Building2, MapPin, Calendar, Upload, LayoutGrid, List, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import CreateCustomerDialog from '../components/customers/CreateCustomerDialog';
import ImportExcelDialog from '../components/import/ImportExcelDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Customers() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [filterManager, setFilterManager] = useState('all');
  const [sortBy, setSortBy] = useState('namn');
  const [viewMode, setViewMode] = useState('grid');

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

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getUsers', {});
      return res.data?.users || [];
    }
  });

  const getManagerName = (managerId) => {
    if (!managerId) return '';
    const user = users.find(u => u.id === managerId);
    if (!user) return managerId;
    return user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.full_name || user.email;
  };

  const getSortedCustomers = () => {
    let filtered = [...allCustomers];
    if (filterManager === 'none') {
      filtered = filtered.filter(c => !c.account_manager);
    } else if (filterManager !== 'all') {
      filtered = filtered.filter(c => c.account_manager === filterManager);
    }
    filtered.sort((a, b) => {
      const aNoManager = !a.account_manager ? 0 : 1;
      const bNoManager = !b.account_manager ? 0 : 1;
      if (aNoManager !== bNoManager) return aNoManager - bNoManager;
      if (sortBy === 'namn') return (a.name || '').localeCompare(b.name || '', 'sv');
      if (sortBy === 'datum' || sortBy === 'senast') return new Date(b.updated_date) - new Date(a.updated_date);
      return 0;
    });
    return filtered;
  };

  const deleteMutation = useMutation({
    mutationFn: async (customer) => {
      await base44.entities.Trash.create({
        entity_type: 'Customer',
        entity_id: customer.id,
        entity_data: customer,
        deleted_by: currentUser?.email || '',
        display_name: customer.name,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });
      await base44.entities.Customer.delete(customer.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Kunden har flyttats till papperskorgen');
      setCustomerToDelete(null);
    }
  });

  const uniqueManagers = [...new Set(allCustomers.filter(c => c.account_manager).map(c => c.account_manager))].sort((a, b) => getManagerName(a).localeCompare(getManagerName(b)));

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
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Kunder</h1>
            <p className="text-gray-600 mt-2">Hantera dina kunder och deras platser</p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <div className="flex gap-1 border rounded-lg p-1 bg-gray-50">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid')}
                className="w-10 p-0"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setViewMode('list')}
                className="w-10 p-0"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
             <Select value={filterManager} onValueChange={setFilterManager}>
               <SelectTrigger className="w-48">
                 <SelectValue placeholder="Filtrera på kundansvarig" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Alla kundansvariga</SelectItem>
                 <SelectItem value="none">Ingen ansvarig</SelectItem>
                 {uniqueManagers.map(manager => (
                   <SelectItem key={manager} value={manager}>{getManagerName(manager)}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
             <Select value={sortBy} onValueChange={setSortBy}>
               <SelectTrigger className="w-40">
                 <SelectValue placeholder="Sortera" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="namn">Namn</SelectItem>
                 <SelectItem value="datum">Datum</SelectItem>
                 <SelectItem value="senast">Senast använd</SelectItem>
               </SelectContent>
             </Select>
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
           <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-3'}>
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
        ) : viewMode === 'grid' ? (
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
                        {currentUser?.role === 'admin' && (
                          <button
                            onClick={(e) => { e.preventDefault(); setCustomerToDelete(customer); }}
                            className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        </div>

                        {customer.email && (
                        <p className="text-sm text-gray-600 mb-2 truncate">{customer.email}</p>
                      )}
                      {customer.phone && (
                        <p className="text-sm text-gray-600 mb-3">{customer.phone}</p>
                      )}

                      <div className="pt-3 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            Platser
                          </span>
                          <span className="font-semibold">{stats.sitesCount}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {customers.map(customer => {
              const stats = getCustomerStats(customer.id);
              return (
                <Link key={customer.id} to={createPageUrl(`Customer?id=${customer.id}`)}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Building2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                            {customer.contact_person && (
                              <p className="text-xs text-gray-600">{customer.contact_person}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {currentUser?.role === 'admin' && (
                            <button
                              onClick={(e) => { e.preventDefault(); setCustomerToDelete(customer); }}
                              className="p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 flex-shrink-0">
                          <span>{stats.sitesCount} platser</span>
                          </div>
                          </div>
                          </CardContent>
                          </Card>
                          </Link>
                          );
                          })}
                          </div>
                          )}

                          <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
                          <AlertDialogContent>
                          <AlertDialogHeader>
                          <AlertDialogTitle>Radera kund?</AlertDialogTitle>
                          <AlertDialogDescription>
                          Är du säker på att du vill flytta <strong>{customerToDelete?.name}</strong> till papperskorgen? Kunden kan återställas från papperskorgen inom 30 dagar.
                          </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction
                          onClick={() => deleteMutation.mutate(customerToDelete)}
                          className="bg-red-600 hover:bg-red-700"
                          >
                          Flytta till papperskorgen
                          </AlertDialogAction>
                          </AlertDialogFooter>
                          </AlertDialogContent>
                          </AlertDialog>

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