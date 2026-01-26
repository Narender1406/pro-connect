export default function JobFilters({ search, setSearch, type, setType }) {
  return (
    <div className="filters">
      <input
        placeholder="Search by role or company"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="all">All</option>
        <option value="Internship">Internship</option>
        <option value="Full Time">Full Time</option>
        <option value="Remote">Remote</option>
      </select>
    </div>
  );
}
