/**
 * Calculate totals for cart items matching the Vyapix backend algorithm
 * 
 * Each product line item:
 * baseAmount = sellingPrice * quantity
 * gstAmount = baseAmount * (gstRate / 100)
 * total = baseAmount + gstAmount
 * 
 * Grand Total:
 * subtotal = sum(baseAmount)
 * gstTotal = sum(gstAmount)
 * grandTotal = subtotal + gstTotal - discount
 */
export const calculateCartTotals = (items = [], discount = 0) => {
  let subtotal = 0;
  let gstTotal = 0;

  const itemDetails = items.map((item) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = Number(item.sellingPrice || item.unitPrice) || 0;
    const gstRate = Number(item.gstRate) || 0;

    const baseAmount = unitPrice * qty;
    const gstAmount = baseAmount * (gstRate / 100);
    const itemTotal = baseAmount + gstAmount;

    subtotal += baseAmount;
    gstTotal += gstAmount;

    return {
      ...item,
      quantity: qty,
      unitPrice,
      gstRate,
      baseAmount: Number(baseAmount.toFixed(2)),
      gstAmount: Number(gstAmount.toFixed(2)),
      total: Number(itemTotal.toFixed(2)),
    };
  });

  const numDiscount = Math.max(0, Number(discount) || 0);
  const roundedSubtotal = Number(subtotal.toFixed(2));
  const roundedGstTotal = Number(gstTotal.toFixed(2));
  const grandTotal = Math.max(0, Number((roundedSubtotal + roundedGstTotal - numDiscount).toFixed(2)));

  return {
    itemDetails,
    subtotal: roundedSubtotal,
    gstTotal: roundedGstTotal,
    discount: numDiscount,
    grandTotal,
    totalItems: items.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0),
  };
};
