'use client';

import React, { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Search, Bell, Plus, User, Settings, LogOut, ChevronDown } from 'lucide-react';

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface HeaderProps {
  onToggleSidebar: () => void;
  user: User;
}

export function Header({ onToggleSidebar, user }: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100"
          >
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User size={18} />
            </div>
            <span className="text-sm font-medium">{user.name || 'User'}</span>
            <ChevronDown size={16} />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
              <div className="py-2">
                <button className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100">
                  <Settings size={16} className="mr-3" />
                  Settings
                </button>
                <button
                  onClick={() => signOut()}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} className="mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 