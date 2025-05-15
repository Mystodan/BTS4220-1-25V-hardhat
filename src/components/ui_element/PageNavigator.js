import React from "react";

/**
 * PageNavigator
 * -------------
 * Handles pagination controls for the todo app.
 * Props:
 *   currentPage: number (current page)
 *   setCurrentPage: function (to change page)
 *   totalPages: number (total number of pages)
 */
const PageNavigator = ({ currentPage, setCurrentPage, totalPages }) => (
  <div className="page-navigator-wrapper" style={{
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    position: 'absolute',
    left: 0,
    bottom: 0,
    zIndex: 2,
    background: 'transparent'
  }}>
    {totalPages > 1 ? (
      <nav className="page-navigator" style={{
        width: '100%',
        maxWidth: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap',
        borderRadius: '8px 8px 0 0',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.07)',
        padding: '0.5rem 1rem',
        minHeight: '44px',
        borderTop: 'none',
        border: '1px solid #ff9800',
        fontSize: '1rem'
      }}>
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          style={{ minWidth: '3rem', padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #ff9800', background: currentPage === 1 ? '#eee' : '#fff', color: '#222', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
        >
          Previous
        </button>
        {/* Render page numbers for navigation */}
        {[...Array(totalPages)].map((_, idx) => (
          <button
            key={idx + 1}
            onClick={() => setCurrentPage(idx + 1)}
            style={{
              minWidth: '2.2rem',
              fontWeight: currentPage === idx + 1 ? 'bold' : 'normal',
              background: currentPage === idx + 1 ? '#ff9800' : '#fff',
              color: currentPage === idx + 1 ? '#fff' : '#222',
              border: '1px solid #ff9800',
              borderRadius: '4px',
              cursor: currentPage === idx + 1 ? 'default' : 'pointer',
              outline: 'none',
              padding: '0.3rem 0.7rem',
              margin: '0 0.1rem',
              transition: 'background 0.3s, color 0.3s'
            }}
            disabled={currentPage === idx + 1}
            aria-current={currentPage === idx + 1 ? 'page' : undefined}
          >
            {idx + 1}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{ minWidth: '3rem', padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #ff9800', background: currentPage === totalPages ? '#eee' : '#fff', color: '#222', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
        >
          Next
        </button>
      </nav>
    ) : (
      <nav className="page-navigator" style={{
        width: '100%',
        maxWidth: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap',
        borderRadius: '8px 8px 0 0',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.07)',
        padding: '0.5rem 1rem',
        minHeight: '44px',
        borderTop: 'none',
        color: '#888',
        fontSize: '1rem',
        border: '1px solid #ff9800',
        transition: 'background 0.3s, color 0.3s'
      }}>
        No pages
      </nav>
    )}
  </div>
);

export default PageNavigator;
