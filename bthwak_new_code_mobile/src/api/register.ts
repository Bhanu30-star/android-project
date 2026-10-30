import { apiClient, parseApiError } from './client';

export interface RegisterOtpPayload {
  mobile_no: string;
  country_name: string;
  source: string;
}

export interface VerifyRegisterOtpPayload {
  mobile_no: string;
  country_name: string;
  otp: number;
}

export interface GstDataResponse {
  businessName?: string;
  tradeName?: string;
  panNumber?: string;
  lgnm?: string;
  pncd?: string;
  loc?: string;
  dst?: string;
  stcd?: string;
  state?: string;
  flno?: string;
  bno?: string;
  st?: string;
}

export interface PincodeDataResponse {
  city?: string;
  state?: string;
  district?: string;
}

export interface StateItem {
  state_code: string;
  state_name: string;
}

export async function getRegisterUniqueKeyApi(): Promise<string> {
  try {
    const response = await apiClient.get<{ status: boolean; data?: { unique_id?: string } }>(
      '/register_unique_key'
    );
    return response.data?.data?.unique_id || '';
  } catch {
    return '';
  }
}

export async function sendRegisterOtpApi(mobile: string, country = 'India') {
  const response = await apiClient.post('/send_otp', {
    mobile_no: mobile.trim(),
    country_name: country.trim(),
    source: 'app',
  });
  return response.data;
}

export async function verifyRegisterOtpApi(mobile: string, otp: number, country = 'India') {
  const response = await apiClient.post('/verify_otp', {
    mobile_no: mobile.trim(),
    country_name: country.trim(),
    otp,
  });
  return response.data;
}

export async function fetchGstDetailsApi(gstNumber: string) {
  const response = await apiClient.get(`/get_gst_data?gst_number=${gstNumber.trim().toUpperCase()}`);
  return response.data;
}

export async function fetchPincodeDetailsApi(pincode: string) {
  const response = await apiClient.get(`/get_pin_data?pin_code=${pincode.trim()}`);
  return response.data;
}

export async function fetchStateListApi(countryName = 'India') {
  const response = await apiClient.get('/get_state_list', {
    params: { country_name: countryName },
  });
  return response.data;
}

export async function submitRegistrationApi(formData: any) {
  const response = await apiClient.post('/register', formData);
  return response.data;
}
