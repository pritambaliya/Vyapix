import React from 'react';
import { PackageOpen, ArrowRight } from 'lucide-react';
import Button from './Button';

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No records found',
  message = 'There are no items to display at this moment.',
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-5 py-12 sm:px-8 sm:py-16 ${className}`}
    >

      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-100 bg-orange-50 text-orange-500 shadow-sm">
        <Icon className="h-7 w-7" strokeWidth={1.7} />
      </div>


      <h3 className="mt-5 text-base font-bold tracking-tight text-slate-900 sm:text-lg">
        {title}
      </h3>


      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
        {message}
      </p>


      {actionText && onAction && (
        <div className="mt-6">
          <Button
            variant="primary"
            size="sm"
            onClick={onAction}
            icon={ArrowRight}
          >
            {actionText}
          </Button>
        </div>
      )}
      
      <div className="mt-8 h-1 w-12 rounded-full bg-orange-200" />
    </div>
  );
};

export default EmptyState;
