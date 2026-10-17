import {
  calculateLineItemWithBillType,
  calculateInvoiceTotals,
  roundToTwoDecimals,
  formatIndianCurrency,
} from './calc';

let passedCount = 0;
let failedCount = 0;

function assert(description: string, condition: boolean, details?: any) {
  if (condition) {
    console.log(`[PASS] ${description}`);
    passedCount++;
  } else {
    console.error(`[FAIL] ${description}`, details || '');
    failedCount++;
  }
}

console.log('--- Running Invoice Calc Unit Tests ---');

// Test 1: Exclusive GST without discount
const test1 = calculateLineItemWithBillType({
  billType: 'Exclusive',
  price: 1000,
  quantity: 2,
  gstRate: 18,
  cessRate: 0,
  discountType: 'Amount',
  discountValue: 0,
});
assert('Test 1 - Exclusive GST 18% on 2000 => Taxable: 2000, GST: 360, Net: 2360',
  test1.baseAmount === 2000 &&
  test1.taxableAmount === 2000 &&
  test1.gstAmount === 360 &&
  test1.netAmount === 2360
);

// Test 2: Inclusive GST without discount
const test2 = calculateLineItemWithBillType({
  billType: 'Inclusive',
  price: 1180,
  quantity: 1,
  gstRate: 18,
  cessRate: 0,
  discountType: 'Amount',
  discountValue: 0,
});
assert('Test 2 - Inclusive GST 18% on 1180 => Taxable: 1000, GST: 180, Net: 1180',
  test2.baseAmount === 1180 &&
  test2.taxableAmount === 1000 &&
  test2.gstAmount === 180 &&
  test2.netAmount === 1180
);

// Test 3: Exclusive GST with Flat Rupee Discount
const test3 = calculateLineItemWithBillType({
  billType: 'Exclusive',
  price: 500,
  quantity: 4, // 2000 base
  gstRate: 12,
  cessRate: 0,
  discountType: 'Amount',
  discountValue: 200, // 1800 taxable
});
assert('Test 3 - Exclusive GST 12% on 2000 with 200 disc => Taxable: 1800, GST: 216, Net: 2016',
  test3.baseAmount === 2000 &&
  test3.discountAmount === 200 &&
  test3.taxableAmount === 1800 &&
  test3.gstAmount === 216 &&
  test3.netAmount === 2016
);

// Test 4: Exclusive GST with Percentage Discount
const test4 = calculateLineItemWithBillType({
  billType: 'Exclusive',
  price: 1000,
  quantity: 1,
  gstRate: 18,
  cessRate: 0,
  discountType: 'Percent',
  discountValue: 10, // 10% of 1000 = 100 disc, 900 taxable
});
assert('Test 4 - Exclusive GST 18% with 10% disc => Taxable: 900, GST: 162, Net: 1062',
  test4.baseAmount === 1000 &&
  test4.discountAmount === 100 &&
  test4.taxableAmount === 900 &&
  test4.gstAmount === 162 &&
  test4.netAmount === 1062
);

// Test 5: Inclusive GST with Percentage Discount
const test5 = calculateLineItemWithBillType({
  billType: 'Inclusive',
  price: 1180,
  quantity: 2, // 2360 gross
  gstRate: 18,
  cessRate: 0,
  discountType: 'Percent',
  discountValue: 10, // 10% of 2360 = 236 disc, gross after disc = 2124 => Taxable: 1800, GST: 324
});
assert('Test 5 - Inclusive GST 18% with 10% disc => Net: 2124, Taxable: 1800, GST: 324',
  test5.baseAmount === 2360 &&
  test5.discountAmount === 236 &&
  test5.netAmount === 2124 &&
  test5.taxableAmount === 1800 &&
  test5.gstAmount === 324
);

// Test 6: Exclusive with CESS
const test6 = calculateLineItemWithBillType({
  billType: 'Exclusive',
  price: 1000,
  quantity: 1,
  gstRate: 28,
  cessRate: 12,
  discountType: 'Amount',
  discountValue: 0,
});
assert('Test 6 - Exclusive 28% GST + 12% CESS on 1000 => GST: 280, CESS: 120, Net: 1400',
  test6.taxableAmount === 1000 &&
  test6.gstAmount === 280 &&
  test6.cessAmount === 120 &&
  test6.netAmount === 1400
);

// Test 7: Inclusive with CESS
const test7 = calculateLineItemWithBillType({
  billType: 'Inclusive',
  price: 1400,
  quantity: 1,
  gstRate: 28,
  cessRate: 12,
  discountType: 'Amount',
  discountValue: 0,
});
assert('Test 7 - Inclusive 28% GST + 12% CESS on 1400 => Taxable: 1000, GST: 280, CESS: 120, Net: 1400',
  test7.taxableAmount === 1000 &&
  test7.gstAmount === 280 &&
  test7.cessAmount === 120 &&
  test7.netAmount === 1400
);

// Test 8: Discount exceeds base amount (capped to base)
const test8 = calculateLineItemWithBillType({
  billType: 'Exclusive',
  price: 100,
  quantity: 1,
  gstRate: 18,
  cessRate: 0,
  discountType: 'Amount',
  discountValue: 500,
});
assert('Test 8 - Discount larger than price is capped => Discount: 100, Taxable: 0, Net: 0',
  test8.discountAmount === 100 &&
  test8.taxableAmount === 0 &&
  test8.gstAmount === 0 &&
  test8.netAmount === 0
);

// Test 9: Zero Quantity
const test9 = calculateLineItemWithBillType({
  billType: 'Exclusive',
  price: 250,
  quantity: 0,
  gstRate: 18,
  cessRate: 0,
  discountType: 'Amount',
  discountValue: 0,
});
assert('Test 9 - Zero quantity yields 0 across all figures',
  test9.baseAmount === 0 && test9.netAmount === 0
);

// Test 10: Invoice Totals with Additional Charges, TCS, and Overall Discount
const lines = [test1, test3]; // test1 Net = 2360, test3 Net = 2016 => Cart Net = 4376
const totals = calculateInvoiceTotals(lines, {
  labour: 100,
  freight: 150,
  other: 50,
  tcsApplicable: true,
  tcsAmount: 25.5,
  overallDiscount: 151.5,
});
// 4376 + 325.5 - 151.5 = 4550.00
assert('Test 10 - Invoice Totals with additional charges & TCS => Payable: 4550',
  totals.cartNetAmount === 4376 &&
  totals.totalAdditionalCharges === 325.5 &&
  totals.finalPayableAmount === 4550 &&
  totals.roundedPayableAmount === 4550 &&
  totals.roundOffDifference === 0
);

// Test 11: Currency Formatting
const formatted = formatIndianCurrency(1234567.89);
assert('Test 11 - Indian currency formatting => ₹12,34,567.89',
  formatted === '₹12,34,567.89'
);

console.log(`\nTests Completed: ${passedCount} passed, ${failedCount} failed.`);

