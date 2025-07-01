import { 
  TenantTheme, 
  ThemeColors, 
  ThemeTypography, 
  ThemeSpacing, 
  ThemeBorder,
  PresetThemeConfig,
  ThemeCustomizationOptions,
  PRESET_THEMES 
} from '@/types/theme';

// Color utility functions
export function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number, s: number;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function generateColorVariants(baseColor: string): Partial<ThemeColors> {
  // Convert hex to HSL for manipulation
  const hsl = hexToHsl(baseColor);
  const [h, s, l] = hsl.split(' ').map((val, idx) => {
    if (idx === 0) return parseInt(val);
    return parseInt(val.replace('%', ''));
  });

  return {
    primary: `hsl(${h}, ${s}%, ${l}%)`,
    'primary-foreground': `hsl(${h}, ${s}%, ${l > 50 ? 10 : 90}%)`,
    secondary: `hsl(${h}, ${Math.max(s - 20, 10)}%, ${Math.min(l + 15, 90)}%)`,
    'secondary-foreground': `hsl(${h}, ${s}%, ${l > 65 ? 15 : 85}%)`,
    accent: `hsl(${(h + 30) % 360}, ${s}%, ${l}%)`,
    'accent-foreground': `hsl(${(h + 30) % 360}, ${s}%, ${l > 50 ? 10 : 90}%)`,
  };
}

// Default theme configurations
const baseTypography: ThemeTypography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'Consolas', 'monospace'],
    display: ['Inter', 'system-ui', 'sans-serif'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
  },
  fontWeight: {
    thin: 100,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
};

const baseSpacing: ThemeSpacing = {
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: '0 0 #0000',
  },
};

const baseBorders: ThemeBorder = {
  radius: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  width: {
    none: '0',
    thin: '1px',
    base: '2px',
    thick: '3px',
  },
  style: {
    solid: 'solid',
    dashed: 'dashed',
    dotted: 'dotted',
  },
};

