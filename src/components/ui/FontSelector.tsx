'use client'

import React from 'react'
import { useFont, AVAILABLE_FONTS } from '@/providers/FontProvider'
import { Button } from './Button'

export function FontSettings() {
  const { 
    primaryFont, 
    headingFont, 
    bodyFont, 
    setPrimaryFont, 
    setHeadingFont, 
    setBodyFont,
    getFontVariable,
    resetFonts
  } = useFont()

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold">Font Settings</h2>
          <p className="text-muted-foreground">Customize typography for your organization</p>
        </div>
        <Button variant="outline" onClick={resetFonts}>
          Reset to Default
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary Font */}
        <div className="space-y-4">
          <h3 className="font-semibold">Primary Font</h3>
          <div className="space-y-2">
            {AVAILABLE_FONTS.map((font) => (
              <button
                key={font.id}
                onClick={() => setPrimaryFont(font.id)}
                className={`w-full p-3 text-left border rounded-lg transition-all ${
                  primaryFont === font.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                }`}
                style={{ fontFamily: font.variable }}
              >
                <div className="font-semibold">{font.name}</div>
                <div className="text-sm text-muted-foreground">{font.category}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Heading Font */}
        <div className="space-y-4">
          <h3 className="font-semibold">Heading Font</h3>
          <div className="space-y-2">
            {AVAILABLE_FONTS.map((font) => (
              <button
                key={font.id}
                onClick={() => setHeadingFont(font.id)}
                className={`w-full p-3 text-left border rounded-lg transition-all ${
                  headingFont === font.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                }`}
                style={{ fontFamily: font.variable }}
              >
                <div className="font-semibold">{font.name}</div>
                <div className="text-sm text-muted-foreground">{font.category}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Body Font */}
        <div className="space-y-4">
          <h3 className="font-semibold">Body Font</h3>
          <div className="space-y-2">
            {AVAILABLE_FONTS.map((font) => (
              <button
                key={font.id}
                onClick={() => setBodyFont(font.id)}
                className={`w-full p-3 text-left border rounded-lg transition-all ${
                  bodyFont === font.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:bg-muted/50'
                }`}
                style={{ fontFamily: font.variable }}
              >
                <div className="font-semibold">{font.name}</div>
                <div className="text-sm text-muted-foreground">{font.category}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="border border-border rounded-lg p-6 bg-card">
        <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
        
        <div className="space-y-4">
          <div style={{ fontFamily: getFontVariable(headingFont) }}>
            <h1 className="text-4xl font-bold">Main Heading</h1>
            <h2 className="text-2xl font-semibold">Section Title</h2>
            <h3 className="text-xl font-medium">Subsection</h3>
          </div>
          
          <div style={{ fontFamily: getFontVariable(bodyFont) }}>
            <p>
              This is body text that demonstrates how your content will look with the selected fonts. 
              The quick brown fox jumps over the lazy dog. Lorem ipsum dolor sit amet, consectetur 
              adipiscing elit.
            </p>
          </div>

          <div style={{ fontFamily: getFontVariable(primaryFont) }}>
            <p className="text-sm">
              Interface text using the primary font for buttons, navigation, and UI elements.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 