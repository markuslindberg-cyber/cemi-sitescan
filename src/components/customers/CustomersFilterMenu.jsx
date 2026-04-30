import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CustomersFilterMenu({
  filterManager,
  setFilterManager,
  sortBy,
  setSortBy,
  uniqueManagers,
  getManagerName
}) {
  return (
    <>
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
    </>
  );
}