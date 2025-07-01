export interface ThemeColors {
  primary: string;
  'primary-foreground': string;
  secondary: string;
  'secondary-foreground': string;
  accent: string;
  'accent-foreground': string;
  muted: string;
  'muted-foreground': string;
  card: string;
  'card-foreground': string;
  popover: string;
  'popover-foreground': string;
  border: string;
  input: string;
  ring: string;
  background: string;
  foreground: string;
  destructive: string;
  'destructive-foreground': string;
  warning: string;
  'warning-foreground': string;
  success: string;
  'success-foreground': string;
  info: string;
  'info-foreground': string;
}

// Enhanced theme types for better customization
export interface ThemeBorder {
  radius: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
  };
  width: {
    none: string;
    thin: string;
    base: string;
    thick: string;
  };
  style: {
    solid: string;
    dashed: string;
    dotted: string;
  };
}

export interface ThemeTypography {
  fontFamily: {
    sans: string[];
    mono: string[];
    display: string[];
  };
  fontSize: {
    xs: [string, { lineHeight: string }];
    sm: [string, { lineHeight: string }];
    base: [string, { lineHeight: string }];
    lg: [string, { lineHeight: string }];
    xl: [string, { lineHeight: string }];
    '2xl': [string, { lineHeight: string }];
    '3xl': [string, { lineHeight: string }];
    '4xl': [string, { lineHeight: string }];
    '5xl': [string, { lineHeight: string }];
    '6xl': [string, { lineHeight: string }];
  };
  fontWeight: {
    thin: number;
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
    black: number;
  };
}

export interface ThemeSpacing {
  borderRadius: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
  };
  spacing: Record<string, string>;
  shadows: {
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    inner: string;
    none: string;
  };
}

// Enhanced TenantTheme with versioning and inheritance
export interface TenantTheme {
  id: string;
  organizationId: string;
  themeName: string;
  baseTheme?: string; // Inherit from preset theme
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  borders: ThemeBorder;
  customCSS?: string;
  logo?: string;
  favicon?: string;
  isDefault: boolean;
  isActive: boolean;
  version: string;
  parentVersion?: string; // For inheritance tracking
  createdAt: string;
  updatedAt: string;
}

// Preset theme configuration
export interface PresetThemeConfig {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'creative' | 'minimal' | 'professional' | 'modern';
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  borders: ThemeBorder;
  preview: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  isDefault: boolean;
  isActive: boolean;
}

// Theme customization options for onboarding
export interface ThemeCustomizationOptions {
  presetThemes: PresetThemeConfig[];
  colorPalettes: {
    id: string;
    name: string;
    colors: Partial<ThemeColors>;
    preview: string;
  }[];
  borderStyles: {
    id: string;
    name: string;
    description: string;
    borders: Partial<ThemeBorder>;
  }[];
  fontOptions: {
    id: string;
    name: string;
    fontFamily: string[];
    preview: string;
  }[];
}

export interface BrandingConfig {
  logo?: string;
  favicon?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  theme: 'light' | 'dark' | 'auto';
  customCSS?: string;
}

export interface DashboardConfig {
  layout: 'grid' | 'list' | 'masonry';
  widgets: WidgetConfig[];
  defaultView: string;
  quickActions: QuickAction[];
  showWelcomeCard: boolean;
  showRecentActivity: boolean;
  compactMode: boolean;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  configuration: Record<string, unknown>;
  isVisible: boolean;
  isLocked: boolean;
  order: number;
}

export type WidgetType = 
  | 'gst-summary'
  | 'revenue-chart'
  | 'expense-chart' 
  | 'recent-transactions'
  | 'pending-invoices'
  | 'cash-flow'
  | 'top-customers'
  | 'inventory-alerts'
  | 'gst-compliance'
  | 'quick-stats'
  | 'activity-feed'
  | 'calendar-events'
  | 'custom-kpi';

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  action: string;
  color?: string;
  isVisible: boolean;
  requiresPermission?: string;
}

export interface CustomFieldConfig {
  customers: CustomField[];
  products: CustomField[];
  transactions: CustomField[];
  suppliers: CustomField[];
}

