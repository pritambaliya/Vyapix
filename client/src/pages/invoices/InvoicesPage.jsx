import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Download,
  Printer,
  Eye,
  RotateCcw,
  ReceiptText,
  Plus,
  Monitor,
  AlertCircle,
  CircleDollarSign,
  Clock,
} from 'lucide-react';

import Button from '../../Components/common/Button';
import Badge from '../../Components/common/Badge';
import SearchInput from '../../Components/common/SearchInput';
import Pagination from '../../Components/common/Pagination';
import EmptyState from '../../Components/common/EmptyState';
import ConfirmModal from '../../Components/common/ConfirmModal';
import { TableSkeleton } from '../../Components/common/Skeleton';
import InvoiceDetailDrawer from '../../Components/invoices/InvoiceDetailDrawer';

import billingService from '../../services/billingService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { downloadPdfBlob, previewOrPrintPdfBlob } from '../../utils/downloadPdf';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import SEO from '../../Components/common/SEO';

const getCounterLabel = (bill) => {
  if (bill?.billingAccountId) {
    return (
      bill.billingAccountId.name ||
      bill.billingAccountId.accountNumber ||
      'Counter information unavailable'
    );
  }
  if (bill?.ownerId) {
    return 'Owner Desk';
  }
  return null;
};

const getPaymentBadgeVariant = (paymentStatus) => {
  if (paymentStatus === 'paid') return 'success';
  if (paymentStatus === 'partial') return 'warning';
  return 'danger';
};

