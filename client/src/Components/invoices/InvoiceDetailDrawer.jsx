import React, { useEffect, useState } from 'react';
import {
  X,
  Download,
  Printer,
  ExternalLink,
  RotateCcw,
  Monitor,
  UserRound,
  CreditCard,
  CalendarDays,
  Phone,
  FileText,
  ReceiptText,
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Skeleton from '../common/Skeleton';
import billingService from '../../services/billingService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { downloadPdfBlob, previewOrPrintPdfBlob } from '../../utils/downloadPdf';
import { useToast } from '../../context/ToastContext';

const getCounterDisplay = (bill) => {
  const billingAccount = bill?.billingAccountId;
  if (billingAccount) {
    const name = billingAccount.name || billingAccount.accountNumber;
    if (!name) return 'Counter information unavailable';
    return billingAccount.accountNumber && billingAccount.name
      ? `${billingAccount.name} (${billingAccount.accountNumber})`
      : name;
  }
  if (bill?.ownerId) return 'Owner Desk';
  return 'Counter information unavailable';
};

const getCashierDisplay = (bill) => {
  const billingAccount = bill?.billingAccountId;
  if (billingAccount) {
    return billingAccount.employeeName || billingAccount.name || '—';
  }
  if (bill?.ownerId?.name) return `${bill.ownerId.name} (Owner)`;
  return '—';
};

const getPaymentBadgeVariant = (paymentStatus) => {
  if (paymentStatus === 'paid') return 'success';
  if (paymentStatus === 'partial') return 'warning';
  return 'danger';
};

export const InvoiceDetailDrawer = ({
  billId,
  initialBill = null,
  isOwner = false,
  onClose,
  onOpenFullPage,
  onRequestRefund,
}) => {
  const { success, error } = useToast();
  const [bill, setBill] = useState(initialBill);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [showCustomerCard, setShowCustomerCard] = useState(false);

  useEffect(() => {
    if (!billId) {
      setBill(null);
      return;
    }

    setBill(initialBill);
    setShowCustomerCard(false);

    let cancelled = false;
    const loadDetail = async () => {
      setLoading(true);
      try {
        const res = isOwner
          ? await billingService.getOwnerBillById(billId)
          : await billingService.getBillingBillById(billId);
        if (!cancelled && res.success && res.data?.bill) {
          setBill(res.data.bill);
        }
      } catch {
        // Keep initialBill if detail fetch fails silently
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [billId, initialBill, isOwner]);

  if (!billId) return null;

  const handleDownloadA4 = async () => {
    setActionLoading('a4');
    try {
      const blob = isOwner
        ? await billingService.downloadOwnerBillPDF(billId)
        : await billingService.downloadBillingBillPDF(billId);
      downloadPdfBlob(blob, `Invoice-${bill?.invoiceNumber || billId}.pdf`);
      success('Invoice PDF downloaded');
    } catch {
      error('Failed to download invoice PDF');
    } finally {
      setActionLoading('');
    }
  };

  const handlePrintInvoice = async () => {
    setActionLoading('print');
    try {
      const blob = isOwner
        ? await billingService.downloadOwnerBillPDF(billId)
        : await billingService.downloadBillingBillPDF(billId);
      previewOrPrintPdfBlob(blob);
    } catch {
      error('Failed to open invoice for printing');
    } finally {
      setActionLoading('');
    }
  };

  const handleDownloadThermal = async () => {
    setActionLoading('thermal');
    try {
      const blob = isOwner
        ? await billingService.downloadOwnerThermalPDF(billId)
        : await billingService.downloadBillingThermalPDF(billId);
      downloadPdfBlob(blob, `Receipt-${bill?.invoiceNumber || billId}.pdf`);
      success('Thermal receipt downloaded');
    } catch {
      error('Failed to download thermal receipt');
    } finally {
      setActionLoading('');
    }
  };

  const isRefunded = bill?.status === 'refunded';
  const isCancelled = bill?.status === 'cancelled';
  const items = Array.isArray(bill?.items) ? bill.items : [];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <aside
        className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between gap-3 border-b border-orange-100 bg-[#FFF7ED] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
              <ReceiptText size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-base font-extrabold text-slate-950">
                  Invoice #{bill?.invoiceNumber || '...'}
                </h2>
                {bill && (
                  <>
                    <Badge
                      variant={
                        isRefunded || isCancelled ? 'danger' : 'success'
                      }
                      size="xs"
                    >
                      {isRefunded
                        ? 'Refunded'
                        : isCancelled
                          ? 'Cancelled'
                          : 'Completed'}
                    </Badge>
                    <Badge
                      variant={getPaymentBadgeVariant(bill.paymentStatus || 'paid')}
                      size="xs"
                    >
                      {(bill.paymentStatus || 'paid').toUpperCase()}
                    </Badge>
                  </>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {bill ? formatDateTime(bill.createdAt) : 'Loading details...'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-orange-100 hover:text-slate-900"
            aria-label="Close invoice drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {loading && !bill ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ) : bill ? (
            <>
              {/* Metadata Grid */}
              <div className="grid grid-cols-1 gap-3 rounded-2xl border border-orange-100 bg-orange-50/40 p-4 sm:grid-cols-2">
                <div className="flex items-start gap-2.5">
                  <Monitor size={16} className="mt-0.5 shrink-0 text-orange-600" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Counter
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {getCounterDisplay(bill)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <UserRound size={16} className="mt-0.5 shrink-0 text-orange-600" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Cashier
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {getCashierDisplay(bill)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CreditCard size={16} className="mt-0.5 shrink-0 text-orange-600" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Payment Breakdown
                    </p>
                    <p className="text-sm font-bold uppercase text-slate-900">
                      {bill.paymentMethod || '—'} ·{' '}
                      <span className="capitalize">
                        {bill.paymentStatus || 'paid'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CalendarDays size={16} className="mt-0.5 shrink-0 text-orange-600" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Customer
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">
                        {bill.customerName || 'Walk-in Customer'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowCustomerCard((v) => !v)}
                        className="text-xs font-semibold text-orange-600 hover:underline"
                      >
                        {showCustomerCard ? 'Hide details' : 'View Customer Details'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {showCustomerCard && (
                <div className="rounded-xl border border-orange-200 bg-white p-3.5 text-sm shadow-xs">
                  <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                    Customer Information
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <p className="font-semibold text-slate-800">
                      Name: {bill.customerName || 'Walk-in Customer'}
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-600">
                      <Phone size={13} />
                      {bill.customerPhone || 'No phone recorded'}
                    </p>
                  </div>
                  {bill.notes && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
                      <FileText size={13} className="mt-0.5 shrink-0" />
                      <span>{bill.notes}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Items Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                  Items Purchased ({items.length})
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[540px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-white text-[10px] font-bold uppercase text-slate-400">
                        <th className="px-3.5 py-2.5">Product / Variant</th>
                        <th className="px-3 py-2.5 text-center">Qty</th>
                        <th className="px-3 py-2.5 text-right">Unit Price</th>
                        <th className="px-3 py-2.5 text-right">GST</th>
                        <th className="px-3.5 py-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <tr key={`${item.productId}-${item.variantId || idx}`}>
                          <td className="px-3.5 py-2.5">
                            <p className="font-bold text-slate-900">{item.name}</p>
                            {item.variantName && (
                              <p className="text-[11px] font-medium text-orange-600">
                                Variant: {item.variantName}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold text-slate-700">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-600">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-600">
                            {item.gstRate ?? 0}% ({formatCurrency(item.gstAmount ?? 0)})
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-extrabold text-slate-950">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="ml-auto w-full space-y-2 rounded-2xl border border-orange-100 bg-orange-50/40 p-4 sm:max-w-xs">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(bill.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Total GST</span>
                  <span className="font-bold text-slate-900">
                    +{formatCurrency(bill.gstTotal)}
                  </span>
                </div>
                {Number(bill.discount) > 0 && (
                  <div className="flex justify-between text-xs text-emerald-700">
                    <span>Discount</span>
                    <span className="font-bold">
                      -{formatCurrency(bill.discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t border-dashed border-orange-200 pt-2 text-sm font-black text-slate-950">
                  <span>Grand Total</span>
                  <span className="text-orange-600">
                    {formatCurrency(bill.grandTotal)}
                  </span>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Drawer Footer Actions */}
        {bill && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                icon={Printer}
                onClick={handlePrintInvoice}
                loading={actionLoading === 'print'}
              >
                Print Invoice
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={Download}
                onClick={handleDownloadA4}
                loading={actionLoading === 'a4'}
              >
                Download PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={Printer}
                onClick={handleDownloadThermal}
                loading={actionLoading === 'thermal'}
              >
                Thermal
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {isOwner && !isRefunded && !isCancelled && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={RotateCcw}
                  onClick={() => onRequestRefund?.(bill)}
                >
                  Refund
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                icon={ExternalLink}
                onClick={() => onOpenFullPage?.(bill._id)}
              >
                Full Page
              </Button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default InvoiceDetailDrawer;
