import { apiClient, parseApiError } from './client';

export interface BeatItem {
  beatId: number;
  distributorId?: number;
  beatName: string;
  status: 'Active' | 'Deactive' | string;
  insertDate?: string;
  insertTime?: string;
}

/**
 * Fetch beats list with search and pagination
 */
export async function fetchBeatListApi(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ beats: BeatItem[]; total: number }> {
  try {
    const page = params?.page || 1;
    const limit = params?.limit || 100;
    const search = params?.search || '';

    const res = await apiClient.post<any>('master/fetch_beat', {
      page,
      limit,
      search,
    });

    const beatList = res.data?.data?.beat_list || [];
    const total = res.data?.data?.total || beatList.length;

    return {
      beats: Array.isArray(beatList) ? beatList : [],
      total,
    };
  } catch (err: any) {
    console.warn('fetchBeatListApi error:', parseApiError(err));
    return { beats: [], total: 0 };
  }
}

/**
 * Add a new beat
 */
export async function addBeatApi(beatName: string): Promise<{ message: string }> {
  try {
    const res = await apiClient.post('master/add_beat', {
      beat_value: beatName.trim(),
    });
    return res.data;
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}

/**
 * Update an existing beat
 */
export async function updateBeatApi(
  beatId: number,
  beatName: string
): Promise<{ message: string }> {
  try {
    const res = await apiClient.post('master/update_beat', {
      beat_id: beatId,
      beat_value: beatName.trim(),
    });
    return res.data;
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}

/**
 * Update beat active / deactive status
 */
export async function updateBeatStatusApi(
  beatId: number,
  status: 'Active' | 'Deactive'
): Promise<{ message: string }> {
  try {
    const res = await apiClient.post('master/update_beat_status', {
      beat_id: beatId,
      beat_status: status,
    });
    return res.data;
  } catch (err: any) {
    throw new Error(parseApiError(err));
  }
}