// Enhanced preset themes with better categorization
export const PRESET_THEME_CONFIGS: Record<string, PresetThemeConfig> = {
  default: {
    id: 'default',
    name: 'Default Blue',
    description: 'Professional blue theme for modern businesses',
    category: 'professional',
    colors: {
  primary: 'hsl(222, 84%, 55%)',
  'primary-foreground': 'hsl(210, 40%, 98%)',
  secondary: 'hsl(210, 40%, 96%)',
  'secondary-foreground': 'hsl(222, 84%, 45%)',
  accent: 'hsl(210, 40%, 93%)',
  'accent-foreground': 'hsl(222, 84%, 45%)',
  muted: 'hsl(210, 40%, 93%)',
  'muted-foreground': 'hsl(215, 16%, 47%)',
  card: 'hsl(0, 0%, 100%)',
  'card-foreground': 'hsl(222, 84%, 5%)',
  popover: 'hsl(0, 0%, 100%)',
  'popover-foreground': 'hsl(222, 84%, 5%)',
  border: 'hsl(214, 32%, 91%)',
  input: 'hsl(214, 32%, 91%)',
  ring: 'hsl(222, 84%, 55%)',
  background: 'hsl(0, 0%, 100%)',
  foreground: 'hsl(222, 84%, 5%)',
  destructive: 'hsl(0, 84%, 60%)',
  'destructive-foreground': 'hsl(210, 40%, 98%)',
  warning: 'hsl(38, 92%, 50%)',
  'warning-foreground': 'hsl(48, 96%, 89%)',
  success: 'hsl(142, 76%, 36%)',
  'success-foreground': 'hsl(138, 76%, 97%)',
  info: 'hsl(199, 89%, 48%)',
  'info-foreground': 'hsl(204, 94%, 94%)',
    },
    typography: baseTypography,
    spacing: baseSpacing,
    borders: baseBorders,
    preview: {
      primaryColor: '#3b82f6',
      secondaryColor: '#f1f5f9',
      accentColor: '#e2e8f0',
    },
    isDefault: true,
    isActive: true,
  },
  corporate: {
    id: 'corporate',
    name: 'Corporate Gray',
    description: 'Conservative gray theme for traditional businesses',
    category: 'business',
    colors: {
      primary: 'hsl(215, 25%, 27%)',
      'primary-foreground': 'hsl(210, 40%, 98%)',
      secondary: 'hsl(215, 25%, 85%)',
      'secondary-foreground': 'hsl(215, 25%, 27%)',
      accent: 'hsl(215, 25%, 90%)',
      'accent-foreground': 'hsl(215, 25%, 27%)',
      muted: 'hsl(215, 25%, 90%)',
      'muted-foreground': 'hsl(215, 16%, 47%)',
      card: 'hsl(0, 0%, 100%)',
      'card-foreground': 'hsl(215, 25%, 27%)',
      popover: 'hsl(0, 0%, 100%)',
      'popover-foreground': 'hsl(215, 25%, 27%)',
      border: 'hsl(215, 25%, 85%)',
      input: 'hsl(215, 25%, 85%)',
      ring: 'hsl(215, 25%, 27%)',
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(215, 25%, 27%)',
      destructive: 'hsl(0, 84%, 60%)',
      'destructive-foreground': 'hsl(210, 40%, 98%)',
      warning: 'hsl(38, 92%, 50%)',
      'warning-foreground': 'hsl(48, 96%, 89%)',
      success: 'hsl(142, 76%, 36%)',
      'success-foreground': 'hsl(138, 76%, 97%)',
      info: 'hsl(199, 89%, 48%)',
      'info-foreground': 'hsl(204, 94%, 94%)',
    },
    typography: baseTypography,
    spacing: baseSpacing,
    borders: baseBorders,
    preview: {
      primaryColor: '#374151',
      secondaryColor: '#d1d5db',
      accentColor: '#e5e7eb',
    },
    isDefault: false,
    isActive: true,
  },
  modern: {
    id: 'modern',
    name: 'Modern Purple',
    description: 'Contemporary purple theme for innovative companies',
    category: 'modern',
    colors: {
      primary: 'hsl(262, 83%, 58%)',
      'primary-foreground': 'hsl(210, 40%, 98%)',
      secondary: 'hsl(262, 83%, 95%)',
      'secondary-foreground': 'hsl(262, 83%, 45%)',
      accent: 'hsl(262, 83%, 90%)',
      'accent-foreground': 'hsl(262, 83%, 45%)',
      muted: 'hsl(262, 83%, 90%)',
      'muted-foreground': 'hsl(262, 16%, 47%)',
      card: 'hsl(0, 0%, 100%)',
      'card-foreground': 'hsl(262, 83%, 5%)',
      popover: 'hsl(0, 0%, 100%)',
      'popover-foreground': 'hsl(262, 83%, 5%)',
      border: 'hsl(262, 32%, 91%)',
      input: 'hsl(262, 32%, 91%)',
      ring: 'hsl(262, 83%, 58%)',
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(262, 83%, 5%)',
      destructive: 'hsl(0, 84%, 60%)',
      'destructive-foreground': 'hsl(210, 40%, 98%)',
      warning: 'hsl(38, 92%, 50%)',
      'warning-foreground': 'hsl(48, 96%, 89%)',
      success: 'hsl(142, 76%, 36%)',
      'success-foreground': 'hsl(138, 76%, 97%)',
      info: 'hsl(199, 89%, 48%)',
      'info-foreground': 'hsl(204, 94%, 94%)',
    },
    typography: baseTypography,
    spacing: baseSpacing,
    borders: baseBorders,
    preview: {
      primaryColor: '#8b5cf6',
      secondaryColor: '#f3f4f6',
      accentColor: '#e9d5ff',
    },
    isDefault: false,
    isActive: true,
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal Clean',
    description: 'Clean and minimal theme for focused work',
    category: 'minimal',
    colors: {
      primary: 'hsl(0, 0%, 9%)',
      'primary-foreground': 'hsl(0, 0%, 98%)',
      secondary: 'hsl(0, 0%, 96%)',
      'secondary-foreground': 'hsl(0, 0%, 9%)',
      accent: 'hsl(0, 0%, 94%)',
      'accent-foreground': 'hsl(0, 0%, 9%)',
      muted: 'hsl(0, 0%, 94%)',
      'muted-foreground': 'hsl(0, 0%, 45%)',
      card: 'hsl(0, 0%, 100%)',
      'card-foreground': 'hsl(0, 0%, 9%)',
      popover: 'hsl(0, 0%, 100%)',
      'popover-foreground': 'hsl(0, 0%, 9%)',
      border: 'hsl(0, 0%, 90%)',
      input: 'hsl(0, 0%, 90%)',
      ring: 'hsl(0, 0%, 9%)',
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(0, 0%, 9%)',
      destructive: 'hsl(0, 84%, 60%)',
      'destructive-foreground': 'hsl(0, 0%, 98%)',
      warning: 'hsl(38, 92%, 50%)',
      'warning-foreground': 'hsl(48, 96%, 89%)',
      success: 'hsl(142, 76%, 36%)',
      'success-foreground': 'hsl(138, 76%, 97%)',
      info: 'hsl(199, 89%, 48%)',
      'info-foreground': 'hsl(204, 94%, 94%)',
    },
    typography: baseTypography,
    spacing: baseSpacing,
    borders: baseBorders,
    preview: {
      primaryColor: '#171717',
      secondaryColor: '#f5f5f5',
      accentColor: '#e5e5e5',
    },
    isDefault: false,
    isActive: true,
  },
  creative: {
    id: 'creative',
    name: 'Creative Orange',
    description: 'Vibrant orange theme for creative agencies',
    category: 'creative',
    colors: {
      primary: 'hsl(25, 95%, 53%)',
      'primary-foreground': 'hsl(0, 0%, 98%)',
      secondary: 'hsl(25, 95%, 95%)',
      'secondary-foreground': 'hsl(25, 95%, 35%)',
      accent: 'hsl(25, 95%, 90%)',
      'accent-foreground': 'hsl(25, 95%, 35%)',
      muted: 'hsl(25, 95%, 90%)',
      'muted-foreground': 'hsl(25, 16%, 47%)',
      card: 'hsl(0, 0%, 100%)',
      'card-foreground': 'hsl(25, 95%, 5%)',
      popover: 'hsl(0, 0%, 100%)',
      'popover-foreground': 'hsl(25, 95%, 5%)',
      border: 'hsl(25, 32%, 91%)',
      input: 'hsl(25, 32%, 91%)',
      ring: 'hsl(25, 95%, 53%)',
      background: 'hsl(0, 0%, 100%)',
      foreground: 'hsl(25, 95%, 5%)',
      destructive: 'hsl(0, 84%, 60%)',
      'destructive-foreground': 'hsl(0, 0%, 98%)',
      warning: 'hsl(38, 92%, 50%)',
      'warning-foreground': 'hsl(48, 96%, 89%)',
      success: 'hsl(142, 76%, 36%)',
      'success-foreground': 'hsl(138, 76%, 97%)',
      info: 'hsl(199, 89%, 48%)',
      'info-foreground': 'hsl(204, 94%, 94%)',
    },
    typography: baseTypography,
    spacing: baseSpacing,
    borders: baseBorders,
    preview: {
      primaryColor: '#f97316',
      secondaryColor: '#fef3c7',
      accentColor: '#fed7aa',
    },
    isDefault: false,
    isActive: true,
  },
};

