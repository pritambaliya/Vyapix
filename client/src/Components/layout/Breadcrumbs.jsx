import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Breadcrumbs = () => {
  const location = useLocation();
  const { isOwner } = useAuth();

  const pathnames = location.pathname.split('/').filter(Boolean);

  const routeNames = {
    dashboard: 'Dashboard',
    billing: 'POS Billing',
    products: 'Products & Inventory',
    invoices: 'Invoices',
    accounts: 'Sub-Accounts',
    activity: 'Audit Activity',
    profile: 'Store Settings',
  };

  if (pathnames.length === 0) {
    return null;
  }

  return (
    <nav
      className="hidden items-center space-x-1.5 text-xs text-slate-500 sm:flex"
      aria-label="Breadcrumb"
    >
      {/* Home Link */}
      <Link
        to={isOwner ? '/dashboard' : '/billing'}
        className="flex items-center gap-1 transition-colors hover:text-slate-900"
        aria-label="Go to home"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {/* Breadcrumb Items */}
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;

        const displayName =
          routeNames[name] ||
          (name.length === 24 ? `#${name.slice(-6)}` : name);

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />

            {isLast ? (
              <span
                className="truncate font-semibold text-slate-800"
                aria-current="page"
              >
                {displayName}
              </span>
            ) : (
              <Link
                to={routeTo}
                className="transition-colors hover:text-slate-900"
              >
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
