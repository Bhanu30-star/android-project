/**
 * Pure calculation module for Invoice Generation
 * Mirrors web formulas in bthawk_new_code_frontend and NestJS backend validation.
 */

export type BillType = 'Inclusive' | 'Exclusive';
export type DiscountType = 'Amount' | 'Percent';

export interface LineItemCalculationInput {
  price: number;
  quantity: number;
  gstRate: number; // e.g. 18 for 18%
  cessRate?: number; // e.g. 12 for 12%
  discountType: DiscountType;
  discountValue: number; // Flat rupee amount or percentage value
  freeQuantity?: number;
}

export interface LineItemCalculationResult {
  baseAmount: number; // price * quantity
  discountAmount: number; // calculated discount in currency
  taxableAmount: number; // amount subject to GST
  gstAmount: number; // calculated GST amount
  cgstAmount: number; // 50% of GST
  sgstAmount: number; // 50% of GST
  cessAmount: number; // CESS if applicable
  netAmount: number; // final line total
}

export interface AdditionalCharges {
  labour: number;
  freight: number;
  other: number;
  tcsApplicable?: boolean;
  tcsAmount?: number;
  overallDiscount?: number;
}

export interface InvoiceTotalsSummary {
  totalBaseAmount: number; // sum of product price * qty
  totalProductDiscount: number; // sum of per-item discounts
  totalTaxableAmount: number;
  totalGstAmount: number;
  totalCessAmount: number;
  cartNetAmount: number; // net from all cart lines
  totalAdditionalCharges: number; // labour + freight + other + tcs
  overallDiscount: number;
  finalPayableAmount: number; // cartNetAmount + additionalCharges - overallDiscount
  roundedPayableAmount: number; // Math.round
  roundOffDifference: number; // rounded - exact
}

/**
 * Rounds a number strictly to two decimal places
 */
