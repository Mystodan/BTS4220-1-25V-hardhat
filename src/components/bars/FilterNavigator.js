import React from "react";

/**
 * FilterNavigator
 * ---------------
 * Handles sorting controls for the todo list (date and A-Z sorts).
 * Props:
 *   filteredTasks, setFilteredTasks, dateSortAsc, setDateSortAsc, alphaSortAsc, setAlphaSortAsc, activeSort, setActiveSort
 */
const FilterNavigator = ({
  filteredTasks,
  setFilteredTasks,
  dateSortAsc,
  setDateSortAsc,
  alphaSortAsc,
  setAlphaSortAsc,
  activeSort,
  setActiveSort
}) => {
  return (
    <div className="filters" style={{ marginTop: '0.5rem', marginBottom: '0.5rem', userSelect: 'none' }}>
      {/* Sort tasks by creation date ascending/descending toggle */}
      <span
        onClick={() => {
          setFilteredTasks([...filteredTasks].sort((a, b) => dateSortAsc ? (Number(a.createdAt) - Number(b.createdAt)) : (Number(b.createdAt) - Number(a.createdAt))));
          setDateSortAsc(!dateSortAsc);
          setActiveSort('date');
        }}
        style={{ marginLeft: '1rem', cursor: 'pointer', fontWeight: 'bold', color: '#ff9800', userSelect: 'none' }}
      >
        Date{activeSort === 'date' ? (dateSortAsc ? ' ↑' : ' ↓') : ''}
      </span>
      {/* Sort tasks A-Z/Z-A toggle */}
      <span
        onClick={() => {
          setFilteredTasks([...filteredTasks].sort((a, b) => alphaSortAsc ? a.content.localeCompare(b.content) : b.content.localeCompare(a.content)));
          setAlphaSortAsc(!alphaSortAsc);
          setActiveSort('alpha');
        }}
        style={{ cursor: 'pointer', fontWeight: 'bold', color: '#ff9800', userSelect: 'none' }}
      >
        A-Z{activeSort === 'alpha' ? (alphaSortAsc ? ' ↑' : ' ↓') : ''}
      </span>
    </div>
  );
};

export default FilterNavigator;
