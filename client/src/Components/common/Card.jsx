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
      className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs transition-colors duration-150 ${className}`}
    >
      {hasHeader && (
        <div className="px-4 py-3.5 sm:px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {headerAction && (
            <div className="shrink-0 flex items-center gap-2">
              {headerAction}
            </div>
          )}
        </div>
      )}

      <div className={`${noPadding ? '' : 'p-4 sm:p-5'} ${bodyClassName}`}>
        {children}
      </div>

      {footer && (
        <div className="px-4 py-3 sm:px-5 bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
