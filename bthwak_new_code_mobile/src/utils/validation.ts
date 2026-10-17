import { z } from 'zod';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mobileRegex = /^\d{10}$/;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email or mobile is required')
    .refine((val) => emailRegex.test(val.trim()) || mobileRegex.test(val.trim()), {
      message: 'Enter valid email or 10-digit mobile number',
    }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const otpRequestSchema = z.object({
  contact: z
    .string()
    .min(1, 'Email or mobile is required')
    .refine((val) => emailRegex.test(val.trim()) || mobileRegex.test(val.trim()), {
      message: 'Enter valid email or 10-digit mobile number',
    }),
});

export type OtpRequestFormData = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z.object({
  contact: z
    .string()
    .min(1, 'Email or mobile is required')
    .refine((val) => emailRegex.test(val.trim()) || mobileRegex.test(val.trim()), {
      message: 'Enter valid email or 10-digit mobile number',
    }),
  otp: z.string().length(6, 'Enter a valid 6-digit OTP'),
});

export type OtpVerifyFormData = z.infer<typeof otpVerifySchema>;

export const forgotPasswordSchema = z.object({
  user: z
    .string()
    .min(1, 'Email or mobile is required')
    .refine((val) => emailRegex.test(val.trim()) || mobileRegex.test(val.trim()), {
      message: 'Enter valid email or 10-digit mobile number',
    }),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
