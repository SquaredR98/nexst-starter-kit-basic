'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  DollarSign, 
  Package, 
  Users, 
  Factory, 
  Clipboard, 
  Settings,
  ChevronDown,
  Menu
} from 'lucide-react';
import { NavigationItem } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'LayoutDashboard',
      path: '/dashboard',
      permission: 'dashboard.read'
    },
    {
      id: 'financial',
      label: 'Financial',
      icon: 'DollarSign',
      permission: 'financial.read',
      children: [
        { id: 'accounts', label: 'Chart of Accounts', path: '/financial/accounts', permission: 'financial.accounts.read' },
        { id: 'journals', label: 'Journal Entries', path: '/financial/journals', permission: 'financial.journals.read' },
        { id: 'ledger', label: 'General Ledger', path: '/financial/ledger', permission: 'financial.ledger.read' },
        { id: 'receivables', label: 'Accounts Receivable', path: '/financial/receivables', permission: 'financial.receivables.read' },
        { id: 'payables', label: 'Accounts Payable', path: '/financial/payables', permission: 'financial.payables.read' },
        { id: 'reports', label: 'Financial Reports', path: '/financial/reports', permission: 'financial.reports.read' },
        { id: 'budget', label: 'Budget & Forecasting', path: '/financial/budget', permission: 'financial.budget.read' },
        { id: 'tax', label: 'Tax Management', path: '/financial/tax', permission: 'financial.tax.read' }
      ]
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: 'Package',
      permission: 'inventory.read',
      children: [
        { id: 'products', label: 'Product Master', path: '/inventory/products', permission: 'inventory.products.read' },
        { id: 'stock', label: 'Stock Overview', path: '/inventory/stock', permission: 'inventory.stock.read' },
        { id: 'movements', label: 'Stock Movements', path: '/inventory/movements', permission: 'inventory.movements.read' },
        { id: 'purchase', label: 'Purchase Management', path: '/inventory/purchase', permission: 'inventory.purchase.read' },
        { id: 'warehouse', label: 'Warehouse Management', path: '/inventory/warehouse', permission: 'inventory.warehouse.read' },
        { id: 'reports', label: 'Inventory Reports', path: '/inventory/reports', permission: 'inventory.reports.read' }
      ]
    },
    {
      id: 'crm',
      label: 'CRM',
      icon: 'Users',
      permission: 'crm.read',
      children: [
        { id: 'customers', label: 'Customer Management', path: '/crm/customers', permission: 'crm.customers.read' },
        { id: 'leads', label: 'Lead Management', path: '/crm/leads', permission: 'crm.leads.read' },
        { id: 'opportunities', label: 'Opportunity Pipeline', path: '/crm/opportunities', permission: 'crm.opportunities.read' },
        { id: 'communications', label: 'Communication Center', path: '/crm/communications', permission: 'crm.communications.read' },
        { id: 'reports', label: 'Sales Reports', path: '/crm/reports', permission: 'crm.reports.read' }
      ]
    },
    {
      id: 'hr',
      label: 'HR',
      icon: 'Users',
      permission: 'hr.read',
      children: [
        { id: 'employees', label: 'Employee Management', path: '/hr/employees', permission: 'hr.employees.read' },
        { id: 'attendance', label: 'Attendance & Time', path: '/hr/attendance', permission: 'hr.attendance.read' },
        { id: 'payroll', label: 'Payroll Processing', path: '/hr/payroll', permission: 'hr.payroll.read' },
        { id: 'performance', label: 'Performance Management', path: '/hr/performance', permission: 'hr.performance.read' },
        { id: 'recruitment', label: 'Recruitment', path: '/hr/recruitment', permission: 'hr.recruitment.read' }
      ]
    },
    {
      id: 'manufacturing',
      label: 'Manufacturing',
      icon: 'Factory',
      permission: 'manufacturing.read',
      children: [
        { id: 'bom', label: 'Bill of Materials', path: '/manufacturing/bom', permission: 'manufacturing.bom.read' },
        { id: 'planning', label: 'Production Planning', path: '/manufacturing/planning', permission: 'manufacturing.planning.read' },
        { id: 'workorders', label: 'Work Orders', path: '/manufacturing/workorders', permission: 'manufacturing.workorders.read' },
        { id: 'quality', label: 'Quality Control', path: '/manufacturing/quality', permission: 'manufacturing.quality.read' }
      ]
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: 'Clipboard',
      permission: 'projects.read',
      children: [
        { id: 'dashboard', label: 'Project Dashboard', path: '/projects/dashboard', permission: 'projects.dashboard.read' },
        { id: 'planning', label: 'Project Planning', path: '/projects/planning', permission: 'projects.planning.read' },
        { id: 'time', label: 'Time Tracking', path: '/projects/time', permission: 'projects.time.read' },
        { id: 'reports', label: 'Project Reports', path: '/projects/reports', permission: 'projects.reports.read' }
      ]
    },
    {
      id: 'admin',
      label: 'Administration',
      icon: 'Settings',
      permission: 'admin.read',
      children: [
        { id: 'users', label: 'User Management', path: '/admin/users', permission: 'admin.users.read' },
        { id: 'organization', label: 'Organization Settings', path: '/admin/organization', permission: 'admin.organization.read' },
        { id: 'system', label: 'System Configuration', path: '/admin/system', permission: 'admin.system.read' },
        { id: 'audit', label: 'Audit & Compliance', path: '/admin/audit', permission: 'admin.audit.read' }
      ]
    }
  ];

  const IconComponent = ({ name, size = 20 }: { name: string; size?: number }) => {
    const icons = {
      LayoutDashboard,
      DollarSign,
      Package,
      Users,
      Factory,
      Clipboard,
      Settings
    };
    
    const Icon = icons[name as keyof typeof icons];
    return Icon ? <Icon size={size} /> : null;
  };

  const isActive = (path: string) => pathname === path;

  const NavItem = ({ item, level = 0 }: { item: NavigationItem; level?: number }) => {
    const hasChildren = item.children && item.children.length > 0;
    const [isExpanded, setIsExpanded] = React.useState(false);

    if (hasChildren) {
      return (
        <div key={item.id}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`w-full flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors ${
              level > 0 ? 'pl-8' : ''
            }`}
          >
            {item.icon && <IconComponent name={item.icon} />}
            <span className={`ml-3 ${!isOpen ? 'hidden' : ''}`}>{item.label}</span>
            {isOpen && (
              <ChevronDown 
                size={16} 
                className={`ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              />
            )}
          </button>
          {isExpanded && isOpen && (
            <div className="ml-4">
              {item.children?.map(child => (
                <NavItem key={child.id} item={child} level={level + 1} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.path || '#'}
        className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
          isActive(item.path || '') 
            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        } ${level > 0 ? 'pl-8' : ''}`}
      >
        {item.icon && level === 0 && <IconComponent name={item.icon} />}
        <span className={`ml-3 ${!isOpen ? 'hidden' : ''}`}>{item.label}</span>
        {item.badge && isOpen && (
          <span className="ml-auto px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-16'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className={`flex items-center ${!isOpen ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            {isOpen && (
              <span className="ml-3 text-xl font-semibold text-gray-900">
                ERP System
              </span>
            )}
          </div>
          <button
            onClick={onToggle}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navigationItems.map(item => (
            <NavItem key={item.id} item={item} />
          ))}
        </nav>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
} 