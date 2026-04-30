import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SortDropdown({ sortBy, setSortBy }) {
  const [isOpen, setIsOpen] = useState(false);

  const sortOptions = [
    { value: 'namn', label: 'Namn' },
    { value: 'datum', label: 'Datum' },
    { value: 'senast', label: 'Senast använd' }
  ];

  const currentLabel = sortOptions.find(o => o.value === sortBy)?.label || 'Sortera';

  return (
    <div className="relative w-full md:w-auto">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full md:w-auto gap-2"
      >
        <span>Sortera: {currentLabel}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg z-50 md:left-auto md:right-0">
          {sortOptions.map(option => (
            <button
              key={option.value}
              onClick={() => {
                setSortBy(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-sm ${sortBy === option.value ? 'bg-blue-50 text-blue-700 font-medium' : ''}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}