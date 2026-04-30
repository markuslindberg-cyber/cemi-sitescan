import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, User, MapPin, FileText, LayoutGrid, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import InspectionsFilterPanel from '../components/inspections/InspectionsFilterPanel';

export default function Inspections() {
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [filterSite, setFilterSite] = useState('all');
  const [filterInspector, setFilterInspector] = useState('all');
  const [filterSiteManager, setFilterSiteManager] = useState('all');
  const [sortBy, setSortBy] = useState('datum');
  const [viewMode, setViewMode] = useState('list');

  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ['all-inspections'],
    queryFn: () => base44.entities.Inspection.list('-inspection_date')
  });

  const { data: sites = [] } = useQuery({
    queryKey: ['all-sites'],
    queryFn: () => base44.entities.Site.list()
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['all-customers'],
    queryFn: () => base44.entities.Customer.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list()
  });

  const getSite = (siteId) => sites.find((s) => s.id === siteId);
  const getSiteName = (siteId) => getSite(siteId)?.name || 'Okänd plats';
  const getSiteLocation = (siteId) => getSite(siteId)?.location || '';
  const getCustomerName = (customerId) => customers.find((c) => c.id === customerId)?.name || '';

  // Sites filtered by selected customer
  const sitesForCustomer = filterCustomer === 'all' ?
  sites :
  sites.filter((s) => s.customer_id === filterCustomer);

  // Get unique inspector names and map to user data
  const uniqueInspectorNames = [...new Set(inspections.map((ins) => ins.inspector_name).filter(Boolean))].sort();
  const getInspectorDisplay = (name) => {
    const user = users.find((u) => u.full_name === name);
    if (user && user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return name;
  };

  const filteredInspections = inspections.filter((ins) => {
    const site = getSite(ins.site_id);
    if (filterSite !== 'all' && ins.site_id !== filterSite) return false;
    if (filterCustomer !== 'all' && site?.customer_id !== filterCustomer) return false;
    if (filterInspector !== 'all' && ins.inspector_name !== filterInspector) return false;
    if (filterSiteManager !== 'all' && site?.site_manager !== filterSiteManager) return false;
    return true;
  }).sort((a, b) => {
    const siteA = getSite(a.site_id);
    const siteB = getSite(b.site_id);
    const aNoManager = !siteA?.site_manager ? 0 : 1;
    const bNoManager = !siteB?.site_manager ? 0 : 1;
    if (aNoManager !== bNoManager) return aNoManager - bNoManager;
    if (sortBy === 'namn') return (getSiteName(a.site_id)).localeCompare(getSiteName(b.site_id), 'sv');
    if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '');
    if (sortBy === 'senast') return new Date(b.updated_date) - new Date(a.updated_date);
    // datum (default)
    return new Date(b.inspection_date) - new Date(a.inspection_date);
  });

  const uniqueSiteManagers = [...new Set(sites.filter((s) => s.site_manager).map((s) => s.site_manager))].sort();
  const getSiteManagerName = (managerId) => {
    const user = users.find((u) => u.id === managerId);
    return user ? `${user.first_name} ${user.last_name}`.trim() || user.full_name : managerId;
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Alla inspektioner</h1>
          <p className="text-gray-600 mt-2">Visa alla inspektionsrapporter för alla platser</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex gap-1 border rounded-lg p-1 bg-gray-50">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => setViewMode('grid')}
              className="w-10 p-0">
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
              className="w-10 p-0">
              <List className="w-4 h-4" />
            </Button>
          </div>
          <InspectionsFilterPanel
            filterCustomer={filterCustomer}
            setFilterCustomer={setFilterCustomer}
            filterSite={filterSite}
            setFilterSite={setFilterSite}
            filterInspector={filterInspector}
            setFilterInspector={setFilterInspector}
            filterSiteManager={filterSiteManager}
            setFilterSiteManager={setFilterSiteManager}
            sortBy={sortBy}
            setSortBy={setSortBy}
            customers={customers}
            sitesForCustomer={sitesForCustomer}
            uniqueInspectorNames={uniqueInspectorNames}
            uniqueSiteManagers={uniqueSiteManagers}
            getInspectorDisplay={getInspectorDisplay}
            getSiteManagerName={getSiteManagerName}
          />
        </div>

        {isLoading ?
        <div className="grid gap-4">
            {[1, 2, 3].map((i) =>
          <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </CardContent>
              </Card>
          )}
          </div> :
        filteredInspections.length === 0 ?
        <Card className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Inga inspektioner hittades</h3>
            <p className="text-gray-600">Prova att ändra filtret</p>
          </Card> :
        viewMode === 'list' ?
        <div className="space-y-3">
            {filteredInspections.map((inspection) =>
          <Link
            key={inspection.id}
            to={createPageUrl(
              inspection.status === 'completed' ?
              `Report?id=${inspection.id}` :
              `Inspection?id=${inspection.id}`
            )}>
            
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge
                        variant={inspection.status === 'completed' ? 'default' : 'secondary'}
                        className={
                        inspection.status === 'completed' ?
                        'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                        }>
                        
                            {inspection.status === 'completed' ? 'Slutförd' : 'Pågående'}
                          </Badge>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(inspection.inspection_date).toLocaleDateString('sv-SE')}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {getSiteName(inspection.site_id)}
                        </h3>
                        {getSiteLocation(inspection.site_id) &&
                    <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                            <MapPin className="w-4 h-4" />
                            {getSiteLocation(inspection.site_id)}
                          </p>
                    }
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          {inspection.inspector_name}
                        </div>
                        {inspection.notes &&
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                            {inspection.notes}
                          </p>
                    }
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
          )}
              </div> :

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInspections.map((inspection) =>
          <Link
            key={inspection.id}
            to={createPageUrl(
              inspection.status === 'completed' ?
              `Report?id=${inspection.id}` :
              `Inspection?id=${inspection.id}`
            )}>
            
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="mb-3">
                      <Badge
                    variant={inspection.status === 'completed' ? 'default' : 'secondary'}
                    className={
                    inspection.status === 'completed' ?
                    'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                    }>
                    
                        {inspection.status === 'completed' ? 'Slutförd' : 'Pågående'}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {getSiteName(inspection.site_id)}
                    </h3>
                    {getSiteLocation(inspection.site_id) &&
                <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                        <MapPin className="w-4 h-4" />
                        {getSiteLocation(inspection.site_id)}
                      </p>
                }
                    <div className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(inspection.inspection_date).toLocaleDateString('sv-SE')}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {inspection.inspector_name}
                    </div>
                  </CardContent>
                </Card>
              </Link>
          )}
              </div>
        }
      </div>
    </div>);

}