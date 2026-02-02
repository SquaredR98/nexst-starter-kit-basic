'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';

interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  lockedUsers: number;
  activeSessions: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  console.log('User in AdminDashboardPage:', user);
  const isAdmin = user?.roles?.some((userRole) =>
    userRole.role.permissions?.some((p) =>
      p.permission.resource === 'admin' && p.permission.action === 'read'
    )
  );

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!isAdmin) {
      router.push('/dashboard');
      toast.error('You do not have permission to access the admin panel');
      return;
    }

    fetchStats();
  }, [user, isAdmin, router]);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get<AdminStats>('/admin/stats');
      setStats(response.data);
    } catch (error: any) {
      toast.error('Failed to load admin statistics');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard">
                <h1 className="text-xl font-bold text-black">AuthKit Admin</h1>
              </Link>
              <div className="hidden md:flex space-x-4">
                <Link
                  href="/admin"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-black"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/users"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
                >
                  Users
                </Link>
                <Link
                  href="/admin/sessions"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
                >
                  Sessions
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost">Back to Dashboard</Button>
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
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-black">Admin Dashboard</h2>
            <p className="mt-1 text-sm text-gray-600">
              Overview of user activity and system statistics
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            </div>
          ) : stats ? (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="bg-white border border-black/20 rounded-lg px-4 py-5">
                  <div className="text-sm font-medium text-gray-600 truncate">Total Users</div>
                  <div className="mt-1 text-3xl font-semibold text-black">{stats.totalUsers}</div>
                </div>

                <div className="bg-white border border-black/20 rounded-lg px-4 py-5">
                  <div className="text-sm font-medium text-gray-600 truncate">Verified Users</div>
                  <div className="mt-1 text-3xl font-semibold text-black">{stats.verifiedUsers}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {stats.unverifiedUsers} unverified
                  </div>
                </div>

                <div className="bg-white border border-black/20 rounded-lg px-4 py-5">
                  <div className="text-sm font-medium text-gray-600 truncate">Active Sessions</div>
                  <div className="mt-1 text-3xl font-semibold text-black">{stats.activeSessions}</div>
                </div>

                <div className="bg-white border border-black/20 rounded-lg px-4 py-5">
                  <div className="text-sm font-medium text-gray-600 truncate">Locked Accounts</div>
                  <div className="mt-1 text-3xl font-semibold text-black">{stats.lockedUsers}</div>
                </div>
              </div>

              {/* New Users Stats */}
              <div className="bg-white border border-black/20 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-medium text-black mb-4">New User Registrations</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-gray-600">Today</div>
                    <div className="text-2xl font-semibold text-black mt-1">
                      {stats.newUsersToday}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">This Week</div>
                    <div className="text-2xl font-semibold text-black mt-1">
                      {stats.newUsersThisWeek}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">This Month</div>
                    <div className="text-2xl font-semibold text-black mt-1">
                      {stats.newUsersThisMonth}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-medium text-black mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Link
                    href="/admin/users"
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
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-black">Manage Users</p>
                        <p className="text-sm text-gray-600">View and manage all user accounts</p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/admin/sessions"
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
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-black">Active Sessions</p>
                        <p className="text-sm text-gray-600">Monitor and manage user sessions</p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard"
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
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-black">Back to Dashboard</p>
                        <p className="text-sm text-gray-600">Return to user dashboard</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">Failed to load statistics</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
