'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface MigrationStatus {
  tenantId: string;
  organizationName: string;
  currentVersion: string;
  pendingMigrations: string[];
  lastMigration?: Date;
  status: 'up_to_date' | 'pending' | 'failed' | 'migrating';
  databaseStatus: 'connected' | 'disconnected' | 'error';
}

interface MigrationResult {
  success: boolean;
  tenantId: string;
  migrationId: string;
  backupPath?: string;
  error?: string;
  duration: number;
  timestamp: Date;
}

export default function MigrationManagementPage() {
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [migrationResults, setMigrationResults] = useState<MigrationResult[]>([]);

  useEffect(() => {
    loadMigrationStatus();
  }, []);

  const loadMigrationStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/super-admin/migrations/status');
      if (response.ok) {
        const data = await response.json();
        setMigrationStatus(data);
      }
    } catch (error) {
      console.error('Failed to load migration status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkMigration = async () => {
    if (selectedTenants.length === 0) return;

    setIsMigrating(true);
    try {
      const response = await fetch('/api/super-admin/migrations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantIds: selectedTenants }),
      });

      if (response.ok) {
        const results = await response.json();
        setMigrationResults(results);
        await loadMigrationStatus(); // Refresh status
      }
    } catch (error) {
      console.error('Bulk migration failed:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleRollback = async (tenantId: string) => {
    try {
      const response = await fetch(`/api/super-admin/migrations/${tenantId}/rollback`, {
        method: 'POST',
      });

      if (response.ok) {
        await loadMigrationStatus(); // Refresh status
      }
    } catch (error) {
      console.error('Rollback failed:', error);
    }
  };

  const handleSelectAll = () => {
    if (selectedTenants.length === migrationStatus.length) {
      setSelectedTenants([]);
    } else {
      setSelectedTenants(migrationStatus.map(t => t.tenantId));
    }
  };

  const handleSelectTenant = (tenantId: string) => {
    setSelectedTenants(prev => 
      prev.includes(tenantId) 
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up_to_date': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'migrating': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDatabaseStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'disconnected': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Migration Management</h1>
          <p className="text-gray-600">Manage tenant database migrations and backups</p>
        </div>

        {/* Action Bar */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={handleSelectAll}
                  disabled={isMigrating}
                >
                  {selectedTenants.length === migrationStatus.length ? 'Deselect All' : 'Select All'}
                </Button>
                <span className="text-sm text-gray-600">
                  {selectedTenants.length} of {migrationStatus.length} tenants selected
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={loadMigrationStatus}
                  disabled={isMigrating}
                >
                  Refresh
                </Button>
                <Button
                  variant="primary"
                  onClick={handleBulkMigration}
                  disabled={selectedTenants.length === 0 || isMigrating}
                >
                  {isMigrating ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Migrating...
                    </>
                  ) : (
                    'Run Migration'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Migration Status Table */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Tenant Migration Status</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedTenants.length === migrationStatus.length && migrationStatus.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Version
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Migration Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Database Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Migration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {migrationStatus.map((tenant) => (
                    <tr key={tenant.tenantId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedTenants.includes(tenant.tenantId)}
                          onChange={() => handleSelectTenant(tenant.tenantId)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {tenant.organizationName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {tenant.tenantId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tenant.currentVersion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tenant.status)}`}>
                          {tenant.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDatabaseStatusColor(tenant.databaseStatus)}`}>
                          {tenant.databaseStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tenant.lastMigration 
                          ? new Date(tenant.lastMigration).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRollback(tenant.tenantId)}
                            disabled={isMigrating}
                          >
                            Rollback
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectTenant(tenant.tenantId)}
                            disabled={isMigrating}
                          >
                            View Logs
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Migration Results */}
        {migrationResults.length > 0 && (
          <Card className="mt-6">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Migration Results</h3>
              <div className="space-y-3">
                {migrationResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {result.success ? '✅ Success' : '❌ Failed'} - {result.tenantId}
                        </div>
                        <div className="text-sm text-gray-600">
                          Duration: {result.duration}ms | {new Date(result.timestamp).toLocaleString()}
                        </div>
                        {result.error && (
                          <div className="text-sm text-red-600 mt-1">
                            Error: {result.error}
                          </div>
                        )}
                        {result.backupPath && (
                          <div className="text-sm text-gray-600 mt-1">
                            Backup: {result.backupPath}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
} 