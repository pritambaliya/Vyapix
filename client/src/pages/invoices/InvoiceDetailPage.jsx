import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Printer,
  RotateCcw,
  ReceiptText,
  Store,
  UserRound,
  CreditCard,
  CalendarDays,
  FileText,
  Package,
  Phone,
  MapPin,
  ShieldCheck,
  CircleDollarSign,
} from 'lucide-react';

import Button from '../../Components/common/Button';
import Badge from '../../Components/common/Badge';
import ConfirmModal from '../../Components/common/ConfirmModal';
import Skeleton from '../../Components/common/Skeleton';
import billingService from '../../services/billingService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { downloadPdfBlob } from '../../utils/downloadPdf';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const InfoLabel = ({ icon: Icon, children }) => (
  <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
    {Icon && <Icon size={12} className="text-orange-500" />}
    <span>{children}</span>
  </div>
);

const MetaItem = ({ icon: Icon, label, value, className = '' }) => (
  <div className={`min-w-0 ${className}`}>
    <InfoLabel icon={Icon}>{label}</InfoLabel>
    <p className="break-words text-sm font-semibold text-slate-800 ">
      {value || '—'}
    </p>
  </div>
);

export const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isOwner, shop } = useAuth();
  const { success, error } = useToast();

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingA4, setDownloadingA4] = useState(false);
  const [downloadingThermal, setDownloadingThermal] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);

  const fetchBillDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = isOwner
        ? await billingService.getOwnerBillById(id)
        : await billingService.getBillingBillById(id);

      if (res.success && res.data?.bill) {
        setBill(res.data.bill);
      } else {
        error('Invoice not found');
        navigate('/invoices');
      }
    } catch {
      error('Failed to load invoice details');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  }, [id, isOwner, error, navigate]);

  useEffect(() => {
    fetchBillDetail();
  }, [fetchBillDetail]);

  const handleDownloadA4 = async () => {
    setDownloadingA4(true);
    try {
      const blob = isOwner
        ? await billingService.downloadOwnerBillPDF(id)
        : await billingService.downloadBillingBillPDF(id);

      downloadPdfBlob(blob, `Invoice-${bill?.invoiceNumber || id}.pdf`);
      success('A4 PDF invoice downloaded');
    } catch {
      error('Failed to download PDF invoice');
    } finally {
      setDownloadingA4(false);
    }
  };

  const handleDownloadThermal = async () => {
    setDownloadingThermal(true);
    try {
      const blob = isOwner
        ? await billingService.downloadOwnerThermalPDF(id)
        : await billingService.downloadBillingThermalPDF(id);

      downloadPdfBlob(blob, `Receipt-${bill?.invoiceNumber || id}.pdf`);
      success('Thermal receipt downloaded');
    } catch {
      error('Failed to download thermal receipt');
    } finally {
      setDownloadingThermal(false);
    }
  };

  const handleRefund = async () => {
    setRefundLoading(true);
    try {
      const res = await billingService.refundBill(id);
      if (res.success) {
        success('Invoice refunded and inventory restored');
        setRefundModalOpen(false);
        await fetchBillDetail();
      } else {
        error(res.message || 'Failed to process refund');
      }
    } catch {
      error('Failed to process refund');
    } finally {
      setRefundLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <Skeleton className="h-10 w-44 rounded-xl" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-[28rem] w-full rounded-2xl" />
      </div>
    );
  }

  if (!bill) return null;

  const isRefunded = bill.status === 'refunded';
  const items = Array.isArray(bill.items) ? bill.items : [];

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 pb-8 text-slate-800 ">
      {/* Page heading */}
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5  sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button
            variant="outline"
            size="xs"
            onClick={() => navigate('/invoices')}
            icon={ArrowLeft}
          >
            Back
          </Button>

          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600  ">
                <ReceiptText size={19} />
              </span>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-950  sm:text-2xl">
                Invoice details
              </h1>
              <Badge variant={isRefunded ? 'danger' : 'success'} size="xs">
                {isRefunded ? 'Refunded' : 'Completed'}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 ">
              Invoice <span className="font-bold text-slate-700 ">#{bill.invoiceNumber}</span>
              <span className="mx-2 text-slate-300 ">•</span>
              Issued {formatDateTime(bill.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadA4}
            loading={downloadingA4}
            icon={Download}
          >
            A4 Tax Invoice
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadThermal}
            loading={downloadingThermal}
            icon={Printer}
          >
            Thermal Receipt
          </Button>
          {isOwner && !isRefunded && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setRefundModalOpen(true)}
              icon={RotateCcw}
            >
              Refund
            </Button>
          )}
        </div>
      </header>

      {/* Invoice overview */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-4   ">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm shadow-orange-500/20">
            <CircleDollarSign size={21} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 ">Grand total</p>
            <p className="mt-0.5 truncate text-xl font-extrabold tracking-tight text-slate-950 ">
              {formatCurrency(bill.grandTotal)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4  ">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600  ">
            <Package size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 ">Items on invoice</p>
            <p className="mt-0.5 text-xl font-extrabold text-slate-950 ">
              {items.length} <span className="text-sm font-medium text-slate-500">products</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4  ">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600  ">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 ">Invoice status</p>
            <p className={`mt-0.5 text-base font-extrabold ${isRefunded ? 'text-rose-600 ' : 'text-emerald-600 '}`}>
              {isRefunded ? 'Refunded' : 'Payment recorded'}
            </p>
          </div>
        </div>
      </section>

      {/* Main invoice surface */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40   ">
        <div className="h-1.5 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300" />

        {/* Store and invoice metadata */}
        <div className="grid grid-cols-1 gap-6 border-b border-slate-100 p-5  sm:grid-cols-[1fr_auto] sm:p-7">
          <div className="flex gap-3">
            {shop?.logo?.url ? (
              <img
                src={shop.logo.url}
                alt={`${shop?.shopName || 'Shop'} logo`}
                className="h-14 w-14 shrink-0 rounded-2xl border border-slate-200 bg-white object-cover "
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-600  ">
                <Store size={25} />
              </div>
            )}
            <div className="min-w-0 pt-0.5">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-600 ">
                Billed by
              </p>
              <h2 className="break-words text-lg font-extrabold tracking-tight text-slate-950 ">
                {shop?.shopName || 'Vyapix Store'}
              </h2>
              {shop?.address && (
                <p className="mt-1 flex items-start gap-1.5 text-sm leading-relaxed text-slate-500 ">
                  <MapPin size={14} className="mt-0.5 shrink-0" />
                  <span>{shop.address}</span>
                </p>
              )}
              {shop?.phone && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 ">
                  <Phone size={14} />
                  {shop.phone}
                </p>
              )}
              {shop?.gstNumber && (
                <p className="mt-2 inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700  ">
                  GSTIN: {shop.gstNumber}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-4 rounded-xl bg-slate-50 p-4  sm:min-w-64 sm:grid-cols-1 sm:gap-y-3">
            <MetaItem icon={FileText} label="Invoice number" value={bill.invoiceNumber} />
            <MetaItem icon={CalendarDays} label="Invoice date" value={formatDateTime(bill.createdAt)} />
            <MetaItem icon={CreditCard} label="Payment method" value={bill.paymentMethod} />
            {bill.billingAccountId && (
              <MetaItem
                icon={UserRound}
                label="Cashier"
                value={bill.billingAccountId.name || bill.billingAccountId.accountNumber}
              />
            )}
          </div>
        </div>

        {/* Customer details */}
        {(bill.customerName || bill.customerPhone || bill.notes) && (
          <div className="mx-5 mt-5 grid grid-cols-1 gap-4 rounded-xl border border-orange-100 bg-orange-50/70 p-4   sm:mx-7 sm:grid-cols-2">
            <div>
              <InfoLabel icon={UserRound}>Customer details</InfoLabel>
              <p className="text-sm font-bold text-slate-900 ">
                {bill.customerName || 'Walk-in Customer'}
              </p>
              {bill.customerPhone && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600 ">
                  <Phone size={13} />
                  {bill.customerPhone}
                </p>
              )}
            </div>
            {bill.notes && (
              <div>
                <InfoLabel icon={FileText}>Reference / notes</InfoLabel>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600 ">
                  {bill.notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Line items */}
        <div className="p-5 sm:p-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-950 ">Items purchased</h3>
              <p className="mt-0.5 text-xs text-slate-500 ">
                Product-wise price and GST breakdown
              </p>
            </div>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700  ">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 ">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-[0.1em] text-slate-500  ">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Item description</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Unit price</th>
                  <th className="px-4 py-3 text-right">GST %</th>
                  <th className="px-4 py-3 text-right">GST amount</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 ">
                {items.length > 0 ? (
                  items.map((item, idx) => (
                    <tr
                      key={item._id || item.productId || `${item.name}-${idx}`}
                      className="transition-colors hover:bg-orange-50/50 "
                    >
                      <td className="px-4 py-4 text-xs font-semibold text-slate-400">{String(idx + 1).padStart(2, '0')}</td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-900 ">{item.name}</p>
                        {item.sku && (
                          <p className="mt-1 text-xs text-slate-500 ">SKU: {item.sku}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-slate-700 ">{item.quantity}</td>
                      <td className="px-4 py-4 text-right text-slate-600 ">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-4 text-right text-slate-600 ">{item.gstRate ?? 0}%</td>
                      <td className="px-4 py-4 text-right text-slate-600 ">{formatCurrency(item.gstAmount ?? 0)}</td>
                      <td className="px-4 py-4 text-right font-extrabold text-slate-950 ">{formatCurrency(item.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500 ">
                      No line items found for this invoice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals and footer */}
          <div className="mt-6 flex flex-col-reverse gap-6 border-t border-slate-100 pt-5  sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-sm text-sm text-slate-500 ">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600  ">
                <Store size={18} />
              </div>
              <p className="font-bold text-slate-700 ">Thank you for your business!</p>
              <p className="mt-1 text-xs leading-relaxed">
                This is a computer-generated invoice from Vyapix ERP.
              </p>
              {isRefunded && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-600  ">
                  <RotateCcw size={13} /> This invoice has been refunded.
                </p>
              )}
            </div>

            <div className="w-full space-y-3 rounded-xl bg-slate-50 p-4  sm:max-w-xs">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-slate-500 ">Subtotal</span>
                <span className="font-bold text-slate-800 ">{formatCurrency(bill.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-slate-500 ">Total GST</span>
                <span className="font-bold text-slate-800 ">+{formatCurrency(bill.gstTotal)}</span>
              </div>
              {bill.discount > 0 && (
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-emerald-600 ">Discount</span>
                  <span className="font-bold text-emerald-600 ">−{formatCurrency(bill.discount)}</span>
                </div>
              )}
              <div className="border-t border-dashed border-slate-300 pt-3 ">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-extrabold text-slate-700 ">Grand total</span>
                  <span className="text-xl font-black tracking-tight text-orange-600 ">
                    {formatCurrency(bill.grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ConfirmModal
        isOpen={refundModalOpen}
        onClose={() => setRefundModalOpen(false)}
        onConfirm={handleRefund}
        title="Refund invoice"
        message={`Are you sure you want to refund Invoice #${bill.invoiceNumber}? Item quantities will be restocked.`}
        confirmText="Confirm refund"
        variant="danger"
        loading={refundLoading}
      />
    </main>
  );
};

export default InvoiceDetailPage;
