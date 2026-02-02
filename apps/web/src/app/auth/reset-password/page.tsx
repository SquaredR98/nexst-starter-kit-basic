'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import apiClient from '@/lib/api-client';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      toast.error('Invalid or missing reset token');
      router.push('/auth/forgot-password');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams, router]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword: data.password,
      });
      toast.success('Password reset successfully! Please login with your new password.');
      router.push('/auth/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white overflow-y-auto">
        <div className="max-w-md w-full space-y-8 py-12">
          <div>
            <Link href="/" className="inline-block mb-8">
              <div className="text-2xl font-bold text-black">AuthKit</div>
            </Link>
            <h2 className="text-3xl font-bold text-black">Create new password</h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter a strong password for your account. Make sure it meets all the requirements below.
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <div className="text-sm text-gray-600 bg-gray-50 border border-black/20 rounded-lg p-4">
              <p className="font-semibold text-gray-900 mb-2">Password requirements:</p>
              <ul className="space-y-1 text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>At least 8 characters long</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Contains uppercase and lowercase letters</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Contains at least one number</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Contains at least one special character</span>
                </li>
              </ul>
            </div>

            <div>
              <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                Reset password
              </Button>
            </div>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-black hover:text-gray-700"
              >
                ← Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 bg-black items-center justify-center p-12 sticky top-0 h-screen">
        <div className="max-w-md text-white">
          <h1 className="text-4xl font-bold mb-6">Secure Reset</h1>
          <p className="text-lg text-gray-400 mb-8">
            Your password reset link is encrypted and can only be used once. Create a strong
            password to protect your account.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <svg
                className="h-6 w-6 text-white shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <div className="ml-3">
                <h3 className="font-semibold">Strong Encryption</h3>
                <p className="text-gray-400 text-sm">
                  Your password is hashed with bcrypt before storage
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <svg
                className="h-6 w-6 text-white shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div className="ml-3">
                <h3 className="font-semibold">One-Time Use</h3>
                <p className="text-gray-400 text-sm">
                  This reset link expires after use or in 1 hour
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <svg
                className="h-6 w-6 text-white shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                />
              </svg>
              <div className="ml-3">
                <h3 className="font-semibold">Session Security</h3>
                <p className="text-gray-400 text-sm">
                  All existing sessions remain active after reset
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
