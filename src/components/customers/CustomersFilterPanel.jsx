import React, { useState } from 'react';
import { ChevronDown, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CustomersFilterPanel({
  filterManager,
  setFilterManager,
  uniqueManagers,
  getManagerName
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const hasFilter = filterManager !== 'all';

  const handleFilterSelect = (setter, value) => {
    setter(value);
    setOpenDropdown(null);
  };

  return (
    <div className="relative w-full md:w-auto">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full md:w-auto gap-2"
      >
        <Filter className="w-4 h-4" />
        <span>Filtrera {hasFilter && '(1)'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg p-4 space-y-3 z-50 min-w-max"
        >
          {/* Manager Filter */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'manager' ? null : 'manager')}
              className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-gray-700">
                {filterManager === 'all' 
                  ? 'Alla kundansvariga' 
                  : getManagerName(filterManager) || 'Filtrera'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'manager' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'manager' && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-md max-h-48 overflow-y-auto z-10">
                <button
                  onClick={() => handleFilterSelect(setFilterManager, 'all')}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${filterManager === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                >
                  Alla kundansvariga
                </button>
                {uniqueManagers.map((managerId) => (
                  <button
                    key={managerId}
                    onClick={() => handleFilterSelect(setFilterManager, managerId)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${filterManager === managerId ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                  >
                    {getManagerName(managerId)}
                  </button>
                ))}
              </div>
            )}
          </div>


        </div>
      )}
    </div>
  );
}