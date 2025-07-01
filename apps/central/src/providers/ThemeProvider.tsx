'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { TenantTheme, TenantCustomization, ThemeContextType } from '@/types/theme';
import { defaultThemes, applyThemeToDocument, removeThemeFromDocument, PRESET_THEMES } from '@/lib/theme/theme-utils';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { data: session } = useSession();
  const [theme, setThemeState] = useState<TenantTheme | null>(null);
  const [customization, setCustomizationState] = useState<TenantCustomization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  // Initialize theme and customization
  useEffect(() => {
    async function loadThemeAndCustomization() {
      if (!session?.user?.organizationId) {
        // Load default theme for unauthenticated users
        const defaultTheme = createDefaultTheme();
        setThemeState(defaultTheme);
        applyThemeToDocument(defaultTheme);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(undefined);

        // Load tenant theme and customization
        const [themeResponse, customizationResponse] = await Promise.all([
          fetch(`/api/tenant/theme`),
          fetch(`/api/tenant/customization`)
        ]);

        let loadedTheme: TenantTheme;
        let loadedCustomization: TenantCustomization;

        if (themeResponse.ok) {
          loadedTheme = await themeResponse.json();
        } else {
          // Create default theme for the tenant
          loadedTheme = createDefaultTheme(session.user.organizationId);
        }

        if (customizationResponse.ok) {
          loadedCustomization = await customizationResponse.json();
        } else {
          // Create default customization for the tenant
          loadedCustomization = createDefaultCustomization(session.user.organizationId);
        }

        setThemeState(loadedTheme);
        setCustomizationState(loadedCustomization);
        applyThemeToDocument(loadedTheme);

      } catch (err) {
        console.error('Failed to load theme and customization:', err);
        setError('Failed to load theme configuration');
        
        // Fallback to default theme
        const fallbackTheme = createDefaultTheme(session?.user?.organizationId);
        setThemeState(fallbackTheme);
        applyThemeToDocument(fallbackTheme);
      } finally {
        setIsLoading(false);
      }
    }

    loadThemeAndCustomization();
  }, [session?.user?.organizationId]);

  // Clean up theme on unmount
  useEffect(() => {
    return () => {
      removeThemeFromDocument();
    };
  }, []);

  const setTheme = async (themeUpdate: Partial<TenantTheme>): Promise<void> => {
    if (!session?.user?.organizationId || !theme) {
      throw new Error('No organization context or theme available');
    }

    try {
      const updatedTheme = { ...theme, ...themeUpdate };
      
      const response = await fetch('/api/tenant/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTheme),
      });

      if (!response.ok) {
        throw new Error('Failed to update theme');
      }

      const savedTheme = await response.json();
      setThemeState(savedTheme);
      applyThemeToDocument(savedTheme);
    } catch (err) {
      console.error('Failed to update theme:', err);
      throw new Error('Failed to update theme');
    }
  };

  const updateCustomization = async (customizationUpdate: Partial<TenantCustomization>): Promise<void> => {
    if (!session?.user?.organizationId || !customization) {
      throw new Error('No organization context or customization available');
    }

    try {
      const updatedCustomization = { ...customization, ...customizationUpdate };
      
      const response = await fetch('/api/tenant/customization', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCustomization),
      });

      if (!response.ok) {
        throw new Error('Failed to update customization');
      }

      const savedCustomization = await response.json();
      setCustomizationState(savedCustomization);
    } catch (err) {
      console.error('Failed to update customization:', err);
      throw new Error('Failed to update customization');
    }
  };

  const resetToDefault = async (): Promise<void> => {
    if (!session?.user?.organizationId) {
      throw new Error('No organization context');
    }

    try {
      const response = await fetch('/api/tenant/theme/reset', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reset theme');
      }

      const { theme: resetTheme, customization: resetCustomization } = await response.json();
      setThemeState(resetTheme);
      setCustomizationState(resetCustomization);
      applyThemeToDocument(resetTheme);
    } catch (err) {
      console.error('Failed to reset theme:', err);
      throw new Error('Failed to reset theme');
    }
  };

  // Provide default values if theme or customization is not loaded
  const contextValue: ThemeContextType = {
    theme: theme || createDefaultTheme(session?.user?.organizationId),
    customization: customization || createDefaultCustomization(session?.user?.organizationId),
    setTheme,
    updateCustomization,
    resetToDefault,
    isLoading,
    error,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Helper functions to create default configurations
function createDefaultTheme(organizationId?: string): TenantTheme {
  const defaultThemeConfig = defaultThemes[PRESET_THEMES.DEFAULT];
  
  return {
    id: 'default',
    organizationId: organizationId || 'default',
    ...defaultThemeConfig,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createDefaultCustomization(organizationId?: string): TenantCustomization {
  return {
    id: 'default',
    organizationId: organizationId || 'default',
    branding: {
      primaryColor: '#3B82F6',
      secondaryColor: '#64748B',
      accentColor: '#F59E0B',
      fontFamily: 'Inter',
      theme: 'light',
    },
    dashboard: {
      layout: 'grid',
      widgets: [],
      defaultView: 'dashboard',
      quickActions: [
        {
          id: 'new-customer',
          label: 'New Customer',
          icon: 'UserPlus',
          action: '/customers/new',
          color: 'primary',
          isVisible: true,
          requiresPermission: 'customers:create',
        },
        {
          id: 'new-transaction',
          label: 'New Transaction',
          icon: 'Plus',
          action: '/transactions/new',
          color: 'success',
          isVisible: true,
          requiresPermission: 'transactions:create',
        },
        {
          id: 'gst-returns',
          label: 'GST Returns',
          icon: 'FileText',
          action: '/gst/returns',
          color: 'warning',
          isVisible: true,
          requiresPermission: 'gst:read',
        },
      ],
      showWelcomeCard: true,
      showRecentActivity: true,
      compactMode: false,
    },
    customFields: {
      customers: [],
      products: [],
      transactions: [],
      suppliers: [],
    },
    workflows: {
      approvals: [],
      notifications: [],
      automations: [],
    },
    preferences: {
      dateFormat: 'DD/MM/YYYY',
      numberFormat: {
        decimalSeparator: '.',
        thousandsSeparator: ',',
        currencyPosition: 'before',
        negativeFormat: 'minus',
      },
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      language: 'en',
      theme: 'light',
      compactMode: false,
      showAnimations: true,
    },
    version: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Theme utilities hook
export function useThemeUtils() {
  const { theme, setTheme } = useTheme();

  const applyPresetTheme = async (presetTheme: keyof typeof PRESET_THEMES) => {
    const presetConfig = defaultThemes[PRESET_THEMES[presetTheme]];
    await setTheme({
      ...presetConfig,
      themeName: presetConfig.themeName,
    });
  };

  const updateColors = async (colors: Partial<typeof theme.colors>) => {
    await setTheme({
      colors: {
        ...theme.colors,
        ...colors,
      },
    });
  };

  const updateTypography = async (typography: Partial<typeof theme.typography>) => {
    await setTheme({
      typography: {
        ...theme.typography,
        ...typography,
      },
    });
  };

  const updateSpacing = async (spacing: Partial<typeof theme.spacing>) => {
    await setTheme({
      spacing: {
        ...theme.spacing,
        ...spacing,
      },
    });
  };

  return {
    applyPresetTheme,
    updateColors,
    updateTypography,
    updateSpacing,
    currentTheme: theme,
  };
} 