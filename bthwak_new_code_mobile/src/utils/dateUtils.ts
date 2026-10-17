export type PresetKey =
  | 'FTD'
  | 'YESTERDAY'
  | 'LAST_7'
  | 'MTD'
  | 'LAST_30'
  | 'LAST_MONTH'
  | 'YTD';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  label: string;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/** Formats a date to YYYY-MM-DD (safe for local timezone) */
export function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Formats date to 'DD MMM YYYY' (e.g. 17 Oct 2026) */
export function formatReadable(d: Date | string): string {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return String(d);
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day} ${month} ${year}`;
}

/** Formats date to 'DD MMM' (e.g. 17 Oct) */
export function formatShortDate(d: Date | string): string {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return String(d);
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[dateObj.getMonth()];
  return `${day} ${month}`;
}

/** Helper to add/subtract days */
function addDays(d: Date, days: number): Date {
  const res = new Date(d);
  res.setDate(res.getDate() + days);
  return res;
}

/** Returns date range for a given dashboard preset filter */
export function getPresetDateRange(key: PresetKey): DateRange {
  const today = new Date();

  switch (key) {
    case 'FTD': {
      const todayStr = formatYmd(today);
      return { startDate: todayStr, endDate: todayStr, label: 'Today' };
    }
    case 'YESTERDAY': {
      const y = addDays(today, -1);
      const yStr = formatYmd(y);
      return { startDate: yStr, endDate: yStr, label: 'Yesterday' };
    }
    case 'LAST_7': {
      const start = addDays(today, -6);
      return {
        startDate: formatYmd(start),
        endDate: formatYmd(today),
        label: 'Last 7 Days',
      };
    }
    case 'MTD': {
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        startDate: formatYmd(firstOfMonth),
        endDate: formatYmd(today),
        label: 'This Month',
      };
    }
    case 'LAST_30': {
      const start = addDays(today, -29);
      return {
        startDate: formatYmd(start),
        endDate: formatYmd(today),
        label: 'Last 30 Days',
      };
    }
    case 'LAST_MONTH': {
      const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        startDate: formatYmd(firstOfLastMonth),
        endDate: formatYmd(lastOfLastMonth),
        label: 'Last Month',
      };
    }
    case 'YTD': {
      const firstOfYear = new Date(today.getFullYear(), 0, 1);
      return {
        startDate: formatYmd(firstOfYear),
        endDate: formatYmd(today),
        label: 'Year to Date',
      };
    }
    default: {
      const todayStr = formatYmd(today);
      return { startDate: todayStr, endDate: todayStr, label: 'Today' };
    }
  }
}

/** Formats currency with Indian numbering format (e.g. ₹ 1,50,000) */
export function formatCurrency(
  val: number | string | null | undefined,
  currencySymbol = '₹'
): string {
  if (val === null || val === undefined) return `${currencySymbol} 0`;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return `${currencySymbol} 0`;

  // Standard Indian formatting
  const formatted = num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });

  return `${currencySymbol === 'INR' ? '₹' : currencySymbol} ${formatted}`;
}
