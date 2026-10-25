import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Printer,
  Eye,
  RotateCcw,
  Search,
  ReceiptText,
  CircleDollarSign,
  ShoppingBag,
  CheckCircle2,
  Filter,
  Plus,
} from 'lucide-react';

import Button from '../../Components/common/Button';
import Badge from '../../Components/common/Badge';
import SearchInput from '../../Components/common/SearchInput';
import Pagination from '../../Components/common/Pagination';
import EmptyState from '../../Components/common/EmptyState';
import ConfirmModal from '../../Components/common/ConfirmModal';
import { TableSkeleton } from '../../Components/common/Skeleton';
import billingService from '../../services/billingService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { downloadPdfBlob } from '../../utils/downloadPdf';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const InvoicesPage = () => {
  const { isOwner } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [status, setStatus] = useState('');

  // Refund modal state
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [billToRefund, setBillToRefund] = useState(null);
  const [refundLoading, setRefundLoading] = useState(false);

  // PDF download loading states
  const [downloadingId, setDownloadingId] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search: debouncedSearch || undefined,
        paymentMethod: paymentMethod || undefined,
        status: status || undefined,
        page: pagination.page,
        limit: pagination.limit,
      };

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
      error(err.message || 'Failed to load invoices');
      setBills([]);
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    paymentMethod,
    status,
    pagination.page,
    pagination.limit,
    isOwner,
    error,
  ]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
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

  const handleDownloadThermal = async (e, bill) => {
    e.stopPropagation();
    setDownloadingId(`${bill._id}-thermal`);
    try {
      const blob = isOwner
        ? await billingService.downloadOwnerThermalPDF(bill._id)
        : await billingService.downloadBillingThermalPDF(bill._id);

      downloadPdfBlob(blob, `Receipt-${bill.invoiceNumber}.pdf`);
      success(`Thermal receipt ${bill.invoiceNumber} downloaded`);
    } catch {
      error('Failed to download thermal receipt');
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
        await fetchBills();
      } else {
        error(res.message || 'Failed to refund bill');
      }
    } catch (err) {
      error(err.message || 'Failed to refund bill');
    } finally {
      setRefundLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setPaymentMethod('');
    setStatus('');
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = Boolean(search || paymentMethod || status);
  const completedCount = bills.filter((bill) => bill.status !== 'refunded').length;
  const refundedCount = bills.filter((bill) => bill.status === 'refunded').length;
  const visibleTotal = bills.reduce(
    (sum, bill) => sum + (bill.status === 'refunded' ? 0 : Number(bill.grandTotal) || 0),
    0
  );

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-5 pb-8 text-slate-800 ">
      {/* Header */}
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5  sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600  ">
            <ReceiptText size={23} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-950  sm:text-2xl">
                Invoices & Sales
              </h1>
              <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-700   ">
                Vyapix Ledger
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 ">
              Track billing history, manage receipts, and handle customer refunds.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/billing')}
          icon={Plus}
        >
          Create new bill
        </Button>
      </header>

      {/* Summary cards: counts are for the currently loaded page, not all records */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-4   ">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm shadow-orange-500/20">
            <CircleDollarSign size={21} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 ">Visible sales total</p>
            <p className="mt-0.5 truncate text-xl font-extrabold text-slate-950 ">
              {formatCurrency(visibleTotal)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4  ">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600  ">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 ">Completed on page</p>
            <p className="mt-0.5 text-xl font-extrabold text-slate-950 ">{completedCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4  ">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600  ">
            <RotateCcw size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 ">Refunded on page</p>
            <p className="mt-0.5 text-xl font-extrabold text-slate-950 ">{refundedCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4  ">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600  ">
            <ShoppingBag size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 ">Invoices on page</p>
            <p className="mt-0.5 text-xl font-extrabold text-slate-950 ">{bills.length}</p>
          </div>
        </div>
      </section>

      {/* Search and filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/30   ">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600  ">
            <Filter size={16} />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 ">Find an invoice</h2>
            <p className="text-xs text-slate-500 ">Search records or narrow them by payment and status.</p>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-auto text-xs font-bold text-orange-600 transition hover:text-orange-700 "
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <SearchInput
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              onClear={() => handleSearchChange('')}
              placeholder="Search invoice number, customer, or phone..."
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[380px]">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Payment method</span>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/15   "
              >
                <option value="">All payment modes</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI / QR</option>
                <option value="card">Card</option>
                <option value="mixed">Mixed</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Invoice status</span>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-500/15   "
              >
                <option value="">All statuses</option>
                <option value="completed">Completed</option>
                <option value="refunded">Refunded</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      {/* Invoice table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/30   ">
        <div className="flex flex-col gap-1 border-b border-slate-100 px-4 py-4  sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-base font-extrabold text-slate-950 ">Sales ledger</h2>
            <p className="mt-0.5 text-xs text-slate-500 ">
              {pagination.total || 0} invoice{pagination.total === 1 ? '' : 's'} found
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600  ">
            <FileText size={13} />
            Page {pagination.page} of {pagination.totalPages || 1}
          </span>
        </div>

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
                  ? 'Try changing your search or clearing the filters.'
                  : 'No sales recorded yet. Open billing to create your first invoice.'
              }
            />
            {hasActiveFilters && (
              <div className="mt-3 flex justify-center">
                <Button variant="outline" size="sm" onClick={resetFilters}>Clear filters</Button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-500   ">
                  <th className="px-4 py-3.5">Invoice</th>
                  <th className="px-4 py-3.5">Date & time</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Payment</th>
                  <th className="px-4 py-3.5 text-right">Grand total</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 ">
                {bills.map((bill) => {
                  const isRefunded = bill.status === 'refunded';
                  const isDownloadingA4 = downloadingId === `${bill._id}-a4`;
                  const isDownloadingThermal = downloadingId === `${bill._id}-thermal`;

                  return (
                    <tr
                      key={bill._id}
                      onClick={() => navigate(`/invoices/${bill._id}`)}
                      className="cursor-pointer transition-colors hover:bg-orange-50/60 "
                    >
                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600  ">
                            <ReceiptText size={17} />
                          </span>
                          <div>
                            <p className="font-extrabold text-slate-900 ">#{bill.invoiceNumber}</p>
                            <p className="mt-0.5 text-[10px] font-medium text-slate-400">Invoice record</p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-xs font-medium text-slate-600 ">
                        {formatDateTime(bill.createdAt)}
                      </td>

                      <td className="px-4 py-4">
                        <p className="max-w-[180px] truncate font-bold text-slate-800 ">
                          {bill.customerName || 'Walk-in customer'}
                        </p>
                        {bill.customerPhone && (
                          <p className="mt-1 text-xs text-slate-500 ">{bill.customerPhone}</p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-600   ">
                          {bill.paymentMethod || '—'}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-right font-extrabold text-slate-950 ">
                        {formatCurrency(bill.grandTotal)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <Badge variant={isRefunded ? 'danger' : 'success'} size="xs">
                          {isRefunded ? 'Refunded' : 'Completed'}
                        </Badge>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/invoices/${bill._id}`);
                            }}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-orange-100 hover:text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30   "
                            title="View invoice"
                            aria-label={`View invoice ${bill.invoiceNumber}`}
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDownloadA4(e, bill)}
                            disabled={isDownloadingA4}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-orange-100 hover:text-orange-700 disabled:cursor-wait disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-500/30   "
                            title="Download A4 PDF"
                            aria-label={`Download A4 invoice ${bill.invoiceNumber}`}
                          >
                            <Download size={16} className={isDownloadingA4 ? 'animate-pulse' : ''} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDownloadThermal(e, bill)}
                            disabled={isDownloadingThermal}
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-orange-100 hover:text-orange-700 disabled:cursor-wait disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-orange-500/30   "
                            title="Download thermal receipt"
                            aria-label={`Download thermal receipt ${bill.invoiceNumber}`}
                          >
                            <Printer size={16} className={isDownloadingThermal ? 'animate-pulse' : ''} />
                          </button>

                          {isOwner && !isRefunded && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setBillToRefund(bill);
                                setRefundModalOpen(true);
                              }}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500/30  "
                              title="Refund invoice"
                              aria-label={`Refund invoice ${bill.invoiceNumber}`}
                            >
                              <RotateCcw size={16} />
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

        <div className="border-t border-slate-100 px-3  sm:px-4">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            limit={pagination.limit}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          />
        </div>
      </section>

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
