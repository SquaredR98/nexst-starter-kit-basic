'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import apiClient from '@/lib/api-client';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', data);
      setIsSuccess(true);
      toast.success('Password reset instructions sent to your email');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white overflow-y-auto">
        <div className="max-w-md w-full space-y-8 py-12">
          <div>
            <Link href="/" className="inline-block mb-8">
              <div className="text-2xl font-bold text-black">AuthKit</div>
            </Link>
            <h2 className="text-3xl font-bold text-black">Reset your password</h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>

          {isSuccess ? (
            <div className="space-y-6">
              <div className="bg-gray-50 border border-black/20 rounded-lg p-6">
                <div className="flex">
                  <div className="shrink-0">
                    <svg
                      className="h-5 w-5 text-black"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-black">Check your email</h3>
                    <div className="mt-2 text-sm text-gray-700">
                      <p>
                        We've sent password reset instructions to your email address. Please check
                        your inbox and follow the link to reset your password.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-black hover:text-gray-700"
                >
                  ← Back to login
                </Link>
              </div>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <div>
                <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                  Send reset instructions
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
          )}
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 bg-black items-center justify-center p-12 sticky top-0 h-screen">
        <div className="max-w-md text-white">
          <h1 className="text-4xl font-bold mb-6">Account Recovery</h1>
          <p className="text-lg text-gray-400 mb-8">
            Securely reset your password with our encrypted recovery process. Your security is our
            top priority.
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div className="ml-3">
                <h3 className="font-semibold">Secure Reset Link</h3>
                <p className="text-gray-400 text-sm">
                  One-time use link expires in 1 hour for your security
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <div className="ml-3">
                <h3 className="font-semibold">Email Verification</h3>
                <p className="text-gray-400 text-sm">
                  We'll send instructions to your registered email
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
