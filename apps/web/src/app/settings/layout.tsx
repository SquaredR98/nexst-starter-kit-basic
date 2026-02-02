'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Profile', href: '/settings/profile', icon: 'UserIcon' },
  { name: 'Security', href: '/settings/security', icon: 'LockIcon' },
  { name: 'Connected Accounts', href: '/settings/connected-accounts', icon: 'LinkIcon' },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Bar */}
        <nav className="bg-white border-b border-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/dashboard" className="text-xl font-bold text-black">
                  AuthKit
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <Button variant="outline" onClick={logout}>
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
            {/* Sidebar Navigation */}
            <aside className="py-6 px-2 sm:px-6 lg:col-span-3 lg:py-0 lg:px-0">
              <nav className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        isActive
                          ? 'bg-black text-white hover:bg-black'
                          : 'text-black hover:bg-gray-100',
                        'group rounded-md px-3 py-2 flex items-center text-sm font-medium transition-colors'
                      )}
                    >
                      {item.icon === 'UserIcon' && (
                        <svg
                          className={cn(
                            isActive ? 'text-white' : 'text-black',
                            'shrink-0 -ml-1 mr-3 h-6 w-6'
                          )}
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
                      )}
                      {item.icon === 'LockIcon' && (
                        <svg
                          className={cn(
                            isActive ? 'text-white' : 'text-black',
                            'shrink-0 -ml-1 mr-3 h-6 w-6'
                          )}
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
                      )}
                      {item.icon === 'LinkIcon' && (
                        <svg
                          className={cn(
                            isActive ? 'text-white' : 'text-black',
                            'shrink-0 -ml-1 mr-3 h-6 w-6'
                          )}
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
                      )}
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </aside>

            {/* Main Content */}
            <div className="space-y-6 sm:px-6 lg:col-span-9 lg:px-0">{children}</div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
