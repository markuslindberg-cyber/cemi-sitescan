import FilterBar from '../FilterBar';
import FilterSelect from '../FilterSelect';

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
  return (
    <FilterBar title="Filtrera inspektioner">
      <div className="grid grid-cols-2 gap-4">
        <FilterSelect
          label="Kund"
          value={filterCustomer}
          onChange={(v) => {
            setFilterCustomer(v);
            setFilterSite('all');
          }}
          options={[
            { value: 'all', label: 'Alla kunder' },
            ...customers.map((c) => ({ value: c.id, label: c.name }))
          ]}
          placeholder="Alla kunder"
        />

        <FilterSelect
          label="Plats"
          value={filterSite}
          onChange={setFilterSite}
          options={[
            { value: 'all', label: 'Alla platser' },
            ...sitesForCustomer.map((s) => ({ value: s.id, label: s.name }))
          ]}
          placeholder="Alla platser"
        />

        <FilterSelect
          label="Inspektör"
          value={filterInspector}
          onChange={setFilterInspector}
          options={[
            { value: 'all', label: 'Alla inspektörer' },
            ...uniqueInspectorNames.map((name) => ({ value: name, label: getInspectorDisplay(name) }))
          ]}
          placeholder="Alla inspektörer"
        />

        <FilterSelect
          label="Områdesansvarig"
          value={filterSiteManager}
          onChange={setFilterSiteManager}
          options={[
            { value: 'all', label: 'Alla områdesansvariga' },
            ...uniqueSiteManagers.map((managerId) => ({ value: managerId, label: getSiteManagerName(managerId) }))
          ]}
          placeholder="Alla områdesansvariga"
        />

        <div className="col-span-2">
          <FilterSelect
            label="Sortera efter"
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'namn', label: 'Namn' },
              { value: 'status', label: 'Status' },
              { value: 'datum', label: 'Datum' },
              { value: 'senast', label: 'Senast använd' }
            ]}
            placeholder="Sortera efter"
          />
        </div>
      </div>
    </FilterBar>
  );
}