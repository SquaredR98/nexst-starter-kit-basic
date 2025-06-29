import { TenantTheme, ThemeColors, ThemeTypography, ThemeSpacing, PresetTheme, PRESET_THEMES } from '@/types/theme';

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

// Light theme colors
const lightColors: ThemeColors = {
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
};

// Dark theme colors
const darkColors: ThemeColors = {
  primary: 'hsl(217, 91%, 60%)',
  'primary-foreground': 'hsl(222, 84%, 5%)',
  secondary: 'hsl(217, 33%, 17%)',
  'secondary-foreground': 'hsl(210, 40%, 98%)',
  accent: 'hsl(217, 33%, 17%)',
  'accent-foreground': 'hsl(210, 40%, 98%)',
  muted: 'hsl(217, 33%, 17%)',
  'muted-foreground': 'hsl(215, 20%, 65%)',
  card: 'hsl(222, 84%, 5%)',
  'card-foreground': 'hsl(210, 40%, 98%)',
  popover: 'hsl(222, 84%, 5%)',
  'popover-foreground': 'hsl(210, 40%, 98%)',
  border: 'hsl(217, 33%, 17%)',
  input: 'hsl(217, 33%, 17%)',
  ring: 'hsl(217, 91%, 60%)',
  background: 'hsl(222, 84%, 5%)',
  foreground: 'hsl(210, 40%, 98%)',
  destructive: 'hsl(0, 62%, 55%)',
  'destructive-foreground': 'hsl(210, 40%, 98%)',
  warning: 'hsl(48, 96%, 53%)',
  'warning-foreground': 'hsl(20, 14%, 4%)',
  success: 'hsl(142, 71%, 45%)',
  'success-foreground': 'hsl(144, 61%, 20%)',
  info: 'hsl(199, 89%, 48%)',
  'info-foreground': 'hsl(215, 28%, 17%)',
};

// Preset theme definitions
export const defaultThemes: Record<PresetTheme, Omit<TenantTheme, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>> = {
  [PRESET_THEMES.DEFAULT]: {
    themeName: 'Default',
    colors: lightColors,
    typography: baseTypography,
    spacing: baseSpacing,
    isDefault: true,
    isActive: true,
    version: '1.0.0',
  },
  [PRESET_THEMES.DARK]: {
    themeName: 'Dark',
    colors: darkColors,
    typography: baseTypography,
    spacing: baseSpacing,
    isDefault: false,
    isActive: true,
    version: '1.0.0',
  },
  [PRESET_THEMES.BLUE]: {
    themeName: 'Ocean Blue',
    colors: {
      ...lightColors,
      ...generateColorVariants('#0EA5E9'),
    },
    typography: baseTypography,
    spacing: baseSpacing,
    isDefault: false,
    isActive: true,
    version: '1.0.0',
  },
  [PRESET_THEMES.GREEN]: {
    themeName: 'Forest Green',
    colors: {
      ...lightColors,
      ...generateColorVariants('#10B981'),
    },
    typography: baseTypography,
    spacing: baseSpacing,
    isDefault: false,
    isActive: true,
    version: '1.0.0',
  },
  [PRESET_THEMES.PURPLE]: {
    themeName: 'Royal Purple',
    colors: {
      ...lightColors,
      ...generateColorVariants('#8B5CF6'),
    },
    typography: baseTypography,
    spacing: baseSpacing,
    isDefault: false,
    isActive: true,
    version: '1.0.0',
  },
  [PRESET_THEMES.CORPORATE]: {
    themeName: 'Corporate',
    colors: {
      ...lightColors,
      primary: 'hsl(215, 25%, 27%)',
      'primary-foreground': 'hsl(210, 40%, 98%)',
      secondary: 'hsl(215, 25%, 85%)',
      'secondary-foreground': 'hsl(215, 25%, 25%)',
      accent: 'hsl(215, 25%, 82%)',
      'accent-foreground': 'hsl(215, 25%, 25%)',
    },
    typography: {
      ...baseTypography,
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'Consolas', 'monospace'],
        display: ['Roboto', 'system-ui', 'sans-serif'],
      },
    },
    spacing: {
      ...baseSpacing,
      borderRadius: {
        ...baseSpacing.borderRadius,
        base: '0.125rem',
        md: '0.25rem',
        lg: '0.375rem',
      },
    },
    isDefault: false,
    isActive: true,
    version: '1.0.0',
  },
  [PRESET_THEMES.MINIMAL]: {
    themeName: 'Minimal',
    colors: {
      ...lightColors,
      primary: 'hsl(0, 0%, 9%)',
      'primary-foreground': 'hsl(0, 0%, 98%)',
      secondary: 'hsl(0, 0%, 96%)',
      'secondary-foreground': 'hsl(0, 0%, 9%)',
      accent: 'hsl(0, 0%, 93%)',
      'accent-foreground': 'hsl(0, 0%, 9%)',
      border: 'hsl(0, 0%, 89%)',
      input: 'hsl(0, 0%, 89%)',
    },
    typography: {
      ...baseTypography,
      fontFamily: {
        sans: ['SF Pro Display', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Consolas', 'monospace'],
        display: ['SF Pro Display', 'system-ui', 'sans-serif'],
      },
    },
    spacing: {
      ...baseSpacing,
      borderRadius: {
        none: '0',
        sm: '0.25rem',
        base: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        full: '9999px',
      },
    },
    isDefault: false,
    isActive: true,
    version: '1.0.0',
  },
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
  Object.keys(lightColors).forEach(key => {
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
  baseTheme: PresetTheme = PRESET_THEMES.DEFAULT
): Omit<TenantTheme, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'> {
  const base = defaultThemes[baseTheme];
  const colorVariants = generateColorVariants(primaryColor);

  return {
    ...base,
    themeName,
    colors: {
      ...base.colors,
      ...colorVariants,
    },
    isDefault: false,
    version: '1.0.0',
  };
} 

export { PRESET_THEMES } from '@/types/theme';