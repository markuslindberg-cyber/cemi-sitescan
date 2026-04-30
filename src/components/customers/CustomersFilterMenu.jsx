import FilterBar from '../FilterBar';
import FilterSelect from '../FilterSelect';

export default function CustomersFilterMenu({
  filterManager,
  setFilterManager,
  sortBy,
  setSortBy,
  uniqueManagers,
  getManagerName
}) {
  return (
    <FilterBar title="Filtrera kunder">
      <FilterSelect
        label="Kundansvarig"
        value={filterManager}
        onChange={setFilterManager}
        options={[
          { value: 'all', label: 'Alla kundansvariga' },
          { value: 'none', label: 'Ingen ansvarig' },
          ...uniqueManagers.map(manager => ({ value: manager, label: getManagerName(manager) }))
        ]}
        placeholder="Kundansvarig"
      />

      <FilterSelect
        label="Sortera efter"
        value={sortBy}
        onChange={setSortBy}
        options={[
          { value: 'namn', label: 'Namn' },
          { value: 'datum', label: 'Datum' },
          { value: 'senast', label: 'Senast använd' }
        ]}
        placeholder="Sortera"
      />
    </FilterBar>
  );
}