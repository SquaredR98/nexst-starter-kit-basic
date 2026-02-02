'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import apiClient from '@/lib/api-client';
import toast from 'react-hot-toast';
import { formatDateTime } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  emailVerified: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  lockedUntil: string | null;
  profile?: {
    firstName: string | null;
    lastName: string | null;
  };
  roles: Array<{
    role: {
      id: string;
      name: string;
    };
  }>;
}

interface PaginatedUsers {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterVerified, setFilterVerified] = useState<boolean | undefined>(undefined);
  const [filterLocked, setFilterLocked] = useState<boolean | undefined>(undefined);

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
  }, [user, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [page, search, filterVerified, filterLocked, isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(filterVerified !== undefined && { emailVerified: filterVerified.toString() }),
        ...(filterLocked !== undefined && { isLocked: filterLocked.toString() }),
      });

      const response = await apiClient.get<PaginatedUsers>(`/admin/users?${params}`);
      setData(response.data);
    } catch (error: any) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!confirm('Are you sure you want to ban this user?')) return;

    try {
      await apiClient.post(`/admin/users/${userId}/ban`);
      toast.success('User banned successfully');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await apiClient.post(`/admin/users/${userId}/unban`);
      toast.success('User unbanned successfully');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to unban user');
    }
  };

  const isUserLocked = (user: User) => {
    if (!user.lockedUntil) return false;
    return new Date(user.lockedUntil) > new Date();
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
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/users"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-black"
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
            <h2 className="text-2xl font-bold text-black">User Management</h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage all user accounts and permissions
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white border border-black/20 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Input
                  label="Search"
                  placeholder="Email or name..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-black/20 rounded-md text-sm focus:outline-none focus:border-black/40"
                  value={filterVerified === undefined ? '' : filterVerified.toString()}
                  onChange={(e) => {
                    setFilterVerified(
                      e.target.value === '' ? undefined : e.target.value === 'true'
                    );
                    setPage(1);
                  }}
                >
                  <option value="">All</option>
                  <option value="true">Verified</option>
                  <option value="false">Unverified</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-black/20 rounded-md text-sm focus:outline-none focus:border-black/40"
                  value={filterLocked === undefined ? '' : filterLocked.toString()}
                  onChange={(e) => {
                    setFilterLocked(
                      e.target.value === '' ? undefined : e.target.value === 'true'
                    );
                    setPage(1);
                  }}
                >
                  <option value="">All</option>
                  <option value="false">Active</option>
                  <option value="true">Locked</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setFilterVerified(undefined);
                    setFilterLocked(undefined);
                    setPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            </div>
          ) : data && data.users.length > 0 ? (
            <>
              <div className="bg-white border border-black/20 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-black/20">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Roles
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-black/20">
                      {data.users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-black">{u.email}</div>
                              {u.profile && (u.profile.firstName || u.profile.lastName) && (
                                <div className="text-sm text-gray-600">
                                  {u.profile.firstName} {u.profile.lastName}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {u.roles.map((userRole) => (
                                <span
                                  key={userRole.role.id}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-black text-white"
                                >
                                  {userRole.role.name}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              {u.emailVerified ? (
                                <span className="inline-flex items-center text-xs text-gray-700">
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-xs text-gray-500">
                                  Unverified
                                </span>
                              )}
                              {isUserLocked(u) && (
                                <span className="block text-xs text-red-600">Locked</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDateTime(u.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <Link href={`/admin/users/${u.id}`}>
                              <button className="text-black hover:text-gray-700">View</button>
                            </Link>
                            {isUserLocked(u) ? (
                              <button
                                onClick={() => handleUnbanUser(u.id)}
                                className="text-black hover:text-gray-700"
                              >
                                Unban
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBanUser(u.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Ban
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((data.page - 1) * data.limit) + 1} to {Math.min(data.page * data.limit, data.total)} of {data.total} users
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={data.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPage(p => p + 1)}
                      disabled={data.page >= data.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white border border-black/20 rounded-lg p-12 text-center">
              <p className="text-gray-600">No users found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