export const InvoicesPage = () => {
  const { isOwner } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Table data & pagination
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });

  // Minimal summary & counter list from backend
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalInvoices: 0,
    totalSalesAmount: 0,
    pendingAmount: 0,
  });
  const [counters, setCounters] = useState([]);

  // Simple filters
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [counterId, setCounterId] = useState(() => searchParams.get('counter') || '');
  const [paymentStatus, setPaymentStatus] = useState('');

  // Drawer, refund & PDF action state
  const [selectedBill, setSelectedBill] = useState(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [billToRefund, setBillToRefund] = useState(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  // Sync URL ?counter= parameter when navigating from Dashboard
  useEffect(() => {
    const paramCounter = searchParams.get('counter') || '';
    if (paramCounter !== counterId) {
      setCounterId(paramCounter);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  }, [searchParams, counterId]);

  const buildParams = useCallback(
    (includePagination = true) => {
      const params = {
        search: debouncedSearch || undefined,
        billingAccountId: isOwner && counterId ? counterId : undefined,
        paymentStatus: paymentStatus || undefined,
        dateRange,
      };
      if (includePagination) {
        params.page = pagination.page;
        params.limit = pagination.limit;
      }
      return params;
    },
    [debouncedSearch, isOwner, counterId, paymentStatus, dateRange, pagination.page, pagination.limit]
  );

  const fetchBills = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const params = buildParams(true);
      const res = isOwner
        ? await billingService.getOwnerBills(params)
        : await billingService.getBillingBills(params);

      if (res.success && res.data) {
        setBills(res.data.bills || []);
        if (res.data.pagination) {
          setPagination((prev) => ({ ...prev, ...res.data.pagination }));
        }
      } else {
        setBills([]);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Failed to load invoices';
      setApiError(msg);
      error(msg);
      setBills([]);
    } finally {
      setLoading(false);
    }
  }, [buildParams, isOwner, error]);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const params = buildParams(false);
      const res = isOwner
        ? await billingService.getOwnerLedgerSummary(params)
        : await billingService.getBillingLedgerSummary(params);

      if (res.success && res.data) {
        if (res.data.summary) {
          setSummary({
            totalInvoices: res.data.summary.totalInvoices ?? 0,
            totalSalesAmount: res.data.summary.totalSalesAmount ?? 0,
            pendingAmount: res.data.summary.pendingAmount ?? 0,
          });
        }
        setCounters(res.data.counters || []);
      }
    } catch {
      // Non-fatal; table error banner handles primary feedback
    } finally {
      setSummaryLoading(false);
    }
  }, [buildParams, isOwner]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCounterChange = (nextCounterId) => {
    setCounterId(nextCounterId);
    setPagination((prev) => ({ ...prev, page: 1 }));
    if (nextCounterId) {
      setSearchParams({ counter: nextCounterId }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const resetFilters = () => {
    setSearch('');
    setDateRange('all');
    setCounterId('');
    setPaymentStatus('');
    setSearchParams({}, { replace: true });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePrintInvoice = async (e, bill) => {
    e.stopPropagation();
    setDownloadingId(`${bill._id}-print`);
    try {
      const blob = isOwner
        ? await billingService.downloadOwnerBillPDF(bill._id)
        : await billingService.downloadBillingBillPDF(bill._id);
      previewOrPrintPdfBlob(blob);
    } catch {
      error('Failed to open invoice for printing');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadA4 = async (e, bill) => {
    e.stopPropagation();
    setDownloadingId(`${bill._id}-a4`);
    try {
      const blob = isOwner
        ? await billingService.downloadOwnerBillPDF(bill._id)
        : await billingService.downloadBillingBillPDF(bill._id);
      downloadPdfBlob(blob, `Invoice-${bill.invoiceNumber}.pdf`);
      success(`Invoice ${bill.invoiceNumber} downloaded`);
    } catch {
      error('Failed to download PDF invoice');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleConfirmRefund = async () => {
    if (!billToRefund) return;

    setRefundLoading(true);
    try {
      const res = await billingService.refundBill(billToRefund._id);
      if (res.success) {
        success(`Invoice ${billToRefund.invoiceNumber} refunded and stock restored`);
        setRefundModalOpen(false);
        setBillToRefund(null);
        setSelectedBill(null);
        await Promise.all([fetchBills(), fetchSummary()]);
      } else {
        error(res.message || 'Failed to refund bill');
      }
    } catch (err) {
      error(err?.response?.data?.message || err.message || 'Failed to refund bill');
    } finally {
      setRefundLoading(false);
    }
  };

  const hasActiveFilters = Boolean(
    search || counterId || paymentStatus || dateRange !== 'all'
  );

  return (
    <main className="mx-auto min-h-full w-full max-w-[1440px] space-y-5 rounded-2xl bg-[#FFF7ED] p-4 pb-10 text-slate-800 sm:p-6">
      <SEO
        title="Invoices | Vyapix"
        description="View, search, print, and download your sales invoices."
        path="/invoices"
        noIndex={true}
      />

      {/* Clean Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Invoices
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage billing records, counter invoices, and receipts.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/billing')}
          icon={Plus}
        >
          New Invoice
        </Button>
      </header>

      {/* 3 Minimal Summary Cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3.5 rounded-xl border border-orange-100 bg-white p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
            <ReceiptText size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Total Invoices</p>
            <p className="mt-0.5 text-xl font-bold text-slate-900">
              {summaryLoading ? '—' : summary.totalInvoices}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-xl border border-orange-100 bg-white p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white">
            <CircleDollarSign size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Total Sales</p>
            <p className="mt-0.5 truncate text-xl font-bold text-slate-900">
              {summaryLoading ? '—' : formatCurrency(summary.totalSalesAmount)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-xl border border-orange-100 bg-white p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Clock size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Pending Amount</p>
            <p className="mt-0.5 truncate text-xl font-bold text-slate-900">
              {summaryLoading ? '—' : formatCurrency(summary.pendingAmount)}
            </p>
          </div>
        </div>
      </section>

      {/* API Error Banner */}
      {apiError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-white p-3.5 text-sm text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle size={17} className="shrink-0 text-rose-600" />
            <span>{apiError}</span>
          </div>
          <Button variant="outline" size="xs" onClick={fetchBills}>
            Retry
          </Button>
        </div>
      )}

      {/* Main White Card: Compact Filters + Invoice Table */}
      <section className="overflow-hidden rounded-xl border border-orange-100 bg-white">
        {/* Compact Search & Filter Bar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <SearchInput
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onClear={() => handleSearchChange('')}
              placeholder="Search invoice no. or customer name..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              aria-label="Filter by date"
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-orange-400"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
            </select>

            {isOwner && (
              <select
                value={counterId}
                onChange={(e) => handleCounterChange(e.target.value)}
                aria-label="Filter by counter"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-orange-400"
              >
                <option value="">All Counters</option>
                <option value="owner">Owner Desk</option>
                {counters.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              aria-label="Filter by payment status"
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-orange-400"
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-2 text-xs font-semibold text-orange-600 hover:text-orange-700"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Invoice Table */}
        {loading ? (
          <div className="p-4">
            <TableSkeleton rows={8} cols={7} />
          </div>
        ) : bills.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={FileText}
              title="No invoices found"
              message={
                hasActiveFilters
                  ? 'No invoices match your search or filters.'
                  : 'No sales recorded yet. Create your first invoice from POS billing.'
              }
            />
            {hasActiveFilters && (
              <div className="mt-3 flex justify-center">
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-orange-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Invoice No.</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Counter</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Payment Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((bill) => {
                  const isRefunded = bill.status === 'refunded';
                  const isCancelled = bill.status === 'cancelled';
                  const counterLabel = getCounterLabel(bill);
                  const isDownloadingA4 = downloadingId === `${bill._id}-a4`;
                  const isPrinting = downloadingId === `${bill._id}-print`;

                  return (
                    <tr
                      key={bill._id}
                      onClick={() => setSelectedBill(bill)}
                      className="cursor-pointer transition-colors hover:bg-orange-50/50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">
                        <span>#{bill.invoiceNumber}</span>
                        {(isRefunded || isCancelled) && (
                          <span className="ml-2 text-[10px] font-semibold uppercase text-rose-600">
                            {bill.status}
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                        {formatDateTime(bill.createdAt)}
                      </td>

                      <td className="px-4 py-3">
                        <p className="max-w-[190px] truncate font-medium text-slate-800">
                          {bill.customerName || 'Walk-in Customer'}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        {counterLabel ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                            <Monitor size={13} className="text-orange-500" />
                            {counterLabel}
                          </span>
                        ) : (
                          <span className="text-xs italic text-slate-400">
                            Counter information unavailable
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-slate-900">
                        {formatCurrency(bill.grandTotal)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge
                          variant={
                            isRefunded || isCancelled
                              ? 'danger'
                              : getPaymentBadgeVariant(bill.paymentStatus || 'paid')
                          }
                          size="xs"
                        >
                          {isRefunded
                            ? 'Refunded'
                            : isCancelled
                              ? 'Cancelled'
                              : (bill.paymentStatus || 'paid').charAt(0).toUpperCase() +
                                (bill.paymentStatus || 'paid').slice(1)}
                        </Badge>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBill(bill);
                            }}
                            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-orange-100 hover:text-orange-700"
                            title="View invoice"
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handlePrintInvoice(e, bill)}
                            disabled={isPrinting}
                            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-orange-100 hover:text-orange-700 disabled:opacity-50"
                            title="Print invoice"
                          >
                            <Printer
                              size={15}
                              className={isPrinting ? 'animate-pulse' : ''}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDownloadA4(e, bill)}
                            disabled={isDownloadingA4}
                            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-orange-100 hover:text-orange-700 disabled:opacity-50"
                            title="Download PDF"
                          >
                            <Download
                              size={15}
                              className={isDownloadingA4 ? 'animate-pulse' : ''}
                            />
                          </button>

                          {isOwner && !isRefunded && !isCancelled && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setBillToRefund(bill);
                                setRefundModalOpen(true);
                              }}
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                              title="Refund invoice"
                            >
                              <RotateCcw size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-100 px-4">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            limit={pagination.limit}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          />
        </div>
      </section>

      {/* Invoice Details Drawer */}
      <InvoiceDetailDrawer
        billId={selectedBill?._id}
        initialBill={selectedBill}
        isOwner={isOwner}
        onClose={() => setSelectedBill(null)}
        onOpenFullPage={(billId) => navigate(`/invoices/${billId}`)}
        onRequestRefund={(bill) => {
          setBillToRefund(bill);
          setRefundModalOpen(true);
        }}
      />

      {/* Refund Confirmation Modal */}
      <ConfirmModal
        isOpen={refundModalOpen}
        onClose={() => {
          if (!refundLoading) {
            setRefundModalOpen(false);
            setBillToRefund(null);
          }
        }}
        onConfirm={handleConfirmRefund}
        title="Refund invoice & restock items"
        message={`Are you sure you want to refund invoice #${billToRefund?.invoiceNumber} for ${formatCurrency(billToRefund?.grandTotal || 0)}? Item quantities will be restored to stock.`}
        confirmText="Confirm refund"
        variant="danger"
        loading={refundLoading}
      />
    </main>
  );
};

export default InvoicesPage;
