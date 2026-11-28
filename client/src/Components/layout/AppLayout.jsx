import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Minimize2 } from 'lucide-react';

import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useFullscreen } from '../../context/FullscreenContext';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isFullscreen, highlightRestore, exitFullscreen } = useFullscreen();

  const handleOpenSidebar = () => {
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div
      className={`flex min-h-screen text-slate-900 ${
        isFullscreen ? 'bg-[#FFF7ED]' : 'bg-slate-50'
      }`}
    >
      {/* Sidebar Navigation (Hidden in Fullscreen Mode) */}
      {!isFullscreen && (
        <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />
      )}

      {/* Main Content Area */}
      <div
        className={`flex min-w-0 flex-1 flex-col transition-all duration-200 ${
          isFullscreen ? 'pl-0' : 'lg:pl-60'
        }`}
      >
        {/* Top Navbar (Hidden in Fullscreen Mode) */}
        {!isFullscreen && <Navbar onOpenSidebar={handleOpenSidebar} />}

        {/* Floating Restore Fullscreen Button */}
        {isFullscreen && (
          <div className="fixed right-3 top-3 z-40 flex items-center gap-2">
            {highlightRestore && (
              <span className="rounded-lg border border-orange-200 bg-white px-2.5 py-1 text-xs font-semibold text-orange-700 shadow-md">
                Exit Fullscreen first
              </span>
            )}
            <button
              type="button"
              onClick={exitFullscreen}
              title="Exit Fullscreen Mode"
              aria-label="Exit Fullscreen Mode"
              className={`flex h-9 w-9 items-center justify-center rounded-xl border bg-white shadow-md transition ${
                highlightRestore
                  ? 'animate-pulse border-orange-500 bg-orange-50 text-orange-700 ring-4 ring-orange-200'
                  : 'border-orange-200 text-slate-600 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700'
              }`}
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Page Content (Outlet stays mounted at same tree position to preserve state) */}
        <main
          className={`flex-1 animate-fade-in ${
            isFullscreen
              ? 'w-full max-w-none p-2 sm:p-3'
              : 'mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
