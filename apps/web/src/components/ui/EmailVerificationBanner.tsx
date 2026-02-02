'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from './Button';
import apiClient from '@/lib/api-client';

interface EmailVerificationBannerProps {
  email: string;
  onDismiss?: () => void;
}

export default function EmailVerificationBanner({ email, onDismiss }: EmailVerificationBannerProps) {
  const [isResending, setIsResending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const resendVerification = async () => {
    setIsResending(true);
    try {
      await apiClient.post('/auth/resend-verification');
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="bg-gray-50 border border-black/20 rounded-lg p-4">
      <div className="flex items-start">
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
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-black">Verify your email address</h3>
          <div className="mt-2 text-sm text-gray-700">
            <p>
              We sent a verification email to <span className="font-medium">{email}</span>.
              Please check your inbox and click the verification link to activate all features.
            </p>
          </div>
          <div className="mt-4 flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={resendVerification}
              isLoading={isResending}
            >
              Resend Email
            </Button>
            <button
              onClick={handleDismiss}
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={handleDismiss}
            className="inline-flex rounded-md text-gray-600 hover:text-black focus:outline-none transition-colors"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
