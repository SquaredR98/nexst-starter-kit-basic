'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { 
  DollarSign, 
  Users, 
  Package, 
  TrendingUp, 
  TrendingDown,
  AlertCircle
} from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
}

function KPICard({ title, value, change, changeType, icon }: KPICardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className="text-blue-600">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center">
        <div className={`flex items-center ${
          changeType === 'increase' ? 'text-green-600' : 'text-red-600'
        }`}>
          {changeType === 'increase' ? (
            <TrendingUp size={16} className="mr-1" />
          ) : (
            <TrendingDown size={16} className="mr-1" />
          )}
          <span className="text-sm font-medium">{change}</span>
        </div>
        <span className="text-sm text-gray-500 ml-2">vs last month</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const kpis = [
    {
      title: 'Total Revenue',
      value: '₹12,34,567',
      change: '+12.5%',
      changeType: 'increase' as const,
      icon: <DollarSign size={32} />
    },
    {
      title: 'Active Customers',
      value: '1,234',
      change: '+5.2%',
      changeType: 'increase' as const,
      icon: <Users size={32} />
    },
    {
      title: 'Inventory Items',
      value: '856',
      change: '-2.1%',
      changeType: 'decrease' as const,
      icon: <Package size={32} />
    },
    {
      title: 'Pending Orders',
      value: '23',
      change: '+15.3%',
      changeType: 'increase' as const,
      icon: <AlertCircle size={32} />
    }
  ];

  const recentActivities = [
    { id: 1, action: 'New order created', user: 'John Doe', time: '2 minutes ago' },
    { id: 2, action: 'Invoice #INV-001 paid', user: 'Jane Smith', time: '15 minutes ago' },
    { id: 3, action: 'Product stock updated', user: 'Mike Johnson', time: '1 hour ago' },
    { id: 4, action: 'New customer registered', user: 'Sarah Wilson', time: '2 hours ago' }
  ];

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back! Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, index) => (
            <KPICard key={index} {...kpi} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Charts Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Revenue Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Revenue Overview
              </h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                <p className="text-gray-500">Chart will be implemented here</p>
              </div>
            </div>

            {/* Sales Pipeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sales Pipeline
              </h3>
              <div className="h-48 flex items-center justify-center bg-gray-50 rounded">
                <p className="text-gray-500">Pipeline chart will be implemented here</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                  Create New Invoice
                </button>
                <button className="w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                  Add New Customer
                </button>
                <button className="w-full text-left px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors">
                  Update Inventory
                </button>
                <button className="w-full text-left px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                  Generate Report
                </button>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Activities
              </h3>
              <div className="space-y-4">
                {recentActivities.map(activity => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">
                        by {activity.user} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Alerts */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                System Alerts
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    3 products are running low on stock
                  </p>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    2 invoices are overdue
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 