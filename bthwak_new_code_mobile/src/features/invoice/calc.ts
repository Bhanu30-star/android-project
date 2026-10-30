/**
 * Pure calculation module for Invoice Generation
 *
 * Implements exact GST rules and integer-paise precision to eliminate floating-point
 * rounding errors. Matches bthawk_new_code_frontend and bthawk-web-new-application backend.
 */

export type BillType = 'Inclusive' | 'Exclusive';
export type DiscountType = 'Amount' | 'Percent';

export interface LineItemCalculationInput {
  billType: BillType;
  price: number;
  quantity: number;
  gstRate: number; // e.g. 12 for 12%
  cessRate?: number; // e.g. 5 for 5%
  discountType?: DiscountType;
  discountValue?: number;
  freeScheme?: 'Yes' | 'No';
}

export interface LineItemCalculationResult {
  baseAmount: number; // price * quantity (before discount)
  discountAmount: number; // discount in currency
  taxableAmount: number; // net amount before taxes
  gstAmount: number; // total GST
  cgstAmount: number; // Central GST (50% of GST)
  sgstAmount: number; // State GST (50% of GST)
  cessAmount: number; // CESS amount
  netAmount: number; // final line total payable
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
  totalTaxableAmount: number; // sum of line taxable amounts
  totalGstAmount: number; // sum of GST
  totalCgstAmount: number; // half of GST (intra-state)
  totalSgstAmount: number; // half of GST (intra-state)
  totalIgstAmount: number; // full GST (inter-state)
  totalCessAmount: number; // sum of CESS
  cartNetAmount: number; // sum of line net amounts
  totalAdditionalCharges: number; // labour + freight + other + tcs
  overallDiscount: number; // bill-level discount
  finalPayableAmount: number; // exact net before rounding
  roundedPayableAmount: number; // Math.round payable amount
  roundOffDifference: number; // rounded - exact
}

/** Convert rupees to integer paise (1 rupee = 100 paise) */
export function toPaise(rupees: number): number {
  if (!Number.isFinite(rupees)) return 0;
  return Math.round(rupees * 100);
}

/** Convert integer paise to rupees with 2 decimal places */
export function toRupees(paise: number): number {
  return Number((paise / 100).toFixed(2));
}

/**
 * Rounds a number strictly to two decimal places
 */
