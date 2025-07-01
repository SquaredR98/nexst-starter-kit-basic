'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PRESET_THEME_CONFIGS, THEME_CUSTOMIZATION_OPTIONS } from '@/lib/theme/theme-utils';
import { Alert } from '@/components/ui/Alert';

interface OnboardingData {
  organizationName: string;
  contactEmail: string;
  contactPhone: string;
  businessType: string;
  gstNumber?: string;
  theme: {
    presetId: string;
    colorPalette: string;
    borderStyle: string;
    fontOption: string;
  };
}

const ONBOARDING_STEPS = [
  { id: 'welcome', title: 'Welcome', description: 'Let\'s get you started' },
  { id: 'organization', title: 'Organization', description: 'Tell us about your business' },
  { id: 'theme', title: 'Customize', description: 'Choose your brand style' },
  { id: 'review', title: 'Review', description: 'Review and complete setup' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    organizationName: '',
    contactEmail: '',
    contactPhone: '',
    businessType: '',
    gstNumber: '',
    theme: {
      presetId: 'default',
      colorPalette: 'blue',
      borderStyle: 'rounded',
      fontOption: 'inter',
    },
  });

  const [previewTheme, setPreviewTheme] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Update preview when theme changes
  useEffect(() => {
    const selectedPreset = PRESET_THEME_CONFIGS[formData.theme.presetId];
    const selectedColors = THEME_CUSTOMIZATION_OPTIONS.colorPalettes.find(
      c => c.id === formData.theme.colorPalette
    );
    const selectedBorders = THEME_CUSTOMIZATION_OPTIONS.borderStyles.find(
      b => b.id === formData.theme.borderStyle
    );
    const selectedFont = THEME_CUSTOMIZATION_OPTIONS.fontOptions.find(
      f => f.id === formData.theme.fontOption
    );

    if (selectedPreset && selectedColors && selectedBorders && selectedFont) {
      setPreviewTheme({
        ...selectedPreset,
        colors: { ...selectedPreset.colors, ...selectedColors.colors },
        borders: { ...selectedPreset.borders, ...selectedBorders.borders },
        typography: {
          ...selectedPreset.typography,
          fontFamily: {
            ...selectedPreset.typography.fontFamily,
            sans: selectedFont.fontFamily,
          },
        },
      });
    }
  }, [formData.theme]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const { tenantId } = await response.json();
        setSuccess('Onboarding complete! Redirecting...');
        setTimeout(() => router.push(`/dashboard?welcome=true`), 1500);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to complete onboarding');
      }
    } catch (error) {
      setError('Unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetTheme = () => {
    setFormData(prev => ({
      ...prev,
      theme: {
        presetId: 'default',
        colorPalette: 'blue',
        borderStyle: 'rounded',
        fontOption: 'inter',
      },
    }));
  };

  const updateFormData = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...((prev[parent as keyof OnboardingData] ?? {}) as object), [child]: value },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep />;
      case 1:
        return <OrganizationStep formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <ThemeStep formData={formData} updateFormData={updateFormData} previewTheme={previewTheme} />;
      case 3:
        return <ReviewStep formData={formData} previewTheme={previewTheme} />;
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true;
      case 1:
        return (
          !!formData.organizationName &&
          !!formData.contactEmail &&
          !!formData.businessType &&
          /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.contactEmail)
        );
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {ONBOARDING_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index <= currentStep 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  {index < currentStep ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < ONBOARDING_STEPS.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {ONBOARDING_STEPS[currentStep].title}
            </h2>
            <p className="text-gray-600 mt-1">
              {ONBOARDING_STEPS[currentStep].description}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <div className="p-8">
            {error && <Alert type="error" message={error} className="mb-4" />}
            {success && <Alert type="success" message={success} className="mb-4" />}
            {renderStep()}
            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0 || isLoading}>
                Previous
              </Button>
              <div className="flex space-x-2">
                {currentStep === 2 && (
                  <Button variant="outline" onClick={resetTheme} disabled={isLoading}>
                    Reset Theme
                  </Button>
                )}
                {currentStep < ONBOARDING_STEPS.length - 1 && (
                  <Button variant="primary" onClick={handleNext} disabled={!canProceed() || isLoading}>
                    Next
                  </Button>
                )}
                {currentStep === ONBOARDING_STEPS.length - 1 && (
                  <Button variant="primary" onClick={handleComplete} disabled={isLoading}>
                    {isLoading ? <LoadingSpinner size="small" /> : 'Complete Setup'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Step Components
function WelcomeStep() {
  return (
    <div className="text-center space-y-6">
      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Your ERP System
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Let's set up your workspace in just a few steps. We'll help you configure your organization 
          and customize the look and feel to match your brand.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Organization Setup</h3>
          <p className="text-sm text-gray-600">Configure your business details and GST information</p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M15 7l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Brand Customization</h3>
          <p className="text-sm text-gray-600">Choose colors, fonts, and styling to match your brand</p>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Ready to Go</h3>
          <p className="text-sm text-gray-600">Your workspace will be ready in just a few minutes</p>
        </div>
      </div>
    </div>
  );
}

function OrganizationStep({ formData, updateFormData }: { formData: OnboardingData; updateFormData: (field: string, value: any) => void }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Organization Name *
        </label>
        <Input
          type="text"
          value={formData.organizationName}
          onChange={(e) => updateFormData('organizationName', e.target.value)}
          placeholder="Enter your organization name"
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Email *
          </label>
          <Input
            type="email"
            value={formData.contactEmail}
            onChange={(e) => updateFormData('contactEmail', e.target.value)}
            placeholder="admin@company.com"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Phone *
          </label>
          <Input
            type="tel"
            value={formData.contactPhone}
            onChange={(e) => updateFormData('contactPhone', e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Type *
        </label>
        <select
          value={formData.businessType}
          onChange={(e) => updateFormData('businessType', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select business type</option>
          <option value="manufacturing">Manufacturing</option>
          <option value="trading">Trading</option>
          <option value="services">Services</option>
          <option value="retail">Retail</option>
          <option value="wholesale">Wholesale</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          GST Number (Optional)
        </label>
        <Input
          type="text"
          value={formData.gstNumber}
          onChange={(e) => updateFormData('gstNumber', e.target.value)}
          placeholder="22ABCDE1234F1Z5"
          className="w-full"
        />
        <p className="text-sm text-gray-500 mt-1">
          You can add this later in your settings
        </p>
      </div>
    </div>
  );
}

function ThemeStep({ formData, updateFormData, previewTheme }: { 
  formData: OnboardingData; 
  updateFormData: (field: string, value: any) => void;
  previewTheme: any;
}) {
  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="flex-1">
        {/* Theme Presets */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Choose a Theme</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(PRESET_THEME_CONFIGS).map(([id, theme]) => (
              <div
                key={id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  formData.theme.presetId === id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => updateFormData('theme.presetId', id)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{theme.name}</h4>
                  {formData.theme.presetId === id && (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">{theme.description}</p>
                <div className="flex space-x-2">
                  <div 
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: theme.preview.primaryColor }}
                  />
                  <div 
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: theme.preview.secondaryColor }}
                  />
                  <div 
                    className="w-6 h-6 rounded-full border border-gray-300"
                    style={{ backgroundColor: theme.preview.accentColor }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customization Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Color Palette */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Color Palette</h4>
            <div className="space-y-2">
              {THEME_CUSTOMIZATION_OPTIONS.colorPalettes.map((palette) => (
                <div
                  key={palette.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                    formData.theme.colorPalette === palette.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => updateFormData('theme.colorPalette', palette.id)}
                >
                  <div 
                    className="w-8 h-8 rounded-full border border-gray-300 mr-3"
                    style={{ backgroundColor: palette.preview }}
                  />
                  <span className="text-sm font-medium">{palette.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Border Style */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Border Style</h4>
            <div className="space-y-2">
              {THEME_CUSTOMIZATION_OPTIONS.borderStyles.map((style) => (
                <div
                  key={style.id}
                  className={`p-3 border rounded-lg cursor-pointer ${
                    formData.theme.borderStyle === style.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => updateFormData('theme.borderStyle', style.id)}
                >
                  <div className="text-sm font-medium mb-1">{style.name}</div>
                  <div className="text-xs text-gray-600">{style.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Font Option */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Font Family</h4>
            <div className="space-y-2">
              {THEME_CUSTOMIZATION_OPTIONS.fontOptions.map((font) => (
                <div
                  key={font.id}
                  className={`p-3 border rounded-lg cursor-pointer ${
                    formData.theme.fontOption === font.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => updateFormData('theme.fontOption', font.id)}
                >
                  <div 
                    className="text-sm font-medium"
                    style={{ fontFamily: font.fontFamily.join(', ') }}
                  >
                    {font.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-md border-2 border-blue-300 rounded-xl shadow-lg p-6 bg-white">
          <div className="text-center font-semibold mb-2">Live Theme Preview</div>
          <div
            className="rounded-lg p-6"
            style={{
              background: previewTheme?.colors?.background || '#fff',
              color: previewTheme?.colors?.text || '#222',
              fontFamily: previewTheme?.typography?.fontFamily?.sans || 'Inter',
              borderRadius: (typeof previewTheme?.borders?.radius === 'string' ? previewTheme.borders.radius : '8px'),
              border: `2px ${previewTheme?.borders?.style || 'solid'} ${previewTheme?.colors?.primary || '#3B82F6'}`,
            }}
          >
            <div className="text-2xl font-bold mb-2">{previewTheme?.name || 'Theme Name'}</div>
            <div className="mb-2">Primary: <span style={{ color: previewTheme?.colors?.primary }}>{previewTheme?.colors?.primary}</span></div>
            <div className="mb-2">Secondary: <span style={{ color: previewTheme?.colors?.secondary }}>{previewTheme?.colors?.secondary}</span></div>
            <div className="mb-2">Font: {previewTheme?.typography?.fontFamily?.sans || 'Inter'}</div>
            <div className="mb-2">Border: {previewTheme?.borders?.style || 'solid'} / {previewTheme?.borders?.radius || '8px'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ formData, previewTheme }: { formData: OnboardingData; previewTheme: any }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Review Your Setup
        </h3>
        <p className="text-gray-600">
          Please review your organization details and theme selection before completing the setup.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Organization Details */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Organization Details</h4>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Organization Name:</span>
              <p className="text-gray-900">{formData.organizationName}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Contact Email:</span>
              <p className="text-gray-900">{formData.contactEmail}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Contact Phone:</span>
              <p className="text-gray-900">{formData.contactPhone}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Business Type:</span>
              <p className="text-gray-900 capitalize">{formData.businessType}</p>
            </div>
            {formData.gstNumber && (
              <div>
                <span className="text-sm font-medium text-gray-500">GST Number:</span>
                <p className="text-gray-900">{formData.gstNumber}</p>
              </div>
            )}
          </div>
        </div>

        {/* Theme Selection */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Theme Selection</h4>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Theme:</span>
              <p className="text-gray-900">{PRESET_THEME_CONFIGS[formData.theme.presetId]?.name}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Color Palette:</span>
              <p className="text-gray-900">
                {THEME_CUSTOMIZATION_OPTIONS.colorPalettes.find(c => c.id === formData.theme.colorPalette)?.name}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Border Style:</span>
              <p className="text-gray-900">
                {THEME_CUSTOMIZATION_OPTIONS.borderStyles.find(b => b.id === formData.theme.borderStyle)?.name}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Font:</span>
              <p className="text-gray-900">
                {THEME_CUSTOMIZATION_OPTIONS.fontOptions.find(f => f.id === formData.theme.fontOption)?.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final Preview */}
      {previewTheme && (
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-4">Final Preview</h4>
          <div 
            className="bg-white border rounded-lg p-6 shadow-sm"
            style={{ 
              backgroundColor: previewTheme.colors.background,
              borderColor: previewTheme.colors.border,
              borderRadius: previewTheme.borders.radius.lg,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 
                className="text-lg font-semibold"
                style={{ color: previewTheme.colors.primary }}
              >
                {formData.organizationName}
              </h3>
              <Button 
                variant="primary"
                style={{ 
                  backgroundColor: previewTheme.colors.primary,
                  color: previewTheme.colors['primary-foreground'],
                  borderRadius: previewTheme.borders.radius.base,
                }}
              >
                Get Started
              </Button>
            </div>
            <div 
              className="p-4 rounded-lg"
              style={{ 
                backgroundColor: previewTheme.colors.card,
                border: `1px solid ${previewTheme.colors.border}`,
                borderRadius: previewTheme.borders.radius.base,
              }}
            >
              <p 
                className="text-sm"
                style={{ color: previewTheme.colors['card-foreground'] }}
              >
                Welcome to your new ERP workspace! Your organization is configured and ready to use.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 