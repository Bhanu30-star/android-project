/**
 * Formats a number with Indian grouping: 1,13,020, 5,000, 0
 */
export function formatIndianNumber(val: number | string | undefined | null): string {
  if (val === null || val === undefined || val === '') return '0';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '0';

  const isNeg = num < 0;
  const abs = Math.abs(num);
  const rounded = Math.round(abs);
  const str = rounded.toString();

  if (str.length <= 3) {
    return `${isNeg ? '-' : ''}${str}`;
  }

  const lastThree = str.substring(str.length - 3);
  const rest = str.substring(0, str.length - 3);
  const formattedRest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');

  return `${isNeg ? '-' : ''}${formattedRest},${lastThree}`;
}

/**
 * Formats currency with Indian grouping and symbol: ₹1,13,020, ₹5,000, -₹84,120
 */
export function formatIndianCurrency(
  val: number | string | undefined | null,
  symbol: string = '₹'
): string {
  if (val === null || val === undefined || val === '') return `${symbol}0`;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return `${symbol}0`;

  const isNeg = num < 0;
  const absFormatted = formatIndianNumber(Math.abs(num));
  return `${isNeg ? '-' : ''}${symbol}${absFormatted}`;
}
