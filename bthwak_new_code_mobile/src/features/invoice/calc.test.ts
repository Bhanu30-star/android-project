import {
  calculateLineItem,
  calculateInvoiceTotals,
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

// Test 1: 20 @ 12% inclusive -> taxable 17.86, GST 2.14, net 20.00
const test1 = calculateLineItem({
  billType: 'Inclusive',
  price: 20,
  quantity: 1,
  gstRate: 12,
  cessRate: 0,
  discountType: 'Amount',
  discountValue: 0,
});
assert(
  'Test 1 - 20 @ 12% inclusive => taxable: 17.86, GST: 2.14, net: 20.00',
  test1.taxableAmount === 17.86 &&
  test1.gstAmount === 2.14 &&
  test1.netAmount === 20.00 &&
  test1.cgstAmount === 1.07 &&
  test1.sgstAmount === 1.07,
  test1
);

// Test 2: 20 @ 12% exclusive -> taxable 20.00, GST 2.40, net 22.40
const test2 = calculateLineItem({
  billType: 'Exclusive',
  price: 20,
  quantity: 1,
  gstRate: 12,
  cessRate: 0,
  discountType: 'Amount',
  discountValue: 0,
});
assert(
  'Test 2 - 20 @ 12% exclusive => taxable: 20.00, GST: 2.40, net: 22.40',
  test2.taxableAmount === 20.00 &&
  test2.gstAmount === 2.40 &&
  test2.netAmount === 22.40 &&
  test2.cgstAmount === 1.20 &&
  test2.sgstAmount === 1.20,
  test2
);

// Test 3: with amount discount (500 base - 50 discount @ 18% inclusive)
const test3 = calculateLineItem({
  billType: 'Inclusive',
  price: 250,
  quantity: 2, // 500 base
  gstRate: 18,
  cessRate: 0,
  discountType: 'Amount',
  discountValue: 50, // 450 net
});
// 450 net inclusive @ 18%: GST = 450 * 18 / 118 = 68.644... -> 68.64, taxable = 450 - 68.64 = 381.36
assert(
  'Test 3 - with amount discount inclusive => base: 500, discount: 50, net: 450, GST: 68.64, taxable: 381.36',
  test3.baseAmount === 500.00 &&
  test3.discountAmount === 50.00 &&
  test3.netAmount === 450.00 &&
  test3.gstAmount === 68.64 &&
  test3.taxableAmount === 381.36,
  test3
);

// Test 4: with percent discount (1000 base with 10% discount @ 18% exclusive)
const test4 = calculateLineItem({
  billType: 'Exclusive',
  price: 1000,
  quantity: 1,
  gstRate: 18,
  cessRate: 0,
  discountType: 'Percent',
  discountValue: 10, // 100 discount, 900 taxable
});
assert(
  'Test 4 - with percent discount exclusive => base: 1000, disc: 100, taxable: 900, GST: 162, net: 1062',
  test4.baseAmount === 1000.00 &&
  test4.discountAmount === 100.00 &&
  test4.taxableAmount === 900.00 &&
  test4.gstAmount === 162.00 &&
  test4.netAmount === 1062.00,
  test4
);

// Test 5: free scheme
const test5 = calculateLineItem({
  billType: 'Inclusive',
  price: 500,
  quantity: 2,
  gstRate: 18,
  cessRate: 0,
  freeScheme: 'Yes',
});
assert(
  'Test 5 - free scheme item => taxable: 0, GST: 0, net: 0, disc: 0',
  test5.taxableAmount === 0 &&
  test5.gstAmount === 0 &&
  test5.netAmount === 0 &&
  test5.discountAmount === 0,
  test5
);

// Test 6: CESS exclusive
const test6 = calculateLineItem({
  billType: 'Exclusive',
  price: 1000,
  quantity: 1,
  gstRate: 28,
  cessRate: 12,
  discountType: 'Amount',
  discountValue: 0,
});
assert(
  'Test 6 - CESS exclusive 28% GST + 12% CESS => taxable: 1000, GST: 280, CESS: 120, net: 1400',
  test6.taxableAmount === 1000.00 &&
  test6.gstAmount === 280.00 &&
  test6.cessAmount === 120.00 &&
  test6.netAmount === 1400.00,
  test6
);

// Test 7: CESS inclusive
const test7 = calculateLineItem({
  billType: 'Inclusive',
  price: 1400,
  quantity: 1,
  gstRate: 28,
  cessRate: 12,
  discountType: 'Amount',
  discountValue: 0,
});
assert(
  'Test 7 - CESS inclusive 28% GST + 12% CESS => net: 1400, GST: 280, CESS: 120, taxable: 1000',
  test7.netAmount === 1400.00 &&
  test7.gstAmount === 280.00 &&
  test7.cessAmount === 120.00 &&
  test7.taxableAmount === 1000.00,
  test7
);

// Test 8: Multiple items totals
const lineA = calculateLineItem({
  billType: 'Exclusive',
  price: 200,
  quantity: 2, // 400
  gstRate: 18,
});
const lineB = calculateLineItem({
  billType: 'Exclusive',
  price: 100,
  quantity: 3, // 300
  gstRate: 12,
});
const lineC = calculateLineItem({
  billType: 'Exclusive',
  price: 50,
  quantity: 4, // 200
  gstRate: 5,
});

const multiTotals = calculateInvoiceTotals(
  [lineA, lineB, lineC],
  {
    labour: 50,
    freight: 100,
    other: 0,
    tcsApplicable: false,
    overallDiscount: 20,
  }
);
// Base: 400 + 300 + 200 = 900
// GST: 72 + 36 + 10 = 118
// Cart Net: 900 + 118 = 1018
// Charges: 150
// Overall Disc: 20
// Final: 1018 + 150 - 20 = 1148
assert(
  'Test 8 - Multiple items totals => Base: 900, GST: 118, CartNet: 1018, Payable: 1148',
  multiTotals.totalBaseAmount === 900.00 &&
  multiTotals.totalGstAmount === 118.00 &&
  multiTotals.cartNetAmount === 1018.00 &&
  multiTotals.finalPayableAmount === 1148.00 &&
  multiTotals.roundedPayableAmount === 1148.00 &&
  multiTotals.roundOffDifference === 0.00,
  multiTotals
);

// Test 9: Rounding case
const lineRounding = calculateLineItem({
  billType: 'Exclusive',
  price: 33.33,
  quantity: 3, // 99.99
  gstRate: 18, // 18.00
});
const roundingTotals = calculateInvoiceTotals([lineRounding], {
  labour: 0,
  freight: 0,
  other: 0,
});
// 99.99 + 18.00 = 117.99 => rounded: 118, diff: +0.01
assert(
  'Test 9 - Rounding case => exact: 117.99, rounded: 118, roundOffDiff: 0.01',
  roundingTotals.finalPayableAmount === 117.99 &&
  roundingTotals.roundedPayableAmount === 118.00 &&
  roundingTotals.roundOffDifference === 0.01,
  roundingTotals
);

// Test 10: Currency formatting
assert(
  'Test 10 - Currency formatting => ₹1,234.56',
  formatIndianCurrency(1234.56) === '₹1,234.56'
);

console.log(`\nTests Completed: ${passedCount} passed, ${failedCount} failed.`);
if (failedCount > 0) {
  process.exit(1);
}
