import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    <>
      <Select value={filterCustomer} onValueChange={(v) => {
        setFilterCustomer(v);
        setFilterSite('all');
      }}>
        <SelectTrigger className="w-48">
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
        <SelectTrigger className="w-48">
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
        <SelectTrigger className="w-48">
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
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filtrera på områdesansvarig" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alla områdesansvariga</SelectItem>
          {uniqueSiteManagers.map((managerId) =>
            <SelectItem key={managerId} value={managerId}>{getSiteManagerName(managerId)}</SelectItem>
          )}
        </SelectContent>
      </Select>

      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Sortera" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="namn">Namn</SelectItem>
          <SelectItem value="status">Status</SelectItem>
          <SelectItem value="datum">Datum</SelectItem>
          <SelectItem value="senast">Senast använd</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}