export function roundToTwoDecimals(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate single line item values
 */
export function calculateLineItem(input: LineItemCalculationInput): LineItemCalculationResult {
  const price = Math.max(0, input.price || 0);
  const quantity = Math.max(0, input.quantity || 0);
  const gstRate = Math.max(0, input.gstRate || 0);
  const cessRate = Math.max(0, input.cessRate || 0);
  const discountVal = Math.max(0, input.discountValue || 0);

  const baseAmount = roundToTwoDecimals(price * quantity);

  // Discount calculation
  let discountAmount = 0;
  if (input.discountType === 'Percent') {
    discountAmount = roundToTwoDecimals((baseAmount * discountVal) / 100);
  } else {
    discountAmount = roundToTwoDecimals(Math.min(baseAmount, discountVal));
  }

  const amountAfterDiscount = Math.max(0, roundToTwoDecimals(baseAmount - discountAmount));

  let taxableAmount = 0;
  let gstAmount = 0;

  if (input.price && gstRate > 0) {
    // Note: Line calculation can be inclusive or exclusive based on whether billType is supplied
    // Usually input determines this. For standard calculation:
    taxableAmount = amountAfterDiscount;
    gstAmount = roundToTwoDecimals((taxableAmount * gstRate) / 100);
  } else {
    taxableAmount = amountAfterDiscount;
    gstAmount = 0;
  }

  const cessAmount = cessRate > 0 ? roundToTwoDecimals((taxableAmount * cessRate) / 100) : 0;
  const netAmount = roundToTwoDecimals(taxableAmount + gstAmount + cessAmount);

  const halfGst = roundToTwoDecimals(gstAmount / 2);

  return {
    baseAmount,
    discountAmount,
    taxableAmount,
    gstAmount,
    cgstAmount: halfGst,
    sgstAmount: roundToTwoDecimals(gstAmount - halfGst),
    cessAmount,
    netAmount,
  };
}

/**
 * Calculate line item with explicit BillType (Inclusive vs Exclusive)
 */
export function calculateLineItemWithBillType(
  input: LineItemCalculationInput & { billType: BillType }
): LineItemCalculationResult {
  const price = Math.max(0, input.price || 0);
  const quantity = Math.max(0, input.quantity || 0);
  const gstRate = Math.max(0, input.gstRate || 0);
  const cessRate = Math.max(0, input.cessRate || 0);
  const discountVal = Math.max(0, input.discountValue || 0);

  const baseAmount = roundToTwoDecimals(price * quantity);

  let discountAmount = 0;
  if (input.discountType === 'Percent') {
    discountAmount = roundToTwoDecimals((baseAmount * discountVal) / 100);
  } else {
    discountAmount = roundToTwoDecimals(Math.min(baseAmount, discountVal));
  }

  const amountAfterDiscount = Math.max(0, roundToTwoDecimals(baseAmount - discountAmount));

  let taxableAmount = 0;
  let gstAmount = 0;
  let cessAmount = 0;
  let netAmount = 0;

  if (input.billType === 'Inclusive') {
    // Price contains GST and CESS
    const combinedRateFactor = 1 + (gstRate + cessRate) / 100;
    taxableAmount = roundToTwoDecimals(amountAfterDiscount / combinedRateFactor);
    gstAmount = roundToTwoDecimals((taxableAmount * gstRate) / 100);
    cessAmount = cessRate > 0 ? roundToTwoDecimals((taxableAmount * cessRate) / 100) : 0;
    netAmount = amountAfterDiscount;
  } else {
    // Exclusive: GST is added on top
    taxableAmount = amountAfterDiscount;
    gstAmount = roundToTwoDecimals((taxableAmount * gstRate) / 100);
    cessAmount = cessRate > 0 ? roundToTwoDecimals((taxableAmount * cessRate) / 100) : 0;
    netAmount = roundToTwoDecimals(taxableAmount + gstAmount + cessAmount);
  }

  const halfGst = roundToTwoDecimals(gstAmount / 2);

  return {
    baseAmount,
    discountAmount,
    taxableAmount,
    gstAmount,
    cgstAmount: halfGst,
    sgstAmount: roundToTwoDecimals(gstAmount - halfGst),
    cessAmount,
    netAmount,
  };
}

/**
 * Computes complete invoice totals from cart lines and additional charges
 */
export function calculateInvoiceTotals(
  cartLines: {
    baseAmount: number;
    discountAmount: number;
    taxableAmount: number;
    gstAmount: number;
    cessAmount: number;
    netAmount: number;
  }[],
  charges: AdditionalCharges
): InvoiceTotalsSummary {
  const totalBaseAmount = roundToTwoDecimals(
    cartLines.reduce((acc, curr) => acc + (curr.baseAmount || 0), 0)
  );
  const totalProductDiscount = roundToTwoDecimals(
    cartLines.reduce((acc, curr) => acc + (curr.discountAmount || 0), 0)
  );
  const totalTaxableAmount = roundToTwoDecimals(
    cartLines.reduce((acc, curr) => acc + (curr.taxableAmount || 0), 0)
  );
  const totalGstAmount = roundToTwoDecimals(
    cartLines.reduce((acc, curr) => acc + (curr.gstAmount || 0), 0)
  );
  const totalCessAmount = roundToTwoDecimals(
    cartLines.reduce((acc, curr) => acc + (curr.cessAmount || 0), 0)
  );
  const cartNetAmount = roundToTwoDecimals(
    cartLines.reduce((acc, curr) => acc + (curr.netAmount || 0), 0)
  );

  const labour = Math.max(0, charges.labour || 0);
  const freight = Math.max(0, charges.freight || 0);
  const other = Math.max(0, charges.other || 0);
  const tcs = charges.tcsApplicable ? Math.max(0, charges.tcsAmount || 0) : 0;

  const totalAdditionalCharges = roundToTwoDecimals(labour + freight + other + tcs);
  const overallDiscount = Math.max(0, charges.overallDiscount || 0);

  const exactFinal = Math.max(0, roundToTwoDecimals(cartNetAmount + totalAdditionalCharges - overallDiscount));
  const roundedPayableAmount = Math.round(exactFinal);
  const roundOffDifference = roundToTwoDecimals(roundedPayableAmount - exactFinal);

  return {
    totalBaseAmount,
    totalProductDiscount,
    totalTaxableAmount,
    totalGstAmount,
    totalCessAmount,
    cartNetAmount,
    totalAdditionalCharges,
    overallDiscount,
    finalPayableAmount: exactFinal,
    roundedPayableAmount,
    roundOffDifference,
  };
}

/**
 * Format currency with Indian Comma Separation and Rupee Symbol
 */
export function formatIndianCurrency(amount: number): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}₹${formatted}`;
}
