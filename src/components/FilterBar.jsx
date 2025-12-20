// src/components/FilterBar.jsx
import React from "react";

export default function FilterBar({ filters, setFilters, options }) {
  const ageRanges = [
    { label: "All ages", value: "" },
    { label: "13–17", value: "13-17" },
    { label: "18–24", value: "18-24" },
    { label: "25–34", value: "25-34" },
    { label: "35–44", value: "35-44" },
    { label: "45+", value: "45-200" }
  ];

  const onAgeChange = (v) => setFilters((f) => ({ ...f, age: v }));
  const onGenderChange = (v) => setFilters((f) => ({ ...f, gender: v }));
  const onCityChange = (v) => setFilters((f) => ({ ...f, city: v }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
      <select
        className="p-3 rounded-xl border"
        value={filters.gender}
        onChange={(e) => onGenderChange(e.target.value)}
      >
        <option value="">All genders</option>
        {options.genders.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>

      <select
        className="p-3 rounded-xl border"
        value={filters.city}
        onChange={(e) => onCityChange(e.target.value)}
      >
        <option value="">All cities</option>
        {options.cities.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        className="p-3 rounded-xl border"
        value={filters.age}
        onChange={(e) => onAgeChange(e.target.value)}
      >
        {ageRanges.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
    </div>
  );
}
