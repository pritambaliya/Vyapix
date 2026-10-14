import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Printer,
  PlusCircle,
} from 'lucide-react';

import Modal from '../common/Modal';
import Button from '../common/Button';
import billingService from '../../services/billingService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { downloadPdfBlob } from '../../utils/downloadPdf';
import { useToast } from '../../context/ToastContext';

export const InvoiceReceiptModal = ({
  isOpen,
  onClose,
  bill,
  isOwner = false,
  onNewSale,
}) => {
  const { success, error } = useToast();

  const [downloadingA4, setDownloadingA4] = useState(false);
  const [downloadingThermal, setDownloadingThermal] = useState(false);

  if (!bill) return null;

  const handleDownloadA4 = async () => {
    if (downloadingA4) return;

    setDownloadingA4(true);

    try {
      const blob = isOwner
        ? await billingService.downloadOwnerBillPDF(bill._id)
        : await billingService.downloadBillingBillPDF(bill._id);

      downloadPdfBlob(blob, `Invoice-${bill.invoiceNumber}.pdf`);
      success('Standard A4 PDF invoice downloaded');
    } catch (err) {
      error(err?.response?.data?.message || 'Failed to download A4 PDF');
    } finally {
      setDownloadingA4(false);
    }
  };

  const handleDownloadThermal = async () => {
    if (downloadingThermal) return;

    setDownloadingThermal(true);

    try {
      const blob = isOwner
        ? await billingService.downloadOwnerThermalPDF(bill._id)
        : await billingService.downloadBillingThermalPDF(bill._id);

      downloadPdfBlob(blob, `Receipt-${bill.invoiceNumber}.pdf`);
      success('Thermal receipt downloaded');
    } catch (err) {
      error(err?.response?.data?.message || 'Failed to download thermal receipt');
    } finally {
      setDownloadingThermal(false);
    }
  };

  const handleNewSale = () => {
    if (onNewSale) {
      onNewSale();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sale Completed Successfully"
      subtitle={`Invoice #${bill.invoiceNumber}`}
      maxWidth="max-w-md"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleNewSale}
            icon={PlusCircle}
          >
            Start New Sale
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-center">
        {/* Success Icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-300 bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-6 w-6" />
        </div>

        {/* Total Amount */}
        <div>
          <h3 className="text-2xl font-black tracking-tight text-slate-900">
            {formatCurrency(bill.grandTotal)}
          </h3>

          <p className="mt-1 text-xs text-slate-600">
            Payment Mode:{' '}
            <span className="font-semibold uppercase text-slate-800">
              {bill.paymentMethod}
            </span>
          </p>
        </div>

        {/* Invoice Summary */}
        <div className="space-y-3 rounded-lg border border-slate-300 bg-slate-200/60 p-4 text-left text-xs">
          <div className="flex items-start justify-between gap-4">
            <span className="text-slate-600">Invoice Number</span>
            <span className="break-all text-right font-semibold text-slate-900">
              {bill.invoiceNumber}
            </span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <span className="text-slate-600">Customer</span>
            <span className="max-w-[60%] break-words text-right font-medium text-slate-900">
              {bill.customerName || 'Walk-in Customer'}
            </span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <span className="text-slate-600">Items Count</span>
            <span className="text-right font-medium text-slate-900">
              {bill.items?.length || 0} line items
            </span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <span className="text-slate-600">Issued At</span>
            <span className="max-w-[60%] text-right font-medium text-slate-900">
              {formatDateTime(bill.createdAt)}
            </span>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadA4}
            loading={downloadingA4}
            disabled={downloadingA4 || downloadingThermal}
            icon={Download}
            className="w-full"
          >
            A4 Tax Invoice
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadThermal}
            loading={downloadingThermal}
            disabled={downloadingA4 || downloadingThermal}
            icon={Printer}
            className="w-full"
          >
            80mm Receipt
          </Button>
        </div>

        <p className="text-[11px] leading-relaxed text-slate-500">
          Download the A4 tax invoice for standard printing or the 80mm receipt
          for a thermal printer.
        </p>
      </div>
    </Modal>
  );
};

export default InvoiceReceiptModal;
