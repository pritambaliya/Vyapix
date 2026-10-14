import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, ShoppingCart, Clock } from 'lucide-react';

import Breadcrumbs from './Breadcrumbs';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { formatTime } from '../../utils/formatters';

export const Navbar = ({ onOpenSidebar }) => {
  const { user, shop, isOwner } = useAuth();
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Sidebar Toggle & Breadcrumbs */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Breadcrumbs />
        </div>

        {/* Right: Live Clock & POS Terminal */}
        <div className="flex shrink-0 items-center gap-3">
          {/* Live Store Clock */}
          <div className="hidden items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 sm:flex">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>{formatTime(currentTime)}</span>
          </div>

          {/* POS Terminal Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/billing')}
            icon={ShoppingCart}
          >
            <span className="hidden sm:inline">POS Terminal</span>
            <span className="sm:hidden">POS</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
