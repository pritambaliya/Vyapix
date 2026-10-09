import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = forwardRef(
  (
    {
      label,
      name,
      type = 'text',
      placeholder,
      value,
      onChange,
      error,
      helperText,
      required = false,
      disabled = false,
      icon: Icon,
      prefix,
      suffix,
      className = '',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={name}
            className="block text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Icon className="w-4 h-4" />
            </div>
          )}

          {prefix && (
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-medium text-slate-500 dark:text-slate-400">
              {prefix}
            </span>
          )}

          <input
            ref={ref}
            id={name}
            name={name}
            type={inputType}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            className={`w-full h-9 rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-xs sm:text-sm transition-colors duration-150 focus:outline-none focus:ring-1 ${
              error
                ? 'border-rose-500 focus:ring-rose-500 focus:border-rose-500'
                : 'border-slate-300 dark:border-slate-700 focus:ring-emerald-500 focus:border-emerald-500'
            } ${disabled ? 'bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed opacity-75' : ''} ${
              Icon ? 'pl-9' : prefix ? 'pl-8' : 'pl-3'
            } ${isPassword || suffix ? 'pr-9' : 'pr-3'} ${className}`}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}

          {suffix && !isPassword && (
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-medium text-slate-500 dark:text-slate-400">
              {suffix}
            </span>
          )}
        </div>

        {error && (
          <p className="text-[11px] text-rose-500 dark:text-rose-400 font-medium">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
