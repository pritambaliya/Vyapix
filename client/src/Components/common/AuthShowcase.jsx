import React from 'react';
import {
  ShieldCheck,
  Zap,
  Printer,
  Package,
  CheckCircle2,
  TrendingUp,
  Barcode,
  ShoppingCart,
  Store,
} from 'lucide-react';
import BrandLogo from './BrandLogo';

export const AuthShowcase = ({ title = 'Retail Billing & Inventory ERP' }) => {
  return (
    <div className="hidden lg:flex flex-col justify-between p-8 bg-slate-100/80 dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden shadow-xs transition-colors duration-150">
      {/* Subtle ERP Grid Background Pattern */}
      <div className="absolute inset-0 bg-erp-grid opacity-60 dark:opacity-30 pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 space-y-3">
        <BrandLogo size="sm" showBadge badgeText="Retail Suite" />

        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white pt-1">
          {title}
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
          Engineered for Indian retail shopkeepers, supermarkets, and merchants for rapid POS checkout and accurate inventory ledger.
        </p>
      </div>

      {/* Structured POS / ERP Mockup UI Visual - Adaptive for Light & Dark Theme */}
      <div className="relative z-10 my-6 p-4 rounded-xl bg-white dark:bg-slate-850/90 border border-slate-200 dark:border-slate-750/80 shadow-xs space-y-3.5 backdrop-blur-xs transition-colors">
        {/* Mockup Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-750 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white">
              V
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Terminal 01 • Active Shift
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800">
            GST 100% Ready
          </span>
        </div>

        {/* Mockup Mini Metric Strip */}
        <div className="grid grid-cols-3 gap-2 text-left">
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-medium">
              Today's Sales
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              ₹42,850
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-medium">
              Invoices
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              34
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase block font-medium">
              Low Stock
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              2 Items
            </span>
          </div>
        </div>

        {/* Mockup Mini Cart Snippet */}
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px]">
          <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium">
            <span>1. Basmati Rice 5kg (x2)</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">₹950.00</span>
          </div>
          <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium">
            <span>2. Amul Pure Butter 500g (x1)</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">₹275.00</span>
          </div>
          <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline font-bold text-xs">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] uppercase">
              Grand Total (GST Inc.):
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm">
              ₹1,225.00
            </span>
          </div>
        </div>
      </div>

      {/* Feature Bullet Points Footer */}
      <div className="relative z-10 grid grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Barcode Scanner Fast</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Thermal & A4 Invoices</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Cashier Sub-Accounts</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Automatic Stock Audit</span>
        </div>
      </div>
    </div>
  );
};

export default AuthShowcase;
