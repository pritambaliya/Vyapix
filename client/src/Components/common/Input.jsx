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
    const inputType = isPassword
      ? showPassword
        ? 'text'
        : 'password'
      : type;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={name}
            className="block text-xs font-medium text-slate-700"
          >
            {label}
            {required && (
              <span className="ml-1 text-rose-500">*</span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {Icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Icon className="h-4 w-4" />
            </div>
          )}

          {prefix && (
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-medium text-slate-500">
              {prefix}
            </span>
          )}

          <input
            ref={ref}
            id={name}
            name={name}
            type={inputType}
            value={value ?? ''}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            aria-invalid={Boolean(error)}
            className={`
              h-10 w-full rounded-lg border
              bg-slate-50
              text-sm text-slate-800
             
              placeholder:text-slate-400
              transition-all duration-200
              focus:bg-white
              focus:outline-none
              focus:ring-2
              ${
                error
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-100'
                  : 'border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:ring-orange-100'
              }
              ${
                disabled
                  ? 'cursor-not-allowed bg-slate-100 opacity-70'
                  : ''
              }
              ${Icon ? 'pl-9' : prefix ? 'pl-8' : 'pl-3'}
              ${isPassword || suffix ? 'pr-9' : 'pr-3'}
              ${className}
            `}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition-colors hover:text-orange-600"
              aria-label={
                showPassword ? 'Hide password' : 'Show password'
              }
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}

          {suffix && !isPassword && (
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-medium text-slate-500">
              {suffix}
            </span>
          )}
        </div>

        {error && (
          <p className="text-xs font-medium text-rose-500" role="alert">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p className="text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;