// Theme customization options for onboarding
export const THEME_CUSTOMIZATION_OPTIONS: ThemeCustomizationOptions = {
  presetThemes: Object.values(PRESET_THEME_CONFIGS),
  colorPalettes: [
    {
      id: 'blue',
      name: 'Professional Blue',
      colors: {
        primary: 'hsl(222, 84%, 55%)',
        secondary: 'hsl(210, 40%, 96%)',
        accent: 'hsl(210, 40%, 93%)',
      },
      preview: '#3b82f6',
    },
    {
      id: 'green',
      name: 'Nature Green',
      colors: {
        primary: 'hsl(142, 76%, 36%)',
        secondary: 'hsl(138, 76%, 97%)',
        accent: 'hsl(142, 76%, 90%)',
      },
      preview: '#16a34a',
    },
    {
      id: 'purple',
      name: 'Royal Purple',
      colors: {
        primary: 'hsl(262, 83%, 58%)',
        secondary: 'hsl(262, 83%, 95%)',
        accent: 'hsl(262, 83%, 90%)',
      },
      preview: '#8b5cf6',
    },
    {
      id: 'orange',
      name: 'Creative Orange',
      colors: {
        primary: 'hsl(25, 95%, 53%)',
        secondary: 'hsl(25, 95%, 95%)',
        accent: 'hsl(25, 95%, 90%)',
      },
      preview: '#f97316',
    },
    {
      id: 'gray',
      name: 'Corporate Gray',
    colors: {
      primary: 'hsl(215, 25%, 27%)',
      secondary: 'hsl(215, 25%, 85%)',
        accent: 'hsl(215, 25%, 90%)',
      },
      preview: '#374151',
    },
  ],
  borderStyles: [
    {
      id: 'rounded',
      name: 'Rounded',
      description: 'Soft, rounded corners for a modern look',
      borders: {
        radius: {
          ...baseBorders.radius,
          base: '0.5rem',
          md: '0.75rem',
          lg: '1rem',
        },
      },
    },
    {
      id: 'sharp',
      name: 'Sharp',
      description: 'Clean, sharp corners for a professional look',
      borders: {
        radius: {
          ...baseBorders.radius,
        base: '0.125rem',
        md: '0.25rem',
        lg: '0.375rem',
      },
    },
    },
    {
      id: 'pill',
      name: 'Pill',
      description: 'Fully rounded corners for a friendly look',
      borders: {
        radius: {
          ...baseBorders.radius,
          base: '9999px',
          md: '9999px',
          lg: '9999px',
        },
      },
    },
  ],
  fontOptions: [
    {
      id: 'inter',
      name: 'Inter',
      fontFamily: ['Inter', 'system-ui', 'sans-serif'],
      preview: 'Inter',
    },
    {
      id: 'roboto',
      name: 'Roboto',
      fontFamily: ['Roboto', 'system-ui', 'sans-serif'],
      preview: 'Roboto',
    },
    {
      id: 'poppins',
      name: 'Poppins',
      fontFamily: ['Poppins', 'system-ui', 'sans-serif'],
      preview: 'Poppins',
    },
    {
      id: 'open-sans',
      name: 'Open Sans',
      fontFamily: ['Open Sans', 'system-ui', 'sans-serif'],
      preview: 'Open Sans',
    },
    {
      id: 'lato',
      name: 'Lato',
      fontFamily: ['Lato', 'system-ui', 'sans-serif'],
      preview: 'Lato',
    },
  ],
};

