import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  Users,
  Activity,
  Settings,
  LogOut,
  X,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import BrandLogo from '../common/BrandLogo';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, shop, isOwner, logout } = useAuth();
  const { info } = useToast();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      info('You have been logged out.');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navItems = isOwner
    ? [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
        },
        {
          name: 'POS Billing',
          path: '/billing',
          icon: ShoppingCart,
        },
        {
          name: 'Products & Stock',
          path: '/products',
          icon: Package,
        },
        {
          name: 'Invoices',
          path: '/invoices',
          icon: FileText,
        },
        {
          name: 'Sub-Accounts',
          path: '/accounts',
          icon: Users,
        },
        {
          name: 'Audit Activity',
          path: '/activity',
          icon: Activity,
        },
        {
          name: 'Store Settings',
          path: '/profile',
          icon: Settings,
        },
      ]
    : [
        {
          name: 'POS Billing',
          path: '/billing',
          icon: ShoppingCart,
        },
        {
          name: 'My Invoices',
          path: '/invoices',
          icon: FileText,
        },
        {
          name: 'Operator Profile',
          path: '/profile',
          icon: Settings,
        },
      ];

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white text-slate-700">
      {/* Brand and Store Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {shop?.logo?.url ? (
            <img
              src={shop.logo.url}
              alt={shop.shopName || 'Store logo'}
              className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-0.5"
            />
          ) : (
            <BrandLogo size="xs" showText={false} />
          )}

          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-slate-900">
              {shop?.shopName || 'Vyapix ERP'}
            </h1>

            <p className="truncate text-[11px] text-slate-500">
              {isOwner
                ? 'Store Administrator'
                : `Cashier (${user?.billingCode || 'Operator'})`}
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 space-y-1 overflow-y-auto px-3 py-5"
        aria-label="Main navigation"
      >
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
          Main Menu
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  onClose?.();
                }
              }}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-50 font-semibold text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                      isActive
                        ? 'text-emerald-600'
                        : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />

                  <span className="truncate">{item.name}</span>

                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="shrink-0 border-t border-slate-100 p-3">
        <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700">
              {(
                user?.name ||
                user?.employeeName ||
                'U'
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-900">
                {user?.name || user?.employeeName || 'User'}
              </p>

              <p className="mt-0.5 text-[10px] text-slate-500">
                {isOwner ? 'Store Owner' : 'Cashier'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:flex lg:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          isOpen
            ? 'pointer-events-auto visible'
            : 'pointer-events-none invisible'
        }`}
        aria-hidden={!isOpen}
      >
        {/* Overlay */}
        <button
          type="button"
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-200 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
          aria-label="Close navigation menu"
          tabIndex={isOpen ? 0 : -1}
        />

        {/* Drawer */}
        <div
          className={`absolute inset-y-0 left-0 w-64 max-w-[85vw] shadow-2xl transition-transform duration-200 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
