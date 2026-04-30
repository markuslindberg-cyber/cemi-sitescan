import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';

export default function InspectionsFilterPanel({
  filterCustomer,
  setFilterCustomer,
  filterSite,
  setFilterSite,
  filterInspector,
  setFilterInspector,
  filterSiteManager,
  setFilterSiteManager,
  sortBy,
  setSortBy,
  customers,
  sitesForCustomer,
  uniqueInspectorNames,
  uniqueSiteManagers,
  getInspectorDisplay,
  getSiteManagerName
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <Filter className="w-4 h-4" />
        Filter
      </Button>
      
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Filtrera inspektioner</h2>
              <button 
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-2">Kund</label>
            <Select value={filterCustomer} onValueChange={(v) => {
              setFilterCustomer(v);
              setFilterSite('all');
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla kunder</SelectItem>
                {customers.map((c) =>
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Plats</label>
            <Select value={filterSite} onValueChange={setFilterSite}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla platser</SelectItem>
                {sitesForCustomer.map((s) =>
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Inspektör</label>
            <Select value={filterInspector} onValueChange={setFilterInspector}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla inspektörer</SelectItem>
                {uniqueInspectorNames.map((name) =>
                  <SelectItem key={name} value={name}>{getInspectorDisplay(name)}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Områdesansvarig</label>
            <Select value={filterSiteManager} onValueChange={setFilterSiteManager}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla områdesansvariga</SelectItem>
                {uniqueSiteManagers.map((managerId) =>
                  <SelectItem key={managerId} value={managerId}>{getSiteManagerName(managerId)}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <label className="text-sm font-medium block mb-2">Sortera efter</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="namn">Namn</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="datum">Datum</SelectItem>
                <SelectItem value="senast">Senast använd</SelectItem>
              </SelectContent>
            </Select>
          </div>
          </div>
          </div>
          </div>
          )}
          </>
          );
          }