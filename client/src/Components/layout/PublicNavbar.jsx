import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ArrowRight,
  Menu,
  X,
} from 'lucide-react';

import Button from '../common/Button';
import BrandLogo from '../common/BrandLogo';
import { useAuth } from '../../context/AuthContext';

export const PublicNavbar = () => {
  const location = useLocation();
  const { isAuthenticated, isOwner } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState(null);

  const [scrolled, setScrolled] = useState(false);

useEffect(() => {
  const handleScroll = () => {
    setScrolled(window.scrollY > 50);
  };

  window.addEventListener('scroll', handleScroll);
  handleScroll();

  return () => window.removeEventListener('scroll', handleScroll);
}, []);

  const navLinks = [
    {
      name: 'Home',
      path: '/',
    },
    {
      name: 'Features',
      dropdown: true,
      items: [
        { name: 'Billing & Invoicing', path: '/features/billing' },
        { name: 'Inventory Management', path: '/features/inventory' },
        { name: 'GST Billing', path: '/features/gst' },
        { name: 'Reports', path: '/features/reports' },
      ],
    },
    {
      name: 'Solutions',
      dropdown: true,
      items: [
        { name: 'Retail Stores', path: '/solutions/retail' },
        { name: 'Wholesale', path: '/solutions/wholesale' },
        { name: 'Small Business', path: '/solutions/business' },
      ],
    },
    {
      name: 'Pricing',
      path: '/pricing',
    },
    {
      name: 'About Us',
      path: '/about',
    },
    {
      name: 'Contact',
      path: '/contact',
    },
  ];

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileDropdown(null);
  };

  const isLinkActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  return (
<header
  className={`sticky top-0 z-50 border-b transition-all duration-300 ${
    scrolled
      ? 'border-transparent bg-transparent backdrop-blur-sm'
      : 'border-slate-100 bg-white shadow-s'
  }`}
>
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex h-[85px] items-center justify-between">

          {/* Logo */}
          <Link
            to="/"
            className="shrink-0"
            onClick={closeMobileMenu}
          >
            <BrandLogo
              to="/"
              size="md"
              showBadge
              badgeText="Retail ERP"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="ml-8 hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => {
              if (link.dropdown) {
                const isDropdownActive = link.items.some((item) =>
                  isLinkActive(item.path)
                );

                return (
                  <div
                    key={link.name}
                    className="group relative"
                  >
                    <button
                      type="button"
                      className={`flex items-center gap-1 rounded-lg px-3 py-2.5 font-sans text-[14px] font-medium transition-colors ${
                        isDropdownActive
                          ? 'text-orange-600'
                          : 'text-slate-700 hover:text-orange-600'
                      }`}
                    >
                      {link.name}

                      <ChevronDown
                        size={15}
                        strokeWidth={1.8}
                        className="transition-transform duration-200 group-hover:rotate-180"
                      />
                    </button>

                    {/* Desktop Dropdown */}
                    <div className="invisible absolute left-0 top-full z-50 translate-y-2 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                      <div className="w-60 rounded-xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-200/50">
                        {link.items.map((item) => {
                          const active = isLinkActive(item.path);

                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              className={`block rounded-lg px-3.5 py-2.5 font-sans text-[14px] transition-colors ${
                                active
                                  ? 'bg-orange-50 font-semibold text-orange-600'
                                  : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                              }`}
                            >
                              {item.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              const isActive = isLinkActive(link.path);

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMobileMenu}
                  aria-current={isActive ? 'page' : undefined}
                  className={`rounded-lg px-3 py-2.5 font-sans text-[14px] font-medium transition-colors ${
                    isActive
                      ? 'text-orange-600'
                      : 'text-slate-700 hover:text-orange-600'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="ml-auto hidden items-center gap-3 lg:flex">

            {!isAuthenticated && (
              <Link
                to="/login"
                className="px-2 font-sans text-[14px] font-semibold text-slate-700 transition-colors hover:text-orange-600"
              >
                Login
              </Link>
            )}

            {isAuthenticated ? (
              <Link to={isOwner ? '/dashboard' : '/billing'}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  {isOwner ? 'Dashboard' : 'Open POS'}
                </Button>
              </Link>
            ) : (
              <Link
                to="/register"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-orange-500 px-5 font-sans text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md"
              >
                Start Free
              </Link>
            )}

          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition-colors hover:bg-slate-100 lg:hidden"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>

        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-100 py-4 lg:hidden">
            <nav className="flex flex-col">

              {navLinks.map((link) => {
                if (link.dropdown) {
                  const isOpen = mobileDropdown === link.name;
                  const isDropdownActive = link.items.some((item) =>
                    isLinkActive(item.path)
                  );

                  return (
                    <div key={link.name}>

                      {/* Mobile Dropdown Header */}
                      <button
                        type="button"
                        onClick={() =>
                          setMobileDropdown(isOpen ? null : link.name)
                        }
                        aria-expanded={isOpen}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-3 font-sans text-[15px] font-medium transition-colors ${
                          isDropdownActive
                            ? 'text-orange-600'
                            : 'text-slate-700 hover:bg-orange-50 hover:text-orange-600'
                        }`}
                      >
                        {link.name}

                        <ChevronDown
                          size={18}
                          className={`transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {/* Mobile Dropdown Items */}
                      {isOpen && (
                        <div className="ml-3 border-l border-orange-100 pl-3">
                          {link.items.map((item) => {
                            const active = isLinkActive(item.path);

                            return (
                              <Link
                                key={item.path}
                                to={item.path}
                                onClick={closeMobileMenu}
                                className={`block rounded-lg px-3 py-2.5 font-sans text-sm transition-colors ${
                                  active
                                    ? 'bg-orange-50 font-semibold text-orange-600'
                                    : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                                }`}
                              >
                                {item.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}

                    </div>
                  );
                }

                const isActive = isLinkActive(link.path);

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={closeMobileMenu}
                    aria-current={isActive ? 'page' : undefined}
                    className={`rounded-lg px-3 py-3 font-sans text-[15px] font-medium transition-colors ${
                      isActive
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-slate-700 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}

              {/* Mobile Actions */}
              <div className="mt-3 border-t border-slate-100 pt-3">

                {!isAuthenticated && (
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="block px-3 py-3 font-sans text-[15px] font-semibold text-slate-700 transition-colors hover:text-orange-600"
                  >
                    Login
                  </Link>
                )}

                {isAuthenticated ? (
                  <Link
                    to={isOwner ? '/dashboard' : '/billing'}
                    onClick={closeMobileMenu}
                    className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-orange-500 font-sans text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                  >
                    {isOwner ? 'Dashboard' : 'Open POS'}
                    <ArrowRight size={17} />
                  </Link>
                ) : (
                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-orange-500 font-sans text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                  >
                    Start Free
                  </Link>
                )}

              </div>

            </nav>
          </div>
        )}

      </div>
    </header>
  );
};

export default PublicNavbar;

