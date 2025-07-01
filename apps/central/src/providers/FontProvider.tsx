'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type FontFamily = 
  | 'inter' 
  | 'roboto' 
  | 'open-sans' 
  | 'lato' 
  | 'poppins'
  | 'playfair'
  | 'merriweather'
  | 'crimson'

export interface FontConfig {
  id: FontFamily
  name: string
  variable: string
  category: 'sans-serif' | 'serif'
  preview: string
}

export const AVAILABLE_FONTS: FontConfig[] = [
  // Sans-serif fonts
  {
    id: 'inter',
    name: 'Inter',
    variable: 'var(--font-inter)',
    category: 'sans-serif',
    preview: 'Modern and clean interface font'
  },
  {
    id: 'roboto',
    name: 'Roboto',
    variable: 'var(--font-roboto)',
    category: 'sans-serif',
    preview: 'Google\'s signature font family'
  },
  {
    id: 'open-sans',
    name: 'Open Sans',
    variable: 'var(--font-open-sans)',
    category: 'sans-serif',
    preview: 'Friendly and readable font'
  },
  {
    id: 'lato',
    name: 'Lato',
    variable: 'var(--font-lato)',
    category: 'sans-serif',
    preview: 'Humanist sans-serif font family'
  },
  {
    id: 'poppins',
    name: 'Poppins',
    variable: 'var(--font-poppins)',
    category: 'sans-serif',
    preview: 'Geometric sans-serif with rounded edges'
  },
  // Serif fonts
  {
    id: 'playfair',
    name: 'Playfair Display',
    variable: 'var(--font-playfair)',
    category: 'serif',
    preview: 'Elegant serif for headings and display'
  },
  {
    id: 'merriweather',
    name: 'Merriweather',
    variable: 'var(--font-merriweather)',
    category: 'serif',
    preview: 'Highly readable serif for body text'
  },
  {
    id: 'crimson',
    name: 'Crimson Text',
    variable: 'var(--font-crimson)',
    category: 'serif',
    preview: 'Classic serif inspired by early printing'
  }
]

interface FontContextType {
  // Current font settings
  primaryFont: FontFamily
  headingFont: FontFamily
  bodyFont: FontFamily
  
  // Font management
  setPrimaryFont: (font: FontFamily) => void
  setHeadingFont: (font: FontFamily) => void
  setBodyFont: (font: FontFamily) => void
  resetFonts: () => void
  
  // Utilities
  getFontConfig: (fontId: FontFamily) => FontConfig | undefined
  getFontVariable: (fontId: FontFamily) => string
  applyFontsToDocument: () => void
}

const FontContext = createContext<FontContextType | undefined>(undefined)

interface FontProviderProps {
  children: ReactNode
}

const DEFAULT_FONTS = {
  primary: 'inter' as FontFamily,
  heading: 'inter' as FontFamily,
  body: 'inter' as FontFamily,
}

export function FontProvider({ children }: FontProviderProps) {
  const [primaryFont, setPrimaryFontState] = useState<FontFamily>(DEFAULT_FONTS.primary)
  const [headingFont, setHeadingFontState] = useState<FontFamily>(DEFAULT_FONTS.heading)
  const [bodyFont, setBodyFontState] = useState<FontFamily>(DEFAULT_FONTS.body)

  // Load saved font preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPrimary = localStorage.getItem('erp-primary-font') as FontFamily
      const savedHeading = localStorage.getItem('erp-heading-font') as FontFamily
      const savedBody = localStorage.getItem('erp-body-font') as FontFamily

      if (savedPrimary && AVAILABLE_FONTS.find(f => f.id === savedPrimary)) {
        setPrimaryFontState(savedPrimary)
      }
      if (savedHeading && AVAILABLE_FONTS.find(f => f.id === savedHeading)) {
        setHeadingFontState(savedHeading)
      }
      if (savedBody && AVAILABLE_FONTS.find(f => f.id === savedBody)) {
        setBodyFontState(savedBody)
      }
    }
  }, [])

  // Apply fonts to document when they change
  useEffect(() => {
    applyFontsToDocument()
  }, [primaryFont, headingFont, bodyFont])

  const setPrimaryFont = (font: FontFamily) => {
    setPrimaryFontState(font)
    if (typeof window !== 'undefined') {
      localStorage.setItem('erp-primary-font', font)
    }
  }

  const setHeadingFont = (font: FontFamily) => {
    setHeadingFontState(font)
    if (typeof window !== 'undefined') {
      localStorage.setItem('erp-heading-font', font)
    }
  }

  const setBodyFont = (font: FontFamily) => {
    setBodyFontState(font)
    if (typeof window !== 'undefined') {
      localStorage.setItem('erp-body-font', font)
    }
  }

  const resetFonts = () => {
    setPrimaryFontState(DEFAULT_FONTS.primary)
    setHeadingFontState(DEFAULT_FONTS.heading)
    setBodyFontState(DEFAULT_FONTS.body)
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('erp-primary-font')
      localStorage.removeItem('erp-heading-font')
      localStorage.removeItem('erp-body-font')
    }
  }

  const getFontConfig = (fontId: FontFamily): FontConfig | undefined => {
    return AVAILABLE_FONTS.find(font => font.id === fontId)
  }

  const getFontVariable = (fontId: FontFamily): string => {
    const config = getFontConfig(fontId)
    return config?.variable || 'var(--font-inter)'
  }

  const applyFontsToDocument = () => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement
      
      // Apply font family CSS variables
      root.style.setProperty('--font-primary', getFontVariable(primaryFont))
      root.style.setProperty('--font-heading', getFontVariable(headingFont))
      root.style.setProperty('--font-body', getFontVariable(bodyFont))
      
      // Update body font immediately
      document.body.style.fontFamily = getFontVariable(primaryFont)
    }
  }

  const value: FontContextType = {
    // Current fonts
    primaryFont,
    headingFont,
    bodyFont,
    
    // Font setters
    setPrimaryFont,
    setHeadingFont,
    setBodyFont,
    resetFonts,
    
    // Utilities
    getFontConfig,
    getFontVariable,
    applyFontsToDocument,
  }

  return (
    <FontContext.Provider value={value}>
      {children}
    </FontContext.Provider>
  )
}

export function useFont() {
  const context = useContext(FontContext)
  if (context === undefined) {
    throw new Error('useFont must be used within a FontProvider')
  }
  return context
}

// Utility hook for specific font types
export function useFontSettings() {
  const { primaryFont, headingFont, bodyFont, getFontVariable } = useFont()
  
  return {
    primaryFontFamily: getFontVariable(primaryFont),
    headingFontFamily: getFontVariable(headingFont),
    bodyFontFamily: getFontVariable(bodyFont),
  }
} 