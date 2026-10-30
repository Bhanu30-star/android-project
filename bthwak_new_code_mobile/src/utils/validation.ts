import { z } from 'zod';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mobileRegex = /^[4-9]\d{9}$/;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email or mobile is required')
    .refine((val) => {
      const trimmed = val.trim();
      if (/^\d+$/.test(trimmed)) {
        return mobileRegex.test(trimmed);
      }
      return emailRegex.test(trimmed);
    }, {
      message: 'Enter valid email or 10-digit mobile number (starts with 4-9)',
    }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const otpRequestSchema = z.object({
  contact: z
    .string()
    .min(1, 'Email or mobile is required')
    .refine((val) => {
      const trimmed = val.trim();
      if (/^\d+$/.test(trimmed)) {
        return mobileRegex.test(trimmed);
      }
      return emailRegex.test(trimmed);
    }, {
      message: 'Enter valid email or 10-digit mobile number (starts with 4-9)',
    }),
});

export type OtpRequestFormData = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z.object({
  contact: z
    .string()
    .min(1, 'Email or mobile is required')
    .refine((val) => {
      const trimmed = val.trim();
      if (/^\d+$/.test(trimmed)) {
        return mobileRegex.test(trimmed);
      }
      return emailRegex.test(trimmed);
    }, {
      message: 'Enter valid email or 10-digit mobile number (starts with 4-9)',
    }),
  otp: z.string().length(6, 'Enter a valid 6-digit OTP'),
});

export type OtpVerifyFormData = z.infer<typeof otpVerifySchema>;

export const forgotPasswordSchema = z.object({
  user: z
    .string()
    .min(1, 'Email or mobile is required')
    .refine((val) => {
      const trimmed = val.trim();
      if (/^\d+$/.test(trimmed)) {
        return mobileRegex.test(trimmed);
      }
      return emailRegex.test(trimmed);
    }, {
      message: 'Enter valid email or 10-digit mobile number (starts with 4-9)',
    }),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
