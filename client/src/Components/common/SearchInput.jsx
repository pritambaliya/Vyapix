import React from 'react';
import { Search, X } from 'lucide-react';

export const SearchInput = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  className = '',
  ...props
}) => {
  return (
    <div
      className={`relative flex items-center w-full ${className}`}
    >
      
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
        <Search className="w-4 h-4" />
      </div>


      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="
          w-full h-10 rounded-lg
          border border-slate-200
          bg-white
          text-slate-800
          placeholder:text-slate-400
          text-sm
          pl-9 pr-9
          shadow-sm
          transition-all duration-200
          hover:border-orange-300
          focus:outline-none
          focus:border-orange-500
          focus:ring-2 focus:ring-orange-100
        "
        {...props}
      />


      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="
            absolute inset-y-0 right-0 pr-3
            flex items-center justify-center
            text-slate-400
            hover:text-orange-600
            transition-colors duration-200
          "
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
