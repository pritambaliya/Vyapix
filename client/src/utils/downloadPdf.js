/**
 * Trigger browser download for a PDF blob with a given filename
 */
export const downloadPdfBlob = (blobData, filename = 'invoice.pdf') => {
  const blob = new Blob([blobData], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Open a PDF blob in a new window/tab for viewing or direct printing
 */
export const previewOrPrintPdfBlob = (blobData) => {
  const blob = new Blob([blobData], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.focus();
  }
};