export interface CustomField {
  id: string;
  entityType: 'customer' | 'product' | 'transaction' | 'supplier';
  fieldName: string;
  fieldLabel: string;
  fieldType: CustomFieldType;
  isRequired: boolean;
  isVisible: boolean;
  isEditable: boolean;
  validationRules: ValidationRules;
  defaultValue?: string;
  displayOrder: number;
  groupName?: string;
  helpText?: string;
  placeholder?: string;
}

export type CustomFieldType = 
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'dropdown'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'textarea'
  | 'url'
  | 'email'
  | 'phone'
  | 'currency'
  | 'percentage';

export interface ValidationRules {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  options?: Array<{ value: string; label: string }>;
  allowedExtensions?: string[];
  maxFileSize?: number;
  required?: boolean;
}

export interface WorkflowConfig {
  approvals: ApprovalWorkflow[];
  notifications: NotificationWorkflow[];
  automations: AutomationWorkflow[];
}

export interface ApprovalWorkflow {
  id: string;
  workflowName: string;
  entityType: string;
  triggerConditions: TriggerCondition[];
  approvalSteps: ApprovalStep[];
  isActive: boolean;
  priority: number;
}

export interface NotificationWorkflow {
  id: string;
  workflowName: string;
  entityType: string;
  triggerConditions: TriggerCondition[];
  notifications: NotificationAction[];
  isActive: boolean;
  priority: number;
}

export interface AutomationWorkflow {
  id: string;
  workflowName: string;
  entityType: string;
  triggerConditions: TriggerCondition[];
  actions: AutomationAction[];
  isActive: boolean;
  priority: number;
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with' | 'ends_with';
  value: string;
  logicalOperator?: 'AND' | 'OR';
}

export interface ApprovalStep {
  stepName: string;
  approvers: string[]; // User IDs
  requiredApprovals: number;
  allowDelegation: boolean;
  timeoutDays?: number;
  escalationUsers?: string[];
}

export interface NotificationAction {
  type: 'email' | 'sms' | 'push' | 'system';
  recipients: string[];
  template: string;
  variables: Record<string, string>;
}

export interface AutomationAction {
  type: 'field_update' | 'create_record' | 'send_email' | 'api_call' | 'calculation';
  configuration: Record<string, unknown>;
}

export interface UserPreferences {
  dateFormat: string;
  numberFormat: {
    decimalSeparator: '.' | ',';
    thousandsSeparator: ',' | '.' | ' ';
    currencyPosition: 'before' | 'after';
    negativeFormat: 'minus' | 'parentheses';
  };
  timezone: string;
  currency: string;
  language: string;
  theme: 'light' | 'dark' | 'auto';
  compactMode: boolean;
  showAnimations: boolean;
}

export interface TenantCustomization {
  id: string;
  organizationId: string;
  branding: BrandingConfig;
  dashboard: DashboardConfig;
  customFields: CustomFieldConfig;
  workflows: WorkflowConfig;
  preferences: UserPreferences;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Theme context and provider types
export interface ThemeContextType {
  theme: TenantTheme;
  customization: TenantCustomization;
  setTheme: (theme: Partial<TenantTheme>) => Promise<void>;
  updateCustomization: (customization: Partial<TenantCustomization>) => Promise<void>;
  resetToDefault: () => Promise<void>;
  isLoading: boolean;
  error?: string;
}

// Component variant types for theming
export interface ComponentVariants {
  button: {
    default: string;
    destructive: string;
    outline: string;
    secondary: string;
    ghost: string;
    link: string;
  };
  input: {
    default: string;
    error: string;
    success: string;
  };
  card: {
    default: string;
    elevated: string;
    outlined: string;
  };
}

// Export preset themes
export const PRESET_THEMES = {
  DEFAULT: 'default',
  DARK: 'dark',
  BLUE: 'blue',
  GREEN: 'green',
  PURPLE: 'purple',
  CORPORATE: 'corporate',
  MINIMAL: 'minimal',
} as const;

export type PresetTheme = typeof PRESET_THEMES[keyof typeof PRESET_THEMES]; 