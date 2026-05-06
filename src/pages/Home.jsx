import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, MapPin, Calendar, Upload, LayoutGrid, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import CreateSiteDialog from '../components/sites/CreateSiteDialog';
import ImportExcelDialog from '../components/import/ImportExcelDialog';
import SitesFilterPanel from '../components/sites/SitesFilterPanel';
import SortDropdown from '../components/SortDropdown';

export default function Home() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [sortBy, setSortBy] = useState('namn');
  const [viewMode, setViewMode] = useState('grid');
  const [filterManager, setFilterManager] = useState('all');
  const queryClient = useQueryClient();

  const { data: allSites = [], isLoading } = useQuery({
    queryKey: ['sites'],
    queryFn: () => base44.entities.Site.list()
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['all-customers'],
    queryFn: () => base44.entities.Customer.list()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getUsers', {});
      return res.data?.users || [];
    }
  });

  const getUserName = (userId) => {
    if (!userId) return '';
    const user = users.find(u => u.id === userId);
    if (!user) return '';
    return user.first_name && user.last_name 
      ? `${user.first_name} ${user.last_name}`
      : user.full_name || user.email;
  };

  const uniqueManagers = [...new Set(allSites.filter((s) => s.site_manager).map((s) => s.site_manager))].sort((a, b) => getUserName(a).localeCompare(getUserName(b)));

  const getSortedSites = () => {
    let filtered = [...allSites];
    if (filterManager !== 'all') {
      filtered = filtered.filter((s) => s.site_manager === filterManager);
    }
    filtered.sort((a, b) => {
      if (sortBy === 'namn') return (a.name || '').localeCompare(b.name || '', 'sv');
      if (sortBy === 'datum' || sortBy === 'senast') return new Date(b.updated_date) - new Date(a.updated_date);
      return 0;
    });
    return filtered;
  };

  const sites = getSortedSites();

  const { data: inspections = [] } = useQuery({
    queryKey: ['all-inspections'],
    queryFn: () => base44.entities.Inspection.list('-inspection_date')
  });

  const getInspectionCount = (siteId) => {
    return inspections.filter((i) => i.site_id === siteId).length;
  };

  const getLastInspectionDate = (siteId) => {
    const siteInspections = inspections.filter((i) => i.site_id === siteId);
    if (siteInspections.length === 0) return null;
    return siteInspections[0].inspection_date;
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Områden</h1>
            <p className="text-gray-600 mt-2">Hantera dina platser och inspektioner</p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
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

            <SitesFilterPanel
              filterManager={filterManager}
              setFilterManager={setFilterManager}
              uniqueManagers={uniqueManagers}
              getUserName={getUserName}
            />
            <SortDropdown sortBy={sortBy} setSortBy={setSortBy} />
            <Button
              onClick={() => setShowImportDialog(true)}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50">
              
              <Upload className="w-5 h-5 mr-2" />
              Importera Excel
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-green-600 hover:bg-green-700">
              
              <Plus className="w-5 h-5 mr-2" />
              Lägg till plats
            </Button>
          </div>
        </div>

        {isLoading ?
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-3'}>
             {[1, 2, 3].map((i) =>
          <Card key={i} className="animate-pulse">
                 <div className={viewMode === 'grid' ? 'h-48 bg-gray-200 rounded-t-lg' : 'h-20 bg-gray-200'} />
                 <CardContent className="p-6">
                   <div className="h-6 bg-gray-200 rounded mb-2" />
                   <div className="h-4 bg-gray-200 rounded w-2/3" />
                 </CardContent>
               </Card>
          )}
           </div> :
        sites.length === 0 ?
        <Card className="p-12 text-center">
            <MapPin className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Inga platser ännu</h3>
            <p className="text-gray-600 mb-6">Skapa din första plats för att börja genomföra inspektioner</p>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-5 h-5 mr-2" />
              Skapa första platsen
            </Button>
          </Card> :
        viewMode === 'grid' ?
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map((site) =>
          <Link key={site.id} to={createPageUrl(`Site?id=${site.id}`)}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  {site.map_image_url ? (
                    <div className="h-48 overflow-hidden rounded-t-lg bg-gray-100">
                      <img src={site.map_image_url} alt={site.name} className="w-full h-full object-cover" />
                    </div>
                  ) : site.map_type === 'google_maps' && site.google_maps_center ? (
                    <div className="h-48 overflow-hidden rounded-t-lg bg-gray-100 relative pointer-events-none">
                      <iframe
                        title={site.name}
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${site.google_maps_center.lng - 0.002},${site.google_maps_center.lat - 0.001},${site.google_maps_center.lng + 0.002},${site.google_maps_center.lat + 0.001}&layer=mapnik&marker=${site.google_maps_center.lat},${site.google_maps_center.lng}`}
                        className="w-full h-full border-0"
                        style={{ marginTop: '-30px', height: 'calc(100% + 30px)' }}
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center rounded-t-lg">
                      <MapPin className="w-16 h-16 text-green-600 opacity-50" />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{site.name}</h3>
                    {site.location &&
                <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {site.location}
                      </p>
                }
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t">
                      <span>{getInspectionCount(site.id)} inspektioner</span>
                      {getLastInspectionDate(site.id) &&
                  <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(getLastInspectionDate(site.id)).toLocaleDateString()}
                        </span>
                  }
                    </div>
                  </CardContent>
                </Card>
              </Link>
          )}
          </div> :

        <div className="space-y-3">
            {sites.map((site) =>
          <Link key={site.id} to={createPageUrl(`Site?id=${site.id}`)}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{site.name}</h3>
                        {site.location &&
                    <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{site.location}</span>
                          </p>
                    }
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 flex-shrink-0">
                        <span className="whitespace-nowrap">{getInspectionCount(site.id)} insp.</span>
                        {getLastInspectionDate(site.id) &&
                    <span className="flex items-center gap-1 whitespace-nowrap">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                            {new Date(getLastInspectionDate(site.id)).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
                          </span>
                    }
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
          )}
          </div>
        }

        <CreateSiteDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog} />
        
        <ImportExcelDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          type="sites" />
        

      </div>
    </div>);

}