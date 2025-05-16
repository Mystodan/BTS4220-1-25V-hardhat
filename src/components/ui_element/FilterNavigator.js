import React from "react";

// Simple fuzzy match: returns true if all chars in pattern appear in order in str
function fuzzyMatch(str, pattern) {
  str = (str || "").toLowerCase();
  pattern = (pattern || "").toLowerCase();
  let j = 0;
  for (let i = 0; i < str.length && j < pattern.length; i++) {
    if (str[i] === pattern[j]) j++;
  }
  return j === pattern.length;
}

/**
 * FilterNavigator
 * ---------------
 * Handles sorting controls for the todo list (date and A-Z sorts).
 * Props:
 *   sortType, sortOrder, handleSortTypeChange, handleSortOrderChange, search, handleSearch
 */
const FilterNavigator = ({
  sortType,
  sortOrder,
  handleSortTypeChange,
  handleSortOrderChange,
  search,
  handleSearch
}) => {
  return (
    <div className="filters" style={{ marginTop: '0.5rem', marginBottom: '0.5rem', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', width: '100%' }}>
      {/* Sort tasks by creation date ascending/descending toggle */}
      <span
        onClick={() => {
          if (sortType === 'date') {
            handleSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
          } else {
            handleSortTypeChange('date');
          }
        }}
        style={{ cursor: 'pointer', fontWeight: 'bold', color: '#ff9800', userSelect: 'none', minWidth: 60, textAlign: 'center' }}
      >
        Date{sortType === 'date' ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
      </span>
      {/* Search bar */}
      <input
        type="text"
        placeholder="Search tasks..."
        value={search}
        onChange={handleSearch}
        style={{ width: 240, maxWidth: '100%', padding: '6px 14px', borderRadius: 4, border: '1px solid #ccc', fontSize: 15, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
      />
      {/* Sort tasks A-Z toggle */}
      <span
        onClick={() => {
          if (sortType === 'alpha') {
            handleSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
          } else {
            handleSortTypeChange('alpha');
          }
        }}
        style={{ cursor: 'pointer', fontWeight: 'bold', color: '#ff9800', userSelect: 'none', minWidth: 60, textAlign: 'center' }}
      >
        A-Z{sortType === 'alpha' ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
      </span>
    </div>
  );
};

export default FilterNavigator;

