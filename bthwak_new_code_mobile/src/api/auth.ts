import { apiClient } from './client';
import { getMobileDeviceInfo } from '../utils/deviceInfo';

export interface LoginResponseData {
  auth_token: string;
}

export interface ApiResponse<T = unknown> {
  status: boolean;
  message: string;
  error?: string;
  data: T;
}

export interface LoginParams {
  emailOrMobile: string;
  password?: string;
  otp?: string;
  loginType: 'with-pass' | 'with-otp';
  trustDevice?: boolean;
  recaptchaKey?: string;
}

export async function loginApi({
  emailOrMobile,
  password = '',
  otp = '',
  loginType,
  trustDevice = false,
  recaptchaKey = '',
}: LoginParams): Promise<ApiResponse<LoginResponseData>> {
  const deviceInfo = await getMobileDeviceInfo();

  const payload = {
    email_mobile: emailOrMobile.trim(),
    password: password.trim(),
    source: 'app',
    otp: otp.trim(),
    login: loginType,
    remember_me: trustDevice ? 'Yes' : 'No',
    recapcha_key: recaptchaKey || '',
    latitude: deviceInfo.latitude,
    longitude: deviceInfo.longitude,
    carrier_name: deviceInfo.carrier_name,
    ip_address: deviceInfo.ip_address,
    imei_no: deviceInfo.imei_no,
    device_id: deviceInfo.device_id,
    app_version: deviceInfo.app_version,
    version_code: deviceInfo.version_code,
    phone_model: deviceInfo.phone_model,
    phone_manufacturer: deviceInfo.phone_manufacturer,
    sdk_phone_version: deviceInfo.sdk_phone_version,
  };

  const response = await apiClient.post<ApiResponse<LoginResponseData>>('/login', payload);
  return response.data;
}

export async function sendOtpForLoginApi(
  contact: string,
  recaptchaKey = ''
): Promise<ApiResponse<null>> {
  const response = await apiClient.post<ApiResponse<null>>('/sendOTPForLogin', {
    mobile_no: contact.trim(),
    country_name: 'India',
    source: 'app',
    recapcha_key: recaptchaKey || '',
  });
  return response.data;
}

export async function forgotPasswordApi(user: string): Promise<ApiResponse<null>> {
  const response = await apiClient.post<ApiResponse<null>>('/forgot_password', {
    user: user.trim(),
  });
  return response.data;
}

export async function checkUserLoginApi(): Promise<ApiResponse<unknown>> {
  const response = await apiClient.get<ApiResponse<unknown>>('/check_user_login');
  return response.data;
}

export async function logoutApi(): Promise<ApiResponse<null>> {
  const response = await apiClient.post<ApiResponse<null>>('/logout', {
    source: 'app',
  });
  return response.data;
}

export async function getLoginQrCodeApi(): Promise<
  ApiResponse<{ qr_code_url: string; qr_token: string }>
> {
  const response = await apiClient.get<ApiResponse<{ qr_code_url: string; qr_token: string }>>(
    '/getLoginQrCode?source=app'
  );
  return response.data;
}

export async function checkLoginQrStatusApi(
  qrToken: string
): Promise<ApiResponse<{ success: 'Pending' | 'Approved' | 'Rejected'; auth_token?: string }>> {
  const response = await apiClient.get<
    ApiResponse<{ success: 'Pending' | 'Approved' | 'Rejected'; auth_token?: string }>
  >(`/checkLoginQrStatus?qr_token=${encodeURIComponent(qrToken)}`);
  return response.data;
}

export async function updateLoginQrStatusApi(
  qrToken: string,
  authToken: string
): Promise<ApiResponse<null>> {
  const response = await apiClient.post<ApiResponse<null>>('/updateLoginQrStatus', {
    qr_token: qrToken,
    auth_token: authToken,
  });
  return response.data;
}
