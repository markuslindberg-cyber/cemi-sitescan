import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Building2, MapPin, Upload, LayoutGrid, List, Trash2, CheckSquare, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import UserSelect from '../components/shared/UserSelect';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import CreateCustomerDialog from '../components/customers/CreateCustomerDialog';
import ImportExcelDialog from '../components/import/ImportExcelDialog';
import CustomersFilterPanel from '../components/customers/CustomersFilterPanel';
import SortDropdown from '../components/SortDropdown';

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
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkManager, setBulkManager] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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

  const uniqueManagers = [...new Set(allCustomers.filter(c => c.account_manager).map(c => c.account_manager))].sort((a, b) => getManagerName(a).localeCompare(getManagerName(b)));

  const getSortedCustomers = () => {
    let filtered = [...allCustomers];
    if (filterManager !== 'all') {
      filtered = filtered.filter((c) => c.account_manager === filterManager);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.contact_person || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      );
    }
    filtered.sort((a, b) => {
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

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, data }) => {
      await Promise.all(ids.map(id => base44.entities.Customer.update(id, data)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(`${selectedIds.size} kunder uppdaterade`);
      setSelectedIds(new Set());
      setBulkCategory('');
      setBulkManager('');
    }
  });

  const toggleSelect = (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === customers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(customers.map(c => c.id)));
    }
  };

  const applyBulkUpdate = () => {
    const data = {};
    if (bulkCategory) data.category = bulkCategory;
    if (bulkManager) data.account_manager = bulkManager;
    if (!Object.keys(data).length) { toast.error('Välj kategori eller kundansvarig att ändra'); return; }
    bulkUpdateMutation.mutate({ ids: [...selectedIds], data });
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
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Kunder</h1>
            <p className="text-gray-600 mt-2">Hantera dina kunder och deras platser</p>
          </div>
          <div className="flex gap-2 items-center flex-wrap w-full md:w-auto">
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

            <CustomersFilterPanel
              filterManager={filterManager}
              setFilterManager={setFilterManager}
              uniqueManagers={uniqueManagers}
              getManagerName={getManagerName}
            />
            <SortDropdown sortBy={sortBy} setSortBy={setSortBy} />
            <Button
              onClick={() => setShowImportDialog(true)}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50 flex-1 md:flex-none"
            >
              <Upload className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Importera Excel</span>
              <span className="sm:hidden">Importera</span>
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-green-600 hover:bg-green-700 flex-1 md:flex-none"
            >
              <Plus className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Lägg till kund</span>
              <span className="sm:hidden">Ny kund</span>
            </Button>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Sök kund, kontaktperson eller e-post..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-green-800">{selectedIds.size} kunder markerade</span>
            <select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value)}
              className="h-8 px-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Sätt kategori</option>
              <option value="BRF">BRF</option>
              <option value="Samfälligheter">Samfälligheter</option>
              <option value="Kommersiella">Kommersiella</option>
            </select>
            <div className="w-52">
              <UserSelect value={bulkManager} onValueChange={setBulkManager} placeholder="Sätt kundansvarig" />
            </div>
            <Button size="sm" onClick={applyBulkUpdate} disabled={bulkUpdateMutation.isPending} className="bg-green-600 hover:bg-green-700">
              Tillämpa
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
              Avmarkera alla
            </Button>
          </div>
        )}

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
              const isSelected = selectedIds.has(customer.id);
              return (
                <div key={customer.id} className="relative">
                  <div
                    className="absolute top-3 left-3 z-10"
                    onClick={(e) => toggleSelect(customer.id, e)}
                  >
                    <Checkbox checked={isSelected} className="bg-white border-gray-300" />
                  </div>
                  <Link to={createPageUrl(`Customer?id=${customer.id}`)}>
                    <Card className={`hover:shadow-lg transition-shadow cursor-pointer h-full ${isSelected ? 'ring-2 ring-green-500' : ''}`}>
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
                        {customer.category && (
                          <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mb-2">{customer.category}</span>
                        )}
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
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {customers.map(customer => {
              const stats = getCustomerStats(customer.id);
              const isSelected = selectedIds.has(customer.id);
              return (
                <div key={customer.id} className="flex items-start gap-2">
                  <div onClick={(e) => toggleSelect(customer.id, e)} className="pt-1 cursor-pointer">
                    <Checkbox checked={isSelected} />
                  </div>
                  <Link to={createPageUrl(`Customer?id=${customer.id}`)} className="flex-1">
                    <Card className={`hover:shadow-lg transition-shadow cursor-pointer ${isSelected ? 'ring-2 ring-green-500' : ''}`}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{customer.name}</h3>
                              {customer.contact_person && (
                                <p className="text-xs text-gray-600 truncate">{customer.contact_person}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            {customer.category && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">{customer.category}</span>
                            )}
                            <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">{stats.sitesCount} platser</span>
                            {currentUser?.role === 'admin' && (
                              <button
                                onClick={(e) => { e.preventDefault(); setCustomerToDelete(customer); }}
                                className="p-1 ml-auto rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
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