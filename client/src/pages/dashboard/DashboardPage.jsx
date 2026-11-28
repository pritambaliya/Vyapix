import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

import { CardSkeleton } from '../../Components/common/Skeleton';
import SEO from '../../Components/common/SEO';
import { useAuth } from '../../context/AuthContext';
import dashboardService from '../../services/dashboardService';

import DashboardHeader from './components/DashboardHeader';
import KpiCards from './components/KpiCards';
import SalesAnalyticsSection from './components/SalesAnalyticsSection';
import CounterCashierSection from './components/CounterCashierSection';
import InventoryInsightsSection from './components/InventoryInsightsSection';
import ActivityAndAlertsSection from './components/ActivityAndAlertsSection';

export const DashboardPage = () => {
  const { user, shop, isOwner } = useAuth();
  const navigate = useNavigate();

  const [range, setRange] = useState('last7');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState(null);

  const fetchOverview = useCallback(
    async (activeRange = range, start = customStart, end = customEnd) => {
      if (!isOwner) return;

      setLoading(true);
      setError('');

      try {
        const params = { range: activeRange };
        if (activeRange === 'custom' && start && end) {
          params.startDate = start;
          params.endDate = end;
        }

        const res = await dashboardService.getOverview(params);
        setOverview(res?.data || null);
      } catch (err) {
        console.error('Failed to load dashboard overview:', err);
        setError(
          err?.response?.data?.message ||
            'Unable to load dashboard analytics. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    },
    [isOwner, range, customStart, customEnd]
  );

  useEffect(() => {
    if (range !== 'custom') {
      fetchOverview(range);
    }
  }, [range, fetchOverview]);

  const handleRangeChange = (nextRange) => {
    setRange(nextRange);
  };

  const handleApplyCustomRange = () => {
    if (!customStart || !customEnd) return;
    fetchOverview('custom', customStart, customEnd);
  };

  return (
    <div className="min-h-full space-y-6 overflow-x-hidden rounded-2xl bg-[#FFF7ED] p-3 text-slate-900 sm:p-5">
      <SEO
        title="Dashboard | Vyapix"
        description="Business Control Center — sales analytics, counter performance, cashiers, and inventory insights."
        path="/dashboard"
        noIndex={true}
      />

      <DashboardHeader
        shopName={shop?.shopName}
        ownerName={user?.name}
        range={range}
        onRangeChange={handleRangeChange}
        customStart={customStart}
        customEnd={customEnd}
        onCustomStartChange={setCustomStart}
        onCustomEndChange={setCustomEnd}
        onApplyCustomRange={handleApplyCustomRange}
        selectedRangeLabel={overview?.dateRange?.label}
        loading={loading}
        onRefresh={() => fetchOverview(range, customStart, customEnd)}
        onNewSale={() => navigate('/billing')}
        onAddProduct={() => navigate('/product/create')}
      />

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-white p-4 text-sm text-rose-700 shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchOverview(range, customStart, customEnd)}
            className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
          >
            Retry
          </button>
        </div>
      )}

      {loading && !overview ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <CardSkeleton key={idx} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="h-72 animate-pulse rounded-2xl border border-orange-100 bg-white lg:col-span-2" />
            <div className="h-72 animate-pulse rounded-2xl border border-orange-100 bg-white" />
          </div>
        </div>
      ) : (
        overview && (
          <div className="space-y-6">
            <KpiCards
              kpis={overview.kpis}
              rangeLabel={overview.dateRange?.label}
            />

            <SalesAnalyticsSection salesAnalytics={overview.salesAnalytics} />

            <CounterCashierSection
              counters={overview.counters}
              cashiers={overview.cashiers}
            />

            <InventoryInsightsSection inventory={overview.inventory} />

            <ActivityAndAlertsSection
              alerts={overview.alerts}
              recentActivity={overview.recentActivity}
            />
          </div>
        )
      )}
    </div>
  );
};

export default DashboardPage;