// Theme application utilities
export function applyThemeToDocument(theme: TenantTheme): void {
  const root = document.documentElement;
  
  // Apply CSS custom properties with --color- prefix for Tailwind v4
  Object.entries(theme.colors).forEach(([key, value]) => {
    // Convert HSL string to just the values (remove hsl() wrapper)
    const hslValues = value.replace(/hsl\(|\)/g, '');
    root.style.setProperty(`--color-${key}`, hslValues);
  });

  // Apply custom CSS if provided
  if (theme.customCSS) {
    const styleId = 'tenant-custom-css';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    
    styleElement.textContent = theme.customCSS;
  }

  // Update favicon if provided
  if (theme.favicon) {
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = theme.favicon;
    }
  }
}

export function removeThemeFromDocument(): void {
  const root = document.documentElement;
  
  // Remove all custom properties with --color- prefix
  const colorKeys = [
    'primary', 'primary-foreground', 'secondary', 'secondary-foreground',
    'accent', 'accent-foreground', 'muted', 'muted-foreground',
    'card', 'card-foreground', 'popover', 'popover-foreground',
    'border', 'input', 'ring', 'background', 'foreground',
    'destructive', 'destructive-foreground', 'warning', 'warning-foreground',
    'success', 'success-foreground', 'info', 'info-foreground'
  ];
  
  colorKeys.forEach(key => {
    root.style.removeProperty(`--color-${key}`);
  });

  // Remove custom CSS
  const customStyleElement = document.getElementById('tenant-custom-css');
  if (customStyleElement) {
    customStyleElement.remove();
  }
}

// Theme validation utilities
export function validateTheme(theme: Partial<TenantTheme>): string[] {
  const errors: string[] = [];

  if (theme.colors) {
    // Validate required color properties
    const requiredColors: (keyof ThemeColors)[] = [
      'primary', 'primary-foreground', 'background', 'foreground'
    ];

    requiredColors.forEach(color => {
      if (!theme.colors![color]) {
        errors.push(`Missing required color: ${color}`);
      }
    });

    // Validate color format (basic HSL/RGB/HEX check)
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (value && !value.match(/^(hsl|rgb|#)/)) {
        errors.push(`Invalid color format for ${key}: ${value}`);
      }
    });
  }

  if (theme.customCSS) {
    // Basic CSS validation - check for malicious content
    const dangerousPatterns = [
      /javascript:/i,
      /@import/i,
      /expression\(/i,
      /behavior:/i,
    ];

    dangerousPatterns.forEach(pattern => {
      if (pattern.test(theme.customCSS!)) {
        errors.push('Custom CSS contains potentially dangerous content');
      }
    });
  }

  return errors;
}

// Generate a complete theme from basic colors
export function generateThemeFromColors(
  primaryColor: string,
  themeName: string,
  baseThemeId: string = 'default'
): Omit<TenantTheme, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'> {
  const base = PRESET_THEME_CONFIGS[baseThemeId] || PRESET_THEME_CONFIGS.default;
  const colorVariants = generateColorVariants(primaryColor);

  return {
    themeName,
    baseTheme: baseThemeId,
    colors: {
      ...base.colors,
      ...colorVariants,
    },
    typography: base.typography,
    spacing: base.spacing,
    borders: base.borders,
    isDefault: false,
    isActive: true,
    version: '1.0.0',
  };
} 

export const defaultThemes = PRESET_THEME_CONFIGS;

export { PRESET_THEMES } from '@/types/theme';