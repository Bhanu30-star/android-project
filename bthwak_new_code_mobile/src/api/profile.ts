import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, parseApiError } from './client';

export interface ProfileDetails {
  distributor_id?: string | number;
  user_name?: string;
  distributor_name: string;
  distributor_name_in_hindi?: string;
  distributor_email: string;
  mobile_no: string;
  primary_no?: string;
  secondary_no?: string;
  distributor_phone?: string;
  place_of_supply?: string;
  country?: string;
  pan_no: string;
  gstin: string;
  gstin_no?: string;
  food_license?: string;
  udyam_no?: string;
  dln_no?: string;
  gst_username?: string;
  gst_password?: string;
  itr_username?: string;
  itr_password?: string;
  distributor_address: string;
  distributor_address_in_hindi?: string;
  description?: string;
  business_description?: string;
  tcs_applicable: 'Yes' | 'No';
  company_logo?: string;
  bank_qr_code?: string;
  profile_image?: string;
  app_version?: string;
  renew_date?: string;
}

export const FALLBACK_PROFILE: ProfileDetails = {
  distributor_id: '',
  user_name: '',
  distributor_name: '',
  distributor_name_in_hindi: '',
  distributor_email: '',
  mobile_no: '',
  primary_no: '',
  secondary_no: '',
  distributor_phone: '',
  place_of_supply: '',
  country: 'India',
  pan_no: '',
  gstin: '',
  gstin_no: '',
  food_license: '',
  udyam_no: '',
  dln_no: '',
  gst_username: '',
  gst_password: '',
  itr_username: '',
  itr_password: '',
  distributor_address: '',
  distributor_address_in_hindi: '',
  description: '',
  business_description: '',
  tcs_applicable: 'No',
  company_logo: '',
  bank_qr_code: '',
  profile_image: '',
  app_version: '1.0.0',
  renew_date: '',
};

// GET profile details API
export async function fetchProfileDetailsApi(): Promise<ProfileDetails> {
  try {
    const res = await apiClient.get<{ status: boolean; data?: ProfileDetails; message?: string }>(
      '/profile/get_profile_details'
    );
    if (res.data?.status && res.data.data) {
      const data = res.data.data;
      return {
        ...FALLBACK_PROFILE,
        ...data,
        distributor_name: data.distributor_name || FALLBACK_PROFILE.distributor_name,
        gstin: data.gstin || data.gstin_no || FALLBACK_PROFILE.gstin,
        pan_no: data.pan_no || FALLBACK_PROFILE.pan_no,
        mobile_no: data.mobile_no || data.primary_no || FALLBACK_PROFILE.mobile_no,
        distributor_address: data.distributor_address || FALLBACK_PROFILE.distributor_address,
      };
    }
    return FALLBACK_PROFILE;
  } catch (err) {
    // If backend is unreachable or local mock, return fallback profile
    console.warn('Profile fetch API error, using fallback data:', parseApiError(err));
    return FALLBACK_PROFILE;
  }
}

// UPDATE profile details API
export async function updateProfileDetailsApi(formData: FormData): Promise<{ status: boolean; message: string }> {
  try {
    const res = await apiClient.post<{ status: boolean; message: string }>(
      '/profile/upload_profile_details',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    if (!res.data?.status) {
      throw new Error(res.data?.message || 'Failed to update profile details');
    }
    return res.data;
  } catch (err: unknown) {
    const msg = parseApiError(err);
    throw new Error(msg);
  }
}

// React Query hook: fetch profile
export function useProfileQuery() {
  return useQuery<ProfileDetails>({
    queryKey: ['profile'],
    queryFn: fetchProfileDetailsApi,
    staleTime: 1000 * 60 * 5,
  });
}

// React Query hook: update profile mutation
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfileDetailsApi,
    onSuccess: () => {
      // Invalidate the profile query so all screens update
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
