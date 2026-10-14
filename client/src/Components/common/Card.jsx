import React from 'react';

export const Card = ({
  children,
  title,
  subtitle,
  icon: Icon,
  headerAction,
  footer,
  className = '',
  bodyClassName = '',
  noPadding = false,
}) => {
  const hasHeader = title || subtitle || Icon || headerAction;

  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-300 bg-slate-100 shadow-sm ${className}`}
    >
      {hasHeader && (
        <div className="flex items-center justify-between gap-4 border-b border-slate-300 bg-slate-200/70 px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 text-slate-700">
                <Icon className="h-4 w-4" />
              </div>
            )}

            <div className="min-w-0">
              {title && (
                <h3 className="truncate text-sm font-semibold text-slate-900">
                  {title}
                </h3>
              )}

              {subtitle && (
                <p className="mt-0.5 truncate text-xs font-medium text-slate-600">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {headerAction && (
            <div className="flex shrink-0 items-center gap-2">
              {headerAction}
            </div>
          )}
        </div>
      )}

      {/* Card Body */}
      <div className={`${noPadding ? '' : 'p-4 sm:p-5'} ${bodyClassName}`}>
        {children}
      </div>

      {/* Card Footer */}
      {footer && (
        <div className="border-t border-slate-300 bg-slate-200/70 px-4 py-3 sm:px-5">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
