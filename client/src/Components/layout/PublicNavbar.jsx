import { useState } from 'react';
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

  const navLinks = [
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
    { name: 'Pricing', path: '/pricing' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileDropdown(null);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">

        {/* ================= DESKTOP / HEADER ================= */}
        <div className="h-[68px] flex items-center justify-between">

          {/* Logo */}
          <Link
            to="/"
            className="flex-shrink-0"
            onClick={closeMobileMenu}
          >
            <BrandLogo
              to="/"
              size="md"
              showBadge
              badgeText="Retail ERP"
            />
          </Link>

          {/* ================= DESKTOP NAVIGATION ================= */}
          <nav className="hidden lg:flex items-center gap-1 ml-8">
            {navLinks.map((link) => {
              if (link.dropdown) {
                return (
                  <div
                    key={link.name}
                    className="relative group"
                  >
                    <button
                      type="button"
                      className="
                        flex items-center gap-1
                        px-3.5 py-2.5
                        text-[14px]
                        font-medium
                        text-slate-700
                        hover:text-orange-600
                        transition-colors
                      "
                    >
                      {link.name}

                      <ChevronDown
                        size={15}
                        strokeWidth={1.8}
                        className="
                          transition-transform
                          group-hover:rotate-180
                        "
                      />
                    </button>

                    {/* Desktop Dropdown */}
                    <div
                      className="
                        absolute left-0 top-full pt-2
                        opacity-0 invisible translate-y-1
                        group-hover:opacity-100
                        group-hover:visible
                        group-hover:translate-y-0
                        transition-all duration-200
                      "
                    >
                      <div
                        className="
                          w-60
                          bg-white
                          border border-slate-100
                          rounded-xl
                          shadow-xl shadow-slate-200/50
                          p-2
                        "
                      >
                        {link.items.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="
                              block
                              px-3.5 py-2.5
                              rounded-lg
                              text-[14px]
                              text-slate-600
                              hover:text-orange-600
                              hover:bg-orange-50
                              transition-colors
                            "
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              const isActive = location.pathname === link.path;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`
                    px-3.5 py-2.5
                    text-[14px]
                    font-medium
                    transition-colors
                    ${
                      isActive
                        ? 'text-orange-600'
                        : 'text-slate-700 hover:text-orange-600'
                    }
                  `}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* ================= DESKTOP RIGHT ACTIONS ================= */}
          <div className="hidden lg:flex items-center gap-3 ml-auto">

            {!isAuthenticated && (
              <Link
                to="/login"
                className="
                  text-[14px]
                  font-semibold
                  text-slate-700
                  hover:text-orange-600
                  transition-colors
                  px-2
                "
              >
                Login
              </Link>
            )}

            {isAuthenticated ? (
              <Link
                to={isOwner ? '/dashboard' : '/billing'}
              >
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
              <Link to="/register">
                <button
                  className="
                    h-10
                    px-5
                    rounded-lg
                    bg-orange-500
                    hover:bg-orange-600
                    text-white
                    text-[14px]
                    font-semibold
                    shadow-sm
                    hover:shadow-md
                    transition-all
                  "
                >
                  Start Free
                </button>
              </Link>
            )}

          </div>

          {/* ================= MOBILE MENU BUTTON ================= */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="
              lg:hidden
              flex items-center justify-center
              w-10 h-10
              rounded-lg
              text-slate-700
              hover:bg-slate-100
              transition-colors
            "
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>

        </div>

        {/* ================= MOBILE MENU ================= */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 py-4">

            <nav className="flex flex-col">

              {navLinks.map((link) => {
                if (link.dropdown) {
                  const isOpen = mobileDropdown === link.name;

                  return (
                    <div key={link.name}>

                      {/* Dropdown Header */}
                      <button
                        type="button"
                        onClick={() =>
                          setMobileDropdown(
                            isOpen ? null : link.name
                          )
                        }
                        className="
                          w-full
                          flex items-center justify-between
                          px-3 py-3
                          rounded-lg
                          text-[15px]
                          font-medium
                          text-slate-700
                          hover:bg-orange-50
                          hover:text-orange-600
                        "
                      >
                        {link.name}

                        <ChevronDown
                          size={18}
                          className={`
                            transition-transform
                            ${isOpen ? 'rotate-180' : ''}
                          `}
                        />
                      </button>

                      {/* Mobile Dropdown Items */}
                      {isOpen && (
                        <div className="ml-3 pl-3 border-l border-orange-100">

                          {link.items.map((item) => (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={closeMobileMenu}
                              className="
                                block
                                px-3 py-2.5
                                text-sm
                                text-slate-600
                                hover:text-orange-600
                                hover:bg-orange-50
                                rounded-lg
                              "
                            >
                              {item.name}
                            </Link>
                          ))}

                        </div>
                      )}

                    </div>
                  );
                }

                const isActive =
                  location.pathname === link.path;

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={closeMobileMenu}
                    className={`
                      px-3 py-3
                      rounded-lg
                      text-[15px]
                      font-medium
                      ${
                        isActive
                          ? 'text-orange-600 bg-orange-50'
                          : 'text-slate-700 hover:bg-orange-50 hover:text-orange-600'
                      }
                    `}
                  >
                    {link.name}
                  </Link>
                );
              })}

              {/* Mobile Actions */}
              <div className="mt-3 pt-3 border-t border-slate-100">

                {!isAuthenticated && (
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="
                      block
                      px-3 py-3
                      text-[15px]
                      font-semibold
                      text-slate-700
                      hover:text-orange-600
                    "
                  >
                    Login
                  </Link>
                )}

                {isAuthenticated ? (
                  <Link
                    to={isOwner ? '/dashboard' : '/billing'}
                    onClick={closeMobileMenu}
                    className="
                      flex items-center justify-center gap-2
                      w-full
                      h-11
                      mt-2
                      rounded-lg
                      bg-orange-500
                      hover:bg-orange-600
                      text-white
                      text-sm
                      font-semibold
                    "
                  >
                    {isOwner ? 'Dashboard' : 'Open POS'}
                    <ArrowRight size={17} />
                  </Link>
                ) : (
                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="
                      flex items-center justify-center
                      w-full
                      h-11
                      mt-2
                      rounded-lg
                      bg-orange-500
                      hover:bg-orange-600
                      text-white
                      text-sm
                      font-semibold
                    "
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