// src/components/FilterBar.jsx
import React from "react";
import { RotateCcw } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { VIBES } from "../constants/vibes";

export default function FilterBar({
  filters,
  setFilters,
  options = {},
  isOpen,
  onToggle,
  activeFilterCount = 0,
  onReset,
}) {
  const { theme } = useTheme();

  const ageRanges = [
    { label: "All age groups", value: "" },
    { label: "18–25", value: "18-25" },
    { label: "26–35", value: "26-35" },
    { label: "36–50", value: "36-50" },
    { label: "51+", value: "51-120" },
  ];

  const availabilityOptions = [
    { label: "All presence", value: "" },
    { label: "Present now", value: "online" },
    { label: "Quiet presence", value: "offline" },
  ];

  const selectStyle = {
    background: theme.card,
    border: `1px solid ${theme.border}`,
    color: theme.fg,
    borderRadius: 9,
    padding: "9px 12px",
    fontSize: 12,
    fontFamily: "'Manrope', sans-serif",
    outline: "none",
    width: "100%",
  };

  return (
    <div className="w-full space-y-3">
      {isOpen && (
        <div
          className="p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 transition-all duration-300"
          style={{
            background: theme.card,
            borderColor: theme.border,
          }}
        >
          {/* Vibe filter */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: theme.muted }}>
              Vibe
            </label>
            <select
              style={selectStyle}
              value={filters.vibe || ""}
              onChange={(e) => setFilters((f) => ({ ...f, vibe: e.target.value }))}
            >
              <option value="" style={{ background: theme.bg, color: theme.fg }}>
                All vibes
              </option>
              {VIBES.map((v) => (
                <option key={v.name} value={v.name} style={{ background: theme.bg, color: theme.fg }}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Availability filter */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: theme.muted }}>
              Availability
            </label>
            <select
              style={selectStyle}
              value={filters.availability || ""}
              onChange={(e) => setFilters((f) => ({ ...f, availability: e.target.value }))}
            >
              {availabilityOptions.map((a) => (
                <option key={a.value} value={a.value} style={{ background: theme.bg, color: theme.fg }}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {/* City filter */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: theme.muted }}>
              Location
            </label>
            <select
              style={selectStyle}
              value={filters.city || ""}
              onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
            >
              <option value="" style={{ background: theme.bg, color: theme.fg }}>
                All locations
              </option>
              {(options.cities || []).map((c) => (
                <option key={c} value={c} style={{ background: theme.bg, color: theme.fg }}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Gender / Age filter */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1.5" style={{ color: theme.muted }}>
              Age & Gender
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                style={selectStyle}
                value={filters.gender || ""}
                onChange={(e) => setFilters((f) => ({ ...f, gender: e.target.value }))}
              >
                <option value="" style={{ background: theme.bg, color: theme.fg }}>
                  Gender
                </option>
                <option value="male" style={{ background: theme.bg, color: theme.fg }}>Male</option>
                <option value="female" style={{ background: theme.bg, color: theme.fg }}>Female</option>
                <option value="other" style={{ background: theme.bg, color: theme.fg }}>Other</option>
              </select>

              <select
                style={selectStyle}
                value={filters.age || ""}
                onChange={(e) => setFilters((f) => ({ ...f, age: e.target.value }))}
              >
                {ageRanges.map((r) => (
                  <option key={r.value} value={r.value} style={{ background: theme.bg, color: theme.fg }}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Footer */}
          {activeFilterCount > 0 && (
            <div className="sm:col-span-2 lg:col-span-4 pt-2 border-t flex items-center justify-between" style={{ borderColor: theme.border }}>
              <span className="text-[11px]" style={{ color: theme.muted }}>
                {activeFilterCount} active {activeFilterCount === 1 ? "filter" : "filters"} applied
              </span>
              <button
                onClick={onReset}
                className="text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
                style={{
                  background: theme.surface,
                  border: `1px solid ${theme.border}`,
                  color: theme.fg,
                }}
              >
                <RotateCcw size={12} />
                <span>Reset all</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
