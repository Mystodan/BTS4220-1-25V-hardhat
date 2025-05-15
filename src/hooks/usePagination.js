// usePagination.js
// Simple hook for managing pagination state and logic for lists.

import { useState } from "react";

/**
 * usePagination
 * Handles pagination state and provides a function to get the current page's items.
 *
 * @param {number} totalItems - Total number of items in the list
 * @param {number} itemsPerPage - Number of items per page (default: 8)
 * @returns {object} - Pagination state and helper for paginated items
 */
export function usePagination(totalItems, itemsPerPage = 8) {
  // Current page number (1-based)
  const [currentPage, setCurrentPage] = useState(1);
  // Total number of pages
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  // Returns the items for the current page
  const getPaginated = (items) => items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  return {
    currentPage,
    setCurrentPage,
    totalPages,
    getPaginated
  };
}
