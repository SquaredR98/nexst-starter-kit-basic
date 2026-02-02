'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import EmailVerificationBanner from '@/components/ui/EmailVerificationBanner';
import { formatDate, getInitials } from '@/lib/utils';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isAdmin = user.roles?.some((userRole) =>
    userRole.role.permissions?.some((p) =>
      p.permission.resource === 'admin' && p.permission.action === 'read'
    )
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white border-b border-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-black">AuthKit</h1>
              </div>
              <div className="flex items-center space-x-4">
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="ghost">Admin Panel</Button>
                  </Link>
                )}
                <Link href="/settings/profile">
                  <Button variant="ghost">Settings</Button>
                </Link>
                <Button variant="outline" onClick={logout}>
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Email Verification Banner */}
            {!user.emailVerified && (
              <div className="mb-6">
                <EmailVerificationBanner email={user.email} />
              </div>
            )}

            {/* Welcome Section */}
            <div className="bg-white border border-black/20 rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="shrink-0">
                    {user.profile?.avatarUrl ? (
                      <img
                        className="h-16 w-16 rounded-full"
                        src={user.profile.avatarUrl}
                        alt={`${user.profile.firstName} ${user.profile.lastName}`}
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-black flex items-center justify-center text-white text-xl font-semibold">
                        {getInitials(user.profile?.firstName, user.profile?.lastName)}
                      </div>
                    )}
                  </div>
                  <div className="ml-5">
                    <h2 className="text-2xl font-bold text-black">
                      Welcome back{user.profile?.firstName ? `, ${user.profile.firstName}` : ''}!
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Account Status */}
              <div className="bg-white border border-black/20 rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="text-sm font-medium text-gray-600 truncate">Account Status</div>
                  <div className="mt-1 text-3xl font-semibold text-black">
                    {user.emailVerified ? (
                      <span className="text-black text-base flex items-center">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Verified
                      </span>
                    ) : (
                      <span className="text-gray-700 text-base">Not Verified</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Member Since */}
              <div className="bg-white border border-black/20 rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="text-sm font-medium text-gray-600 truncate">Member Since</div>
                  <div className="mt-1 text-base font-semibold text-black">
                    {user.profile ? formatDate(new Date()) : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Roles */}
              <div className="bg-white border border-black/20 rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="text-sm font-medium text-gray-600 truncate">Your Roles</div>
                  <div className="mt-1">
                    {user.roles && user.roles.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user.roles.map((userRole) => (
                          <span
                            key={userRole.role.id}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black text-white"
                          >
                            {userRole.role.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">No roles assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-black mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                  href="/settings/profile"
                  className="relative rounded-lg border border-black/20 bg-white px-6 py-5 hover:border-black/40 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="shrink-0">
                      <svg
                        className="h-6 w-6 text-black"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-black">Edit Profile</p>
                      <p className="text-sm text-gray-600">Update your personal information</p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/settings/security"
                  className="relative rounded-lg border border-black/20 bg-white px-6 py-5 hover:border-black/40 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="shrink-0">
                      <svg
                        className="h-6 w-6 text-black"
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
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-black">Security Settings</p>
                      <p className="text-sm text-gray-600">Manage password and 2FA</p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/settings/connected-accounts"
                  className="relative rounded-lg border border-black/20 bg-white px-6 py-5 hover:border-black/40 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="shrink-0">
                      <svg
                        className="h-6 w-6 text-black"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-black">Connected Accounts</p>
                      <p className="text-sm text-gray-600">Link social accounts</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
