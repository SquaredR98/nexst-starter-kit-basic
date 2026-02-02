'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import apiClient from '@/lib/api-client';
import { OAuthAccount } from '@/types/auth';
import { formatDate } from '@/lib/utils';

export default function ConnectedAccountsPage() {
  const [accounts, setAccounts] = useState<OAuthAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConnectedAccounts();
  }, []);

  const fetchConnectedAccounts = async () => {
    try {
      const response = await apiClient.get<OAuthAccount[]>('/auth/oauth/accounts');
      setAccounts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch connected accounts:', error);
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const connectAccount = (provider: 'google' | 'github') => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    window.location.href = `${apiUrl}/auth/${provider}`;
  };

  const disconnectAccount = async (provider: string) => {
    if (!confirm(`Are you sure you want to disconnect your ${provider} account?`)) {
      return;
    }

    try {
      await apiClient.delete(`/auth/oauth/${provider}`);
      toast.success(`${provider} account disconnected successfully`);
      fetchConnectedAccounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to disconnect account');
    }
  };

  const getProviderIcon = (provider: string) => {
    if (provider === 'google') {
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      );
    } else if (provider === 'github') {
      return (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return null;
  };

  const getProviderColor = (provider: string) => {
    // Monochrome design - all icons black
    return 'text-black';
  };

  const isConnected = (provider: string) => {
    return accounts.some((account) => account.provider === provider);
  };

  const getConnectedAccount = (provider: string) => {
    return accounts.find((account) => account.provider === provider);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black">Connected Accounts</h1>
        <p className="mt-1 text-sm text-gray-600">
          Link your social accounts for easy sign-in and profile synchronization.
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white border border-black/20 rounded-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-black/20 rounded-lg divide-y divide-black/10">
          {/* Google Account */}
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={getProviderColor('google')}>
                  {getProviderIcon('google')}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-black">Google</h3>
                  {isConnected('google') ? (
                    <div className="mt-1 text-sm text-gray-600">
                      <p className="font-medium">{getConnectedAccount('google')?.email}</p>
                      {getConnectedAccount('google')?.displayName && (
                        <p>{getConnectedAccount('google')?.displayName}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Connected {formatDate(getConnectedAccount('google')!.createdAt)}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-gray-600">Not connected</p>
                  )}
                </div>
              </div>
              <div>
                {isConnected('google') ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnectAccount('google')}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => connectAccount('google')}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* GitHub Account */}
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={getProviderColor('github')}>
                  {getProviderIcon('github')}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-black">GitHub</h3>
                  {isConnected('github') ? (
                    <div className="mt-1 text-sm text-gray-600">
                      <p className="font-medium">{getConnectedAccount('github')?.email}</p>
                      {getConnectedAccount('github')?.displayName && (
                        <p>{getConnectedAccount('github')?.displayName}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Connected {formatDate(getConnectedAccount('github')!.createdAt)}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-gray-600">Not connected</p>
                  )}
                </div>
              </div>
              <div>
                {isConnected('github') ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnectAccount('github')}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => connectAccount('github')}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Information */}
      <div className="bg-gray-50 border border-black/20 rounded-lg p-4">
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
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-black">About Connected Accounts</h3>
            <div className="mt-2 text-sm text-gray-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Link multiple social accounts to sign in more easily</li>
                <li>Your profile information will be synced from connected accounts</li>
                <li>You can disconnect accounts at any time</li>
                <li>At least one sign-in method must remain active</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
