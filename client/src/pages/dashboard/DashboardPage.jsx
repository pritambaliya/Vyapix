import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  Plus,
  FileText,
  ChevronRight,
} from 'lucide-react';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import Card from '../../Components/common/Card';
import Button from '../../Components/common/Button';
import Badge from '../../Components/common/Badge';
import { CardSkeleton } from '../../Components/common/Skeleton';

import billingService from '../../services/billingService';
import productService from '../../services/productService';
import accountService from '../../services/accountService';

import {
  formatCurrency,
  formatDateTime,
} from '../../utils/formatters';

import { useAuth } from '../../context/AuthContext';

const PIE_COLORS = ['#059669', '#4F46E5', '#D97706', '#E11D48'];

export const DashboardPage = () => {
  const { shop, isOwner } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBills: 0,
    totalProducts: 0,
    lowStockCount: 0,
  });

  const [recentBills, setRecentBills] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Fetch Bills
      const billsRes = isOwner
        ? await billingService.getOwnerBills({ limit: 50 })
        : await billingService.getBillingBills({ limit: 50 });

      const bills = billsRes.data?.bills || [];

      const totalBillsCount =
        billsRes.data?.pagination?.total ?? bills.length;

      let revenueSum = 0;

      const paymentMap = {
        cash: 0,
        upi: 0,
        card: 0,
        mixed: 0,
      };

      const dateMap = {};

      bills.forEach((bill) => {
        if (bill.status === 'refunded') return;

        const amount = Number(bill.grandTotal || 0);

        revenueSum += amount;

        const method = String(
          bill.paymentMethod || 'cash'
        ).toLowerCase();

        paymentMap[method] = (paymentMap[method] || 0) + amount;

        if (bill.createdAt) {
          const date = new Date(bill.createdAt);

          if (!Number.isNaN(date.getTime())) {
            const dateKey = date.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            });

            dateMap[dateKey] = (dateMap[dateKey] || 0) + amount;
          }
        }
      });

      // 2. Sales Trend
      // Sort bills by date before building the daily sales chart.
      const trendData = Object.entries(dateMap)
        .map(([date, sales]) => ({
          date,
          sales: Math.round(sales),
        }))
        .slice(-7);

      // 3. Payment Breakdown
      const pieData = Object.entries(paymentMap)
        .filter(([, value]) => value > 0)
        .map(([name, value]) => ({
          name: name.toUpperCase(),
          value: Math.round(value),
        }));

      // 4. Fetch Products
      let products = [];
      let totalProducts = 0;
      let lowStockItems = [];

      try {
        const productsRes = isOwner
          ? await productService.getOwnerProducts({ limit: 100 })
          : await productService.getBillingProducts({ limit: 100 });

        products = productsRes.data?.products || [];

        totalProducts =
          productsRes.data?.pagination?.total ?? products.length;

        lowStockItems = products.filter((product) => {
          const stock = Number(product.stock ?? 0);
          const stockLimit = Number(product.lowStockLimit ?? 5);

          return stock <= stockLimit;
        });
      } catch (productError) {
        console.error('Failed to load products:', productError);
      }

      // 5. Fetch Activities (Owner Only)
      let activities = [];

      if (isOwner) {
        try {
          const activitiesRes =
            await accountService.getAllActivities();

          activities =
            activitiesRes.data?.activities?.slice(0, 5) || [];
        } catch (activityError) {
          console.error('Failed to load activities:', activityError);
        }
      }

      // 6. Update Dashboard State
      setStats({
        totalRevenue: revenueSum,
        totalBills: totalBillsCount,
        totalProducts,
        lowStockCount: lowStockItems.length,
      });

      setRecentBills(bills.slice(0, 6));
      setRecentActivities(activities);

      setSalesTrend(
        trendData.length > 0
          ? trendData
          : [{ date: 'Today', sales: 0 }]
      );

      setPaymentBreakdown(pieData);
      setLowStockProducts(lowStockItems.slice(0, 5));
    } catch (dashboardError) {
      console.error('Failed to load dashboard:', dashboardError);
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isOwner]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="min-h-full space-y-6 bg-white text-slate-900">
      {/* Dashboard Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {shop?.shopName || 'Store'} Overview
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Operational summary, revenue metrics, and inventory alerts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/billing')}
            icon={ShoppingCart}
          >
            Open POS Register
          </Button>

          {isOwner && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/products')}
              icon={Plus}
            >
              Add Product
            </Button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-rose-700">{error}</p>

          <Button
            variant="secondary"
            size="sm"
            onClick={fetchDashboardData}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <CardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Revenue
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4">
              <h2 className="text-2xl font-bold text-slate-900">
                {formatCurrency(stats.totalRevenue)}
              </h2>

              <p className="mt-1 text-[11px] font-medium text-emerald-600">
                Revenue from loaded bills
              </p>
            </div>
          </div>

          {/* Total Invoices */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Invoices
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <FileText className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4">
              <h2 className="text-2xl font-bold text-slate-900">
                {stats.totalBills}
              </h2>

              <p className="mt-1 text-[11px] text-slate-500">
                Customer bills
              </p>
            </div>
          </div>

          {/* Total Products */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Catalog
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <Package className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4">
              <h2 className="text-2xl font-bold text-slate-900">
                {stats.totalProducts}
              </h2>

              <p className="mt-1 text-[11px] text-slate-500">
                Products in inventory
              </p>
            </div>
          </div>

          {/* Low Stock */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Low Stock Items
              </span>

              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${stats.lowStockCount > 0
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-slate-100 text-slate-500'
                  }`}
              >
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4">
              <h2
                className={`text-2xl font-bold ${stats.lowStockCount > 0
                    ? 'text-rose-600'
                    : 'text-slate-900'
                  }`}
              >
                {stats.lowStockCount}
              </h2>

              <p className="mt-1 text-[11px] text-slate-500">
                {stats.lowStockCount > 0
                  ? 'Requires replenishment'
                  : 'All stock levels healthy'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Sales Performance */}
        <Card
          className="lg:col-span-2"
          title="Sales Performance"
          subtitle="Daily sales revenue trend (₹)"
        >
          <div className="h-64 w-full pt-2">
            {salesTrend.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No recent transaction data to graph
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={salesTrend}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -20,
                    bottom: 0,
                  }}
                >
                  <XAxis
                    dataKey="date"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />

                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value}`}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#0F172A',
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                    }}
                    formatter={(value) => [
                      formatCurrency(Number(value)),
                      'Revenue',
                    ]}
                  />

                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#059669"
                    strokeWidth={2}
                    fill="rgba(5, 150, 105, 0.10)"
                    activeDot={{
                      r: 5,
                      stroke: '#059669',
                      fill: '#FFFFFF',
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Payment Breakdown */}

        <Card
          title="Payment Channels"
          subtitle="Revenue by payment mode"
        >
          <div className="w-full">
            {paymentBreakdown.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <ShoppingCart className="h-5 w-5 text-slate-400" />
                </div>

                <p className="text-sm font-medium text-slate-700">
                  No payment data available
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Payment statistics will appear here.
                </p>
              </div>
            ) : (
              <>
                {/* Donut Chart */}
                <div className="relative h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={88}
                        paddingAngle={3}
                        cornerRadius={4}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                      >
                        {paymentBreakdown.map((entry, index) => (
                          <Cell
                            key={`payment-${entry.name}-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                          padding: '8px 12px',
                          fontSize: '12px',
                          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)',
                        }}
                        formatter={(value) => [
                          formatCurrency(Number(value)),
                          'Revenue',
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center Total */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      Total Revenue
                    </span>

                    <span className="mt-1 max-w-[140px] truncate text-lg font-bold text-slate-900">
                      {formatCurrency(
                        paymentBreakdown.reduce(
                          (total, payment) => total + Number(payment.value || 0),
                          0
                        )
                      )}
                    </span>
                  </div>
                </div>

                {/* Payment Method Breakdown */}
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  {paymentBreakdown.map((payment, index) => {
                    const total = paymentBreakdown.reduce(
                      (sum, item) => sum + Number(item.value || 0),
                      0
                    );

                    const amount = Number(payment.value || 0);
                    const percentage =
                      total > 0 ? (amount / total) * 100 : 0;

                    return (
                      <div
                        key={payment.name}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                PIE_COLORS[index % PIE_COLORS.length],
                            }}
                          />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-700">
                              {payment.name}
                            </p>

                            <p className="text-xs text-slate-400">
                              {percentage.toFixed(1)}% of revenue
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 text-sm font-semibold text-slate-900">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </Card>

      </div>

      {/* Recent Transactions and Inventory */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Recent Transactions */}
        <Card
          className="lg:col-span-2"
          title="Recent Transactions"
          subtitle="Latest counter sales processed"
          headerAction={
            <Link
              to="/invoices"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              View Invoices
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {recentBills.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No recent transactions recorded. Open POS to start billing.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="pb-3 font-semibold">Invoice #</th>
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Method</th>
                    <th className="pb-3 font-semibold">Amount</th>
                    <th className="pb-3 text-right font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {recentBills.map((bill) => (
                    <tr
                      key={bill._id}
                      onClick={() => navigate(`/invoices/${bill._id}`)}
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      <td className="py-3 font-semibold text-slate-900">
                        {bill.invoiceNumber || '—'}
                      </td>

                      <td className="max-w-[120px] truncate py-3 text-slate-600">
                        {bill.customerName || 'Walk-in'}
                      </td>

                      <td className="py-3 text-[11px] font-medium uppercase text-slate-500">
                        {bill.paymentMethod || 'Cash'}
                      </td>

                      <td className="py-3 font-bold text-slate-900">
                        {formatCurrency(bill.grandTotal)}
                      </td>

                      <td className="py-3 text-right">
                        {bill.status === 'refunded' ? (
                          <Badge variant="danger" size="xs">
                            Refunded
                          </Badge>
                        ) : (
                          <Badge variant="success" size="xs">
                            Completed
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Inventory Watchlist */}
        <div className="space-y-5">
          <Card
            title="Low Stock Watchlist"
            subtitle="Products nearing minimum inventory"
            headerAction={
              isOwner && (
                <Link
                  to="/products?filter=lowStock"
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                >
                  Manage
                </Link>
              )
            }
          >
            {lowStockProducts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                All catalog items have sufficient stock.
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate font-semibold text-slate-800">
                        {product.name}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-500">
                        Limit: {product.lowStockLimit ?? 5}{' '}
                        {product.unit || 'pcs'}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded border px-2 py-1 text-[11px] font-semibold ${Number(product.stock ?? 0) <= 0
                          ? 'border-rose-200 bg-rose-50 text-rose-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                        }`}
                    >
                      {product.stock ?? 0} {product.unit || 'pcs'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Audit Logs */}
          {isOwner && recentActivities.length > 0 && (
            <Card
              title="Audit Logs"
              subtitle="Latest cashier and store operations"
            >
              <div className="space-y-3 text-xs">
                {recentActivities.map((activity) => (
                  <div
                    key={activity._id}
                    className="flex items-start gap-2 text-slate-600"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-800">
                        {activity.description || activity.type}
                      </p>

                      <span className="text-[10px] text-slate-400">
                        {formatDateTime(activity.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
