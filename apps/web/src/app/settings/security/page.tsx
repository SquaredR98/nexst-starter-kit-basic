'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import apiClient from '@/lib/api-client';
import { Session } from '@/types/auth';
import { formatDateTime } from '@/lib/utils';
import TwoFactorSetupWizard from '@/components/auth/TwoFactorSetupWizard';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SecuritySettingsPage() {
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [show2FAWizard, setShow2FAWizard] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    fetchSessions();
    check2FAStatus();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await apiClient.get<Session[]>('/sessions');
      setSessions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const check2FAStatus = async () => {
    try {
      const response = await apiClient.get('/2fa/status');
      setIs2FAEnabled(response.data.enabled);
    } catch (error) {
      console.error('Failed to check 2FA status:', error);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsPasswordLoading(true);
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully');
      reset();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      await apiClient.delete(`/sessions/${sessionId}`);
      toast.success('Session revoked successfully');
      fetchSessions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to revoke session');
    }
  };

  const revokeAllOtherSessions = async () => {
    if (!confirm('Are you sure you want to sign out all other devices?')) {
      return;
    }

    try {
      await apiClient.delete('/sessions/others');
      toast.success('All other sessions have been revoked');
      fetchSessions();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to revoke sessions');
    }
  };

  const handle2FAToggle = () => {
    if (is2FAEnabled) {
      // Disable 2FA
      disable2FA();
    } else {
      // Enable 2FA - show wizard
      setShow2FAWizard(true);
    }
  };

  const disable2FA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) {
      return;
    }

    try {
      await apiClient.post('/2fa/disable');
      setIs2FAEnabled(false);
      toast.success('Two-factor authentication disabled');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to disable 2FA');
    }
  };

  const handle2FAComplete = () => {
    setShow2FAWizard(false);
    setIs2FAEnabled(true);
    check2FAStatus();
  };

  return (
    <>
      {show2FAWizard && (
        <TwoFactorSetupWizard
          onComplete={handle2FAComplete}
          onCancel={() => setShow2FAWizard(false)}
        />
      )}

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-black">Security Settings</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your password, two-factor authentication, and active sessions.
          </p>
        </div>

      {/* Change Password */}
      <form onSubmit={handleSubmit(onPasswordSubmit)}>
        <div className="bg-white border border-black/20 rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-black mb-4">Change Password</h3>
            <div className="space-y-4 max-w-xl">
              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                error={errors.currentPassword?.message}
                {...register('currentPassword')}
              />

              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                error={errors.newPassword?.message}
                {...register('newPassword')}
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              <div className="text-sm text-gray-600">
                <p className="mb-2">Password requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>At least 8 characters long</li>
                  <li>Contains uppercase and lowercase letters</li>
                  <li>Contains at least one number</li>
                  <li>Contains at least one special character</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end">
            <Button type="submit" variant="primary" isLoading={isPasswordLoading}>
              Update Password
            </Button>
          </div>
        </div>
      </form>

      {/* Two-Factor Authentication */}
      <div className="bg-white border border-black/20 rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-black">Two-Factor Authentication</h3>
              <p className="mt-1 text-sm text-gray-600">
                Add an extra layer of security to your account
              </p>
            </div>
            <div>
              {is2FAEnabled ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-black text-white">
                  Enabled
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700">
                  Disabled
                </span>
              )}
            </div>
          </div>
          <div className="mt-4">
            <Button
              variant={is2FAEnabled ? 'danger' : 'primary'}
              onClick={handle2FAToggle}
            >
              {is2FAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </Button>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white border border-black/20 rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-black">Active Sessions</h3>
              <p className="mt-1 text-sm text-gray-600">
                Manage your active sessions across different devices
              </p>
            </div>
            {sessions.filter(s => !s.isCurrent).length > 0 && (
              <Button variant="outline" size="sm" onClick={revokeAllOtherSessions}>
                Sign Out All Other Devices
              </Button>
            )}
          </div>

          {isLoadingSessions ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-gray-600 text-sm">No active sessions</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="border border-black/20 rounded-lg p-4 flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center">
                      <svg
                        className="h-5 w-5 text-black mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <h4 className="text-sm font-medium text-black">
                        {session.userAgent || 'Unknown Device'}
                        {session.isCurrent && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-black text-white">
                            Current Session
                          </span>
                        )}
                      </h4>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      <p>IP Address: {session.ipAddress || 'Unknown'}</p>
                      <p>Last active: {formatDateTime(session.lastActiveAt)}</p>
                      <p>Expires: {formatDateTime(session.expiresAt)}</p>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeSession(session.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
