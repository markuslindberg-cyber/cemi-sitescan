import React, { useState } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

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
  const [isOpen, setIsOpen] = useState(false);

  const activeFilters = [
    filterCustomer !== 'all',
    filterSite !== 'all',
    filterInspector !== 'all',
    filterSiteManager !== 'all'
  ].filter(Boolean).length;

  return (
    <div className="relative w-full md:w-auto">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full md:w-auto gap-2"
      >
        <Filter className="w-4 h-4" />
        <span>Filtrera {activeFilters > 0 && `(${activeFilters})`}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 md:static md:mt-0 mt-2 bg-white md:bg-transparent border md:border-0 rounded-lg md:rounded-0 shadow-lg md:shadow-none p-4 md:p-0 space-y-4 md:space-y-0 md:flex md:gap-2 md:flex-wrap z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <Select value={filterCustomer} onValueChange={(v) => {
            setFilterCustomer(v);
            setFilterSite('all');
          }}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filtrera på kund" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla kunder</SelectItem>
              {customers.map((c) =>
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              )}
            </SelectContent>
          </Select>

          <Select value={filterSite} onValueChange={setFilterSite}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filtrera på plats" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla platser</SelectItem>
              {sitesForCustomer.map((s) =>
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              )}
            </SelectContent>
          </Select>

          <Select value={filterInspector} onValueChange={setFilterInspector}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filtrera på inspektör" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla inspektörer</SelectItem>
              {uniqueInspectorNames.map((name) =>
                <SelectItem key={name} value={name}>{getInspectorDisplay(name)}</SelectItem>
              )}
            </SelectContent>
          </Select>

          <Select value={filterSiteManager} onValueChange={setFilterSiteManager}>
            <SelectTrigger className="w-full md:w-48">
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
      )}
    </div>
  );
}