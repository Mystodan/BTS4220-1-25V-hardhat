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
  // Helper to handle sort toggling
  const handleSort = (type) => {
    if (type === 'date') {
      if (activeSort === 'date') {
        // Toggle direction
        setDateSortAsc(!dateSortAsc);
        setFilteredTasks([...filteredTasks].reverse());
      } else {
        // Set to date sort, default direction
        setFilteredTasks([...filteredTasks].sort((a, b) => Number(a.createdAt) - Number(b.createdAt)));
        setDateSortAsc(true);
        setActiveSort('date');
      }
    } else if (type === 'alpha') {
      if (activeSort === 'alpha') {
        setAlphaSortAsc(!alphaSortAsc);
        setFilteredTasks([...filteredTasks].reverse());
      } else {
        setFilteredTasks([...filteredTasks].sort((a, b) => a.content.localeCompare(b.content)));
        setAlphaSortAsc(true);
        setActiveSort('alpha');
      }
    }
  };

  return (
    <div className="filters" style={{ marginTop: '0.5rem', marginBottom: '0.5rem', userSelect: 'none' }}>
      {/* Sort tasks by creation date ascending/descending toggle */}
      <span
        onClick={() => handleSort('date')}
        style={{ marginLeft: '1rem', cursor: 'pointer', fontWeight: 'bold', color: '#ff9800', userSelect: 'none' }}
      >
        Date{activeSort === 'date' ? (dateSortAsc ? ' ↑' : ' ↓') : ''}
      </span>
      {/* Sort tasks A-Z toggle */}
      <span
        onClick={() => handleSort('alpha')}
        style={{ cursor: 'pointer', fontWeight: 'bold', color: '#ff9800', userSelect: 'none' }}
      >
        A-Z{activeSort === 'alpha' ? (alphaSortAsc ? ' ↑' : ' ↓') : ''}
      </span>
    </div>
  );
};

export default FilterNavigator;

