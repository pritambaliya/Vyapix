import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

import Button from './Button';

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  limit = 10,
  onPageChange,
}) => {
  // Normalize pagination values
  const safeTotalItems = Math.max(0, Number(totalItems) || 0);
  const safeLimit = Math.max(1, Number(limit) || 10);
  const safeTotalPages = Math.max(
    1,
    Number(totalPages) || 1
  );

  const safeCurrentPage = Math.min(
    Math.max(1, Number(currentPage) || 1),
    safeTotalPages
  );

  // Hide pagination when everything fits on one page
  if (safeTotalPages <= 1 && safeTotalItems <= safeLimit) {
    return null;
  }

  const start =
    safeTotalItems === 0
      ? 0
      : (safeCurrentPage - 1) * safeLimit + 1;

  const end = Math.min(
    safeCurrentPage * safeLimit,
    safeTotalItems
  );

  const handlePageChange = (page) => {
    if (typeof onPageChange !== 'function') return;

    if (page < 1 || page > safeTotalPages) return;

    if (page === safeCurrentPage) return;

    onPageChange(page);
  };

  const buttonClass =
    'inline-flex items-center justify-center gap-1.5 rounded-lg border border-orange-200 bg-white text-slate-600 transition-all duration-200 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-300 disabled:hover:border-slate-200 disabled:hover:bg-slate-50 disabled:hover:text-slate-300';

  return (
    <div className="flex flex-col gap-3 border-t border-orange-100 py-4 sm:flex-row sm:items-center sm:justify-between">

      {/* RESULTS INFORMATION */}

      <div className="text-center text-xs text-slate-500 sm:text-left">
        Showing{' '}
        <span className="font-bold text-slate-800">
          {start}
        </span>
        {' '}to{' '}
        <span className="font-bold text-slate-800">
          {end}
        </span>
        {' '}of{' '}
        <span className="font-bold text-slate-800">
          {safeTotalItems}
        </span>
        {' '}results
      </div>

      {/* PAGE NAVIGATION */}

      <div className="flex flex-wrap items-center justify-center gap-2">

        {/* FIRST PAGE */}

        <button
          type="button"
          onClick={() => handlePageChange(1)}
          disabled={safeCurrentPage <= 1}
          aria-label="Go to first page"
          title="First page"
          className={`${buttonClass} h-9 w-9`}
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* PREVIOUS PAGE */}

        <button
          type="button"
          onClick={() =>
            handlePageChange(safeCurrentPage - 1)
          }
          disabled={safeCurrentPage <= 1}
          aria-label="Go to previous page"
          className={`${buttonClass} h-9 px-3 text-xs font-semibold`}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">
            Previous
          </span>
        </button>

        {/* CURRENT PAGE */}

        <div
          className="flex h-9 items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-3 text-xs"
          aria-current="page"
          aria-label={`Page ${safeCurrentPage} of ${safeTotalPages}`}
        >
          <span className="text-slate-500">
            Page
          </span>

          <span className="font-bold text-orange-600">
            {safeCurrentPage}
          </span>

          <span className="text-slate-400">
            of
          </span>

          <span className="font-semibold text-slate-700">
            {safeTotalPages}
          </span>
        </div>

        {/* NEXT PAGE */}

        <button
          type="button"
          onClick={() =>
            handlePageChange(safeCurrentPage + 1)
          }
          disabled={safeCurrentPage >= safeTotalPages}
          aria-label="Go to next page"
          className={`${buttonClass} h-9 px-3 text-xs font-semibold`}
        >
          <span className="hidden sm:inline">
            Next
          </span>
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* LAST PAGE */}

        <button
          type="button"
          onClick={() =>
            handlePageChange(safeTotalPages)
          }
          disabled={safeCurrentPage >= safeTotalPages}
          aria-label="Go to last page"
          title="Last page"
          className={`${buttonClass} h-9 w-9`}
        >
          <ChevronsRight className="h-4 w-4" />
        </button>

      </div>
    </div>
  );
};

export default Pagination;