export function roundToTwoDecimals(val: number): number {
  if (!Number.isFinite(val)) return 0;
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate single line item values in integer paise.
 *
 * Rules:
 * - Free scheme: taxable=0, GST=0, CESS=0, net=0
 * - Inclusive:
 *     net = price * qty - discount
 *     GST = net * rate / (100 + rate + cessRate)
 *     CESS = net * cessRate / (100 + rate + cessRate)
 *     taxable = net - GST - CESS
 * - Exclusive:
 *     taxable = price * qty - discount
 *     GST = taxable * rate / 100
 *     CESS = taxable * cessRate / 100
 *     net = taxable + GST + CESS
 */
export function calculateLineItem(input: LineItemCalculationInput): LineItemCalculationResult {
  const pricePaise = toPaise(Math.max(0, input.price || 0));
  const quantity = Math.max(0, input.quantity || 0);
  const gstRate = Math.max(0, input.gstRate || 0);
  const cessRate = Math.max(0, input.cessRate || 0);
  const discountVal = Math.max(0, input.discountValue || 0);
  const discType = input.discountType || 'Amount';

  if (input.freeScheme === 'Yes' || quantity === 0 || pricePaise === 0) {
    const basePaise = Math.round(pricePaise * quantity);
    return {
      baseAmount: toRupees(basePaise),
      discountAmount: 0,
      taxableAmount: 0,
      gstAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      cessAmount: 0,
      netAmount: 0,
    };
  }

  // Base gross amount in paise
  const basePaise = Math.round(pricePaise * quantity);

  // Discount in paise
  let discountPaise = 0;
  if (discType === 'Percent') {
    discountPaise = Math.round((basePaise * Math.min(100, discountVal)) / 100);
  } else {
    discountPaise = Math.min(basePaise, toPaise(discountVal));
  }

  const billType = input.billType || 'Inclusive';

  let taxablePaise = 0;
  let gstPaise = 0;
  let cessPaise = 0;
  let netPaise = 0;

  if (billType === 'Inclusive') {
    // Net is fixed by the entered price minus discount
    netPaise = Math.max(0, basePaise - discountPaise);
    const combinedRate = 100 + gstRate + cessRate;

    if (combinedRate > 100) {
      gstPaise = Math.round((netPaise * gstRate) / combinedRate);
      if (cessRate > 0) {
        cessPaise = Math.round((netPaise * cessRate) / combinedRate);
      }
    }
    taxablePaise = Math.max(0, netPaise - gstPaise - cessPaise);
  } else {
    // Exclusive: Taxable is base minus discount, GST added on top
    taxablePaise = Math.max(0, basePaise - discountPaise);
    if (gstRate > 0) {
      gstPaise = Math.round((taxablePaise * gstRate) / 100);
    }
    if (cessRate > 0) {
      cessPaise = Math.round((taxablePaise * cessRate) / 100);
    }
    netPaise = taxablePaise + gstPaise + cessPaise;
  }

  const cgstPaise = Math.floor(gstPaise / 2);
  const sgstPaise = gstPaise - cgstPaise;

  return {
    baseAmount: toRupees(basePaise),
    discountAmount: toRupees(discountPaise),
    taxableAmount: toRupees(taxablePaise),
    gstAmount: toRupees(gstPaise),
    cgstAmount: toRupees(cgstPaise),
    sgstAmount: toRupees(sgstPaise),
    cessAmount: toRupees(cessPaise),
    netAmount: toRupees(netPaise),
  };
}

/**
 * Backward compatibility alias for calculateLineItem
 */
export function calculateLineItemWithBillType(
  input: LineItemCalculationInput
): LineItemCalculationResult {
  return calculateLineItem(input);
}

/**
 * Computes complete invoice totals from cart lines and additional charges
 * using integer paise arithmetic.
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
  let totalBasePaise = 0;
  let totalProductDiscountPaise = 0;
  let totalTaxablePaise = 0;
  let totalGstPaise = 0;
  let totalCessPaise = 0;
  let cartNetPaise = 0;

  for (const line of cartLines) {
    totalBasePaise += toPaise(line.baseAmount || 0);
    totalProductDiscountPaise += toPaise(line.discountAmount || 0);
    totalTaxablePaise += toPaise(line.taxableAmount || 0);
    totalGstPaise += toPaise(line.gstAmount || 0);
    totalCessPaise += toPaise(line.cessAmount || 0);
    cartNetPaise += toPaise(line.netAmount || 0);
  }

  const labourPaise = toPaise(Math.max(0, charges.labour || 0));
  const freightPaise = toPaise(Math.max(0, charges.freight || 0));
  const otherPaise = toPaise(Math.max(0, charges.other || 0));
  const tcsPaise = charges.tcsApplicable
    ? toPaise(Math.max(0, charges.tcsAmount || 0))
    : 0;

  const totalAdditionalPaise = labourPaise + freightPaise + otherPaise + tcsPaise;
  const overallDiscountPaise = Math.min(
    cartNetPaise + totalAdditionalPaise,
    toPaise(Math.max(0, charges.overallDiscount || 0))
  );

  const finalPaise = Math.max(0, cartNetPaise + totalAdditionalPaise - overallDiscountPaise);
  const finalRupees = toRupees(finalPaise);
  const roundedRupees = Math.round(finalRupees);
  const roundOffDiff = toRupees(toPaise(roundedRupees) - finalPaise);

  const totalCgstPaise = Math.floor(totalGstPaise / 2);
  const totalSgstPaise = totalGstPaise - totalCgstPaise;

  return {
    totalBaseAmount: toRupees(totalBasePaise),
    totalProductDiscount: toRupees(totalProductDiscountPaise),
    totalTaxableAmount: toRupees(totalTaxablePaise),
    totalGstAmount: toRupees(totalGstPaise),
    totalCgstAmount: toRupees(totalCgstPaise),
    totalSgstAmount: toRupees(totalSgstPaise),
    totalIgstAmount: toRupees(totalGstPaise),
    totalCessAmount: toRupees(totalCessPaise),
    cartNetAmount: toRupees(cartNetPaise),
    totalAdditionalCharges: toRupees(totalAdditionalPaise),
    overallDiscount: toRupees(overallDiscountPaise),
    finalPayableAmount: finalRupees,
    roundedPayableAmount: roundedRupees,
    roundOffDifference: roundOffDiff,
  };
}

/**
 * Format currency with Indian Comma Separation and Rupee Symbol
 */
export function formatIndianCurrency(amount: number): string {
  if (!Number.isFinite(amount)) return '₹0.00';
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}₹${formatted}`;
}
