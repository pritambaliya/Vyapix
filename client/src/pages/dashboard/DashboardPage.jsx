import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  FileText,
  Clock,
  ChevronRight,
  ShieldCheck,
  UserCheck,
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
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext'; 

export const DashboardPage = () => {
  const { user, shop, isOwner } = useAuth();
  const { isDark } = useTheme();
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Bills
      const billsRes = isOwner
        ? await billingService.getOwnerBills({ limit: 50 })
        : await billingService.getBillingBills({ limit: 50 });

      const bills = billsRes.data?.bills || [];
      const totalBillsCount = billsRes.data?.pagination?.total || bills.length;

      let revenueSum = 0;
      const paymentMap = { cash: 0, upi: 0, card: 0, mixed: 0 };
      const dateMap = {};

      bills.forEach((bill) => {
        if (bill.status !== 'refunded') {
          revenueSum += Number(bill.grandTotal || 0);

          const method = (bill.paymentMethod || 'cash').toLowerCase();
          paymentMap[method] = (paymentMap[method] || 0) + Number(bill.grandTotal || 0);

          const dateKey = new Date(bill.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
          });
          dateMap[dateKey] = (dateMap[dateKey] || 0) + Number(bill.grandTotal || 0);
        }
      });

      // Sales Trend
      const trendData = Object.keys(dateMap)
        .reverse()
        .slice(-7)
        .map((date) => ({
          date,
          sales: Math.round(dateMap[date]),
        }));

      // Payment Breakdown
      const pieData = Object.entries(paymentMap)
        .filter(([_, val]) => val > 0)
        .map(([name, value]) => ({
          name: name.toUpperCase(),
          value: Math.round(value),
        }));

      // 2. Fetch Products
      let products = [];
      let totalProds = 0;
      let lowStockItems = [];

      try {
        const prodRes = isOwner
          ? await productService.getOwnerProducts({ limit: 100 })
          : await productService.getBillingProducts({ limit: 100 });

        products = prodRes.data?.products || [];
        totalProds = prodRes.data?.pagination?.total || products.length;

        lowStockItems = products.filter(
          (p) => p.stock <= (p.lowStockLimit !== undefined ? p.lowStockLimit : 5)
        );
      } catch {
        // Handled
      }

      // 3. Fetch Activities
      let activities = [];
      if (isOwner) {
        try {
          const actRes = await accountService.getAllActivities();
          activities = actRes.data?.activities?.slice(0, 5) || [];
        } catch {
          // Handled
        }
      }

      setStats({
        totalRevenue: revenueSum,
        totalBills: totalBillsCount,
        totalProducts: totalProds,
        lowStockCount: lowStockItems.length,
      });

      setRecentBills(bills.slice(0, 6));
      setRecentActivities(activities);
      setSalesTrend(trendData.length > 0 ? trendData : [{ date: 'Today', sales: revenueSum }]);
      setPaymentBreakdown(pieData);
      setLowStockProducts(lowStockItems.slice(0, 5));
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  const PIE_COLORS = ['#059669', '#4F46E5', '#D97706', '#E11D48'];

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {shop?.shopName || 'Store'} Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Operational summary, real-time revenue metrics, and inventory alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      {/* Structured KPI Metric Cards */}
      {loading ? (
        <CardSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Revenue */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Revenue
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(stats.totalRevenue)}
              </h2>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                Live cumulative sales
              </p>
            </div>
          </div>

          {/* KPI 2: Bills */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Invoices
              </span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {stats.totalBills}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Completed customer bills
              </p>
            </div>
          </div>

          {/* KPI 3: Products */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Catalog
              </span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {stats.totalProducts}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Managed inventory SKUs
              </p>
            </div>
          </div>

          {/* KPI 4: Low Stock Alert */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Low Stock Items
              </span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                stats.lowStockCount > 0
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <h2 className={`text-2xl font-bold ${
                stats.lowStockCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
              }`}>
                {stats.lowStockCount}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {stats.lowStockCount > 0 ? 'Requires replenishment' : 'All stock levels healthy'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Sales Performance Trend */}
        <Card
          className="lg:col-span-2"
          title="Sales Performance"
          subtitle="Daily sales revenue trend (₹)"
        >
          <div className="h-64 w-full pt-2">
            {salesTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No recent transaction data to graph
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="date"
                    stroke={isDark ? '#64748B' : '#94A3B8'}
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={isDark ? '#64748B' : '#94A3B8'}
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value) => [`₹${value}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#059669"
                    strokeWidth={2}
                    fill={isDark ? 'rgba(5, 150, 105, 0.15)' : 'rgba(5, 150, 105, 0.1)'}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Payment Channels Breakdown */}
        <Card
          title="Payment Channels"
          subtitle="Revenue distribution by payment mode"
        >
          <div className="h-64 w-full flex flex-col items-center justify-center">
            {paymentBreakdown.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-10">
                No payment data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentBreakdown}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {paymentBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [`₹${value}`, 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}

            {paymentBreakdown.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                {paymentBreakdown.map((p, idx) => (
                  <div key={p.name} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="font-medium">{p.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Tables Section: Recent Invoices & Low Stock Watchlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Invoices Table */}
        <Card
          className="lg:col-span-2"
          title="Recent Transactions"
          subtitle="Latest counter sales processed"
          headerAction={
            <Link
              to="/invoices"
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              View Invoices
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          {recentBills.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No recent transactions recorded. Open POS to start billing.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 text-[11px]">
                    <th className="pb-2 font-semibold">Invoice #</th>
                    <th className="pb-2 font-semibold">Customer</th>
                    <th className="pb-2 font-semibold">Method</th>
                    <th className="pb-2 font-semibold">Amount</th>
                    <th className="pb-2 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {recentBills.map((bill) => (
                    <tr
                      key={bill._id}
                      onClick={() => navigate(`/invoices/${bill._id}`)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 font-semibold text-slate-900 dark:text-slate-100">
                        {bill.invoiceNumber}
                      </td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                        {bill.customerName || 'Walk-in'}
                      </td>
                      <td className="py-2.5 uppercase font-medium text-slate-500 text-[11px]">
                        {bill.paymentMethod}
                      </td>
                      <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(bill.grandTotal)}
                      </td>
                      <td className="py-2.5 text-right">
                        {bill.status === 'refunded' ? (
                          <Badge variant="danger" size="xs">Refunded</Badge>
                        ) : (
                          <Badge variant="success" size="xs">Completed</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Low Stock Watchlist */}
        <div className="space-y-5">
          <Card
            title="Low Stock Watchlist"
            subtitle="Products nearing minimum inventory"
            headerAction={
              isOwner && (
                <Link
                  to="/products?filter=lowStock"
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1"
                >
                  Manage
                </Link>
              )
            }
          >
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                All catalog items have sufficient stock.
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Limit: {p.lowStockLimit} {p.unit || 'pcs'}
                      </p>
                    </div>

                    <span className={`font-semibold px-2 py-0.5 rounded text-[11px] shrink-0 ${
                      p.stock <= 0
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                    }`}>
                      {p.stock} {p.unit || 'pcs'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Audit Trail Mini Feed */}
          {isOwner && recentActivities.length > 0 && (
            <Card
              title="Audit Logs"
              subtitle="Latest cashier & store operations"
            >
              <div className="space-y-2 text-xs">
                {recentActivities.map((act) => (
                  <div
                    key={act._id}
                    className="flex items-start gap-2 text-slate-600 dark:text-slate-300"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{act.description || act.type}</p>
                      <span className="text-[10px] text-slate-400">
                        {formatDateTime(act.createdAt)}
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
