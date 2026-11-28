import { apiClient, parseApiError } from './client';

export interface CollectionDsrHeader {
  key: string;
  label: string;
}

export interface CollectionDsrResponse {
  headers: CollectionDsrHeader[];
  rows: Record<string, any>[];
  flagDayEnd: number;
  flag_final: number;
  saleAllow: string;
}

export interface StockDsrResponse {
  headers: string[];
  data: Record<string, any>[];
  day_open: boolean;
  day_end: boolean;
}

export async function getCollectionDsrApi(date: string, page = 1, limit = 50): Promise<CollectionDsrResponse> {
  try {
    const res = await apiClient.post('/stock_dsr/getCollectionDsr', {
      date,
      from_date: date,
      to_date: date,
      page,
      limit,
    });
    const apiData = res.data?.data ?? res.data ?? {};
    const headers: CollectionDsrHeader[] = Array.isArray(apiData.headers)
      ? apiData.headers.map((h: any) =>
          typeof h === 'string' ? { key: h, label: h } : { key: String(h?.key ?? ''), label: String(h?.label ?? h?.key ?? '') }
        )
      : [];
    const rawRows = Array.isArray(apiData.rows) ? apiData.rows : [];
    const rows = rawRows.map((row: any, index: number) => {
      const denoms = Array.isArray(row?.denoms) ? row.denoms : [];
      const normalized: Record<string, any> = { ...row };
      headers.forEach((h, hIdx) => {
        const key = h.key;
        if (!key) return;
        if (key === '#') normalized[key] = row?.sr ?? index + 1;
        else if (key === 'sales_exec') normalized[key] = row?.sales_exec ?? row?.user_name ?? row?.sales_executive ?? '';
        else if (key === 'prev_amt') normalized[key] = row?.prev_amt ?? 0;
        else if (key === 'today_amt') normalized[key] = row?.today_amt ?? 0;
        else if (key.startsWith('denom_')) normalized[key] = denoms[hIdx - 4] ?? 0;
        else if (['cheque_online', 'cash', 'credit', 'autopay'].includes(key)) normalized[key] = row?.[key] ?? 0;
      });
      return normalized;
    });

    return {
      headers,
      rows,
      flagDayEnd: Number(apiData.flagDayEnd ?? 1),
      flag_final: Number(apiData.flag_final ?? 1),
      saleAllow: String(apiData.saleAllow ?? 'Yes'),
    };
  } catch (err) {
    const msg = (err as any)?.response?.data?.message || '';
    if (msg.toLowerCase().includes('no data')) {
      return { headers: [], rows: [], flagDayEnd: 1, flag_final: 1, saleAllow: 'Yes' };
    }
    throw parseApiError(err);
  }
}

export async function getStockDsrApi(date: string): Promise<StockDsrResponse> {
  try {
    const res = await apiClient.get(`/stock_dsr/get_dsr_report?date=${encodeURIComponent(date)}`);
    const d = res.data?.data ?? {};
    return {
      headers: Array.isArray(d.headers) ? d.headers : [],
      data: Array.isArray(d.data) ? d.data : [],
      day_open: Boolean(d.day_open),
      day_end: Boolean(d.day_end),
    };
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function dayOpenDsrApi(date: string): Promise<string> {
  try {
    const res = await apiClient.post('/stock_dsr/day_open_dsr', { date });
    return res.data?.data?.message || res.data?.message || 'Day opened successfully';
  } catch (err) {
    throw parseApiError(err);
  }
}

export async function dayEndDsrApi(date: string): Promise<string> {
  try {
    const res = await apiClient.post('/stock_dsr/day_end_dsr', { date });
    return res.data?.data?.message || res.data?.message || 'Day closed successfully';
  } catch (err) {
    throw parseApiError(err);
  }
}
