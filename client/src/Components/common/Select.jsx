import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = forwardRef(
  (
    {
      label,
      name,
      value,
      onChange,
      options = [],
      placeholder,
      error,
      helperText,
      required = false,
      disabled = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const selectId = name || props.id;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-slate-700"
          >
            {label}
            {required && (
              <span className="ml-1 text-rose-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            name={name}
            value={value ?? ''}
            onChange={onChange}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error
                ? `${selectId}-error`
                : helperText
                  ? `${selectId}-helper`
                  : undefined
            }
            className={`
              h-10 w-full appearance-none rounded-lg border
              bg-white pl-3 pr-9 text-sm text-slate-900
              transition-all duration-150
              focus:outline-none focus:ring-2
              ${
                error
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-100'
                  : 'border-slate-300 focus:border-orange-500 focus:ring-orange-100'
              }
              ${
                disabled
                  ? 'cursor-not-allowed bg-slate-100 text-slate-500 opacity-80'
                  : 'cursor-pointer'
              }
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}

            {options.map((opt, index) => {
              const optValue =
                typeof opt === 'object' && opt !== null
                  ? opt.value
                  : opt;

              const optLabel =
                typeof opt === 'object' && opt !== null
                  ? opt.label
                  : opt;

              return (
                <option key={`${optValue}-${index}`} value={optValue}>
                  {optLabel}
                </option>
              );
            })}
          </select>

          <ChevronDown
            className={`pointer-events-none absolute right-3 h-4 w-4 ${
              disabled ? 'text-slate-300' : 'text-slate-400'
            }`}
            aria-hidden="true"
          />
        </div>

        {error && (
          <p
            id={`${selectId}-error`}
            className="text-xs font-medium text-rose-500"
            role="alert"
          >
            {error}
          </p>
        )}

        {!error && helperText && (
          <p
            id={`${selectId}-helper`}
            className="text-xs text-slate-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;