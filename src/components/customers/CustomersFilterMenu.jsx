import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';

export default function CustomersFilterMenu({
  filterManager,
  setFilterManager,
  sortBy,
  setSortBy,
  uniqueManagers,
  getManagerName
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-4">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Kundansvarig</label>
            <Select value={filterManager} onValueChange={setFilterManager}>
              <SelectTrigger className="w-full">
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
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Sortera efter</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sortera" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="namn">Namn</SelectItem>
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