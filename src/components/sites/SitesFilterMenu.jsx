import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X } from 'lucide-react';

export default function SitesFilterMenu({ filterManager, setFilterManager, sortBy, setSortBy, uniqueManagers, getUserName }) {
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
          <div className="bg-white rounded-lg shadow-lg w-80 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Filtrera platser</h2>
              <button 
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Områdesansvarig</label>
                <Select value={filterManager} onValueChange={setFilterManager}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filtrera på områdesansvarig" />
                  </SelectTrigger>
                  <SelectContent noPortal>
                    <SelectItem value="all">Alla områdesansvariga</SelectItem>
                    <SelectItem value="none">Ingen ansvarig</SelectItem>
                    {uniqueManagers.map((manager) =>
                      <SelectItem key={manager} value={manager}>{getUserName(manager)}</SelectItem>
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
                  <SelectContent noPortal>
                    <SelectItem value="namn">Namn</SelectItem>
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