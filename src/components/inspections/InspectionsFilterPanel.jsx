import React, { useState } from 'react';
import { ChevronDown, Filter, X } from 'lucide-react';
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
  customers,
  sitesForCustomer,
  uniqueInspectorNames,
  uniqueSiteManagers,
  getInspectorDisplay,
  getSiteManagerName
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  const activeFilters = [
    filterCustomer !== 'all',
    filterSite !== 'all',
    filterInspector !== 'all',
    filterSiteManager !== 'all'
  ].filter(Boolean).length;

  const handleFilterSelect = (setter, value) => {
    setter(value);
    setOpenDropdown(null);
  };

  const handleClearFilters = () => {
    setFilterCustomer('all');
    setFilterSite('all');
    setFilterInspector('all');
    setFilterSiteManager('all');
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
        <span>Filtrera {activeFilters > 0 && `(${activeFilters})`}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg p-4 space-y-3 z-50 min-w-max"
        >
          {/* Customer Filter */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'customer' ? null : 'customer')}
              className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-gray-700">
                {filterCustomer === 'all' 
                  ? 'Alla kunder' 
                  : customers.find(c => c.id === filterCustomer)?.name || 'Filtrera på kund'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'customer' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'customer' && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-md max-h-48 overflow-y-auto z-10">
                <button
                  onClick={() => handleFilterSelect(setFilterCustomer, 'all')}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${filterCustomer === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                >
                  Alla kunder
                </button>
                {customers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleFilterSelect(setFilterCustomer, c.id)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${filterCustomer === c.id ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Site Filter */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'site' ? null : 'site')}
              className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-gray-700">
                {filterSite === 'all' 
                  ? 'Alla platser' 
                  : sitesForCustomer.find(s => s.id === filterSite)?.name || 'Filtrera på plats'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'site' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'site' && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-md max-h-48 overflow-y-auto z-10">
                <button
                  onClick={() => handleFilterSelect(setFilterSite, 'all')}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${filterSite === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                >
                  Alla platser
                </button>
                {sitesForCustomer.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleFilterSelect(setFilterSite, s.id)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${filterSite === s.id ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Inspector Filter */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'inspector' ? null : 'inspector')}
              className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-gray-700">
                {filterInspector === 'all' 
                  ? 'Alla inspektörer' 
                  : getInspectorDisplay(filterInspector) || 'Filtrera på inspektör'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'inspector' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'inspector' && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-md max-h-48 overflow-y-auto z-10">
                <button
                  onClick={() => handleFilterSelect(setFilterInspector, 'all')}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${filterInspector === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                >
                  Alla inspektörer
                </button>
                {uniqueInspectorNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleFilterSelect(setFilterInspector, name)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${filterInspector === name ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                  >
                    {getInspectorDisplay(name)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Site Manager Filter */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'manager' ? null : 'manager')}
              className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-gray-700">
                {filterSiteManager === 'all' 
                  ? 'Alla områdesansvariga' 
                  : getSiteManagerName(filterSiteManager) || 'Filtrera på områdesansvarig'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === 'manager' ? 'rotate-180' : ''}`} />
            </button>
            {openDropdown === 'manager' && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-md max-h-48 overflow-y-auto z-10">
                <button
                  onClick={() => handleFilterSelect(setFilterSiteManager, 'all')}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${filterSiteManager === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                >
                  Alla områdesansvariga
                </button>
                {uniqueSiteManagers.map((managerId) => (
                  <button
                    key={managerId}
                    onClick={() => handleFilterSelect(setFilterSiteManager, managerId)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${filterSiteManager === managerId ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
                  >
                    {getSiteManagerName(managerId)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear Filters Button */}
          {activeFilters > 0 && (
            <button
              onClick={handleClearFilters}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
              Rensa alla filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}