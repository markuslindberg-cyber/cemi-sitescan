import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';

export default function InspectionsFilterMenu({
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
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 max-h-96 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Kund</label>
            <Select value={filterCustomer} onValueChange={(v) => {
              setFilterCustomer(v);
              setFilterSite('all');
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrera på kund" />
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
            <label className="text-sm font-medium text-gray-700 block mb-2">Plats</label>
            <Select value={filterSite} onValueChange={setFilterSite}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrera på plats" />
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
            <label className="text-sm font-medium text-gray-700 block mb-2">Inspektör</label>
            <Select value={filterInspector} onValueChange={setFilterInspector}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrera på inspektör" />
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
            <label className="text-sm font-medium text-gray-700 block mb-2">Områdesansvarig</label>
            <Select value={filterSiteManager} onValueChange={setFilterSiteManager}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrera på områdesansvarig" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla områdesansvariga</SelectItem>
                {uniqueSiteManagers.map((managerId) =>
                  <SelectItem key={managerId} value={managerId}>{getSiteManagerName(managerId)}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Sortera efter</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sortera" />
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
      </PopoverContent>
    </Popover>
  );
}