import FilterBar from '../FilterBar';
import FilterSelect from '../FilterSelect';

export default function SitesFilterMenu({ filterManager, setFilterManager, sortBy, setSortBy, uniqueManagers, getUserName }) {
  return (
    <FilterBar title="Filtrera platser">
      <FilterSelect
        label="Områdesansvarig"
        value={filterManager}
        onChange={setFilterManager}
        options={[
          { value: 'all', label: 'Alla områdesansvariga', disabled: true },
          ...uniqueManagers.map((manager) => ({ value: manager, label: getUserName(manager) }))
        ]}
        placeholder="Områdesansvarig"
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