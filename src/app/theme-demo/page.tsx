'use client';

import { useTheme } from '@/providers/ThemeProvider';
import { useFont, AVAILABLE_FONTS } from '@/providers/FontProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function ThemeDemoPage() {
  const { theme, isLoading } = useTheme();
  const { 
    primaryFont, 
    headingFont, 
    bodyFont, 
    setPrimaryFont, 
    setHeadingFont, 
    setBodyFont,
    getFontVariable,
    resetFonts
  } = useFont();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground font-heading">Theme & Font System Demo</h1>
          <p className="text-muted-foreground text-lg font-body">
            Showcasing the customizable ERP theme and typography system
          </p>
        </div>

        {/* Font System Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Font System Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Typography Settings</h3>
                <Button variant="outline" onClick={resetFonts} size="sm">
                  Reset Fonts
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Primary Font */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Primary Font</h4>
                  <div className="space-y-1">
                    {AVAILABLE_FONTS.slice(0, 4).map((font) => (
                      <button
                        key={font.id}
                        onClick={() => setPrimaryFont(font.id)}
                        className={`w-full p-2 text-left text-sm border rounded transition-all ${
                          primaryFont === font.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                        style={{ fontFamily: font.variable }}
                      >
                        {font.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Heading Font */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Heading Font</h4>
                  <div className="space-y-1">
                    {AVAILABLE_FONTS.slice(0, 4).map((font) => (
                      <button
                        key={font.id}
                        onClick={() => setHeadingFont(font.id)}
                        className={`w-full p-2 text-left text-sm border rounded transition-all ${
                          headingFont === font.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                        style={{ fontFamily: font.variable }}
                      >
                        {font.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Body Font */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Body Font</h4>
                  <div className="space-y-1">
                    {AVAILABLE_FONTS.slice(0, 4).map((font) => (
                      <button
                        key={font.id}
                        onClick={() => setBodyFont(font.id)}
                        className={`w-full p-2 text-left text-sm border rounded transition-all ${
                          bodyFont === font.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                        style={{ fontFamily: font.variable }}
                      >
                        {font.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Typography Preview */}
              <div className="border rounded-lg p-4 bg-card/50">
                <h4 className="text-sm font-medium mb-3">Live Typography Preview</h4>
                <div className="space-y-3">
                  <div style={{ fontFamily: getFontVariable(headingFont) }}>
                    <h2 className="text-2xl font-bold">Sample Heading</h2>
                    <h3 className="text-lg font-semibold">Subheading Example</h3>
                  </div>
                  <div style={{ fontFamily: getFontVariable(bodyFont) }}>
                    <p className="text-base">
                      This is body text demonstrating the selected font. The quick brown fox jumps over the lazy dog.
                    </p>
                  </div>
                  <div style={{ fontFamily: getFontVariable(primaryFont) }}>
                    <p className="text-sm text-muted-foreground">
                      Interface text using primary font for buttons and UI elements.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme System Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Theme System: {theme.themeName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 font-heading">Button Variants</h3>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 font-heading">Form Elements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input placeholder="Sample input" label="Sample Input" />
                  <Input placeholder="Another input" label="Another Input" />
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 font-heading">Color Palette</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  <div className="space-y-2">
                    <div className="w-full h-12 rounded bg-primary"></div>
                    <p className="text-xs font-primary">Primary</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-12 rounded bg-secondary"></div>
                    <p className="text-xs font-primary">Secondary</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-12 rounded bg-muted"></div>
                    <p className="text-xs font-primary">Muted</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-12 rounded bg-destructive"></div>
                    <p className="text-xs font-primary">Destructive</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-12 rounded bg-card border"></div>
                    <p className="text-xs font-primary">Card</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-12 rounded border border-border"></div>
                    <p className="text-xs font-primary">Border</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 