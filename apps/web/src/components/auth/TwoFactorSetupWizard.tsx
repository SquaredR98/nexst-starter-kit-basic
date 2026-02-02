'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import apiClient from '@/lib/api-client';

const verifyCodeSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits'),
});

type VerifyCodeFormData = z.infer<typeof verifyCodeSchema>;

interface TwoFactorSetupWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

type SetupStep = 'intro' | 'qr-code' | 'verify' | 'backup-codes';

interface SetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export default function TwoFactorSetupWizard({ onComplete, onCancel }: TwoFactorSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>('intro');
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backupCodesDownloaded, setBackupCodesDownloaded] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyCodeFormData>({
    resolver: zodResolver(verifyCodeSchema),
  });

  const startSetup = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<SetupData>('/2fa/setup');
      setSetupData(response.data);
      setCurrentStep('qr-code');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start 2FA setup');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async (data: VerifyCodeFormData) => {
    setIsLoading(true);
    try {
      await apiClient.post('/2fa/verify', { code: data.code });
      setCurrentStep('backup-codes');
      toast.success('2FA enabled successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    if (!setupData?.backupCodes) return;

    const codesText = setupData.backupCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'authkit-backup-codes.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setBackupCodesDownloaded(true);
    toast.success('Backup codes downloaded');
  };

  const copyBackupCodes = () => {
    if (!setupData?.backupCodes) return;

    const codesText = setupData.backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    toast.success('Backup codes copied to clipboard');
  };

  const finishSetup = () => {
    if (!backupCodesDownloaded) {
      toast.error('Please download your backup codes before finishing');
      return;
    }
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Intro Step */}
        {currentStep === 'intro' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-black mb-4">
              Enable Two-Factor Authentication
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Two-factor authentication (2FA) adds an extra layer of security to your account.
                When enabled, you'll need to enter a verification code from your authenticator app
                in addition to your password when signing in.
              </p>
              <div className="bg-gray-50 border border-black/20 rounded-lg p-4">
                <h3 className="font-semibold text-black mb-2">What you'll need:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>An authenticator app (Google Authenticator, Authy, 1Password, etc.)</li>
                  <li>Access to your current device to scan a QR code</li>
                  <li>A safe place to store backup codes</li>
                </ul>
              </div>
              <div className="bg-gray-50 border border-black/20 rounded-lg p-4">
                <h3 className="font-semibold text-black mb-2">Setup process:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Scan the QR code with your authenticator app</li>
                  <li>Enter the 6-digit code from your app to verify</li>
                  <li>Save your backup codes in a secure location</li>
                </ol>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button variant="primary" onClick={startSetup} isLoading={isLoading}>
                Get Started
              </Button>
            </div>
          </div>
        )}

        {/* QR Code Step */}
        {currentStep === 'qr-code' && setupData && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-black mb-4">Scan QR Code</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                Open your authenticator app and scan this QR code to add your account.
              </p>
              <div className="flex justify-center bg-gray-50 border border-black/20 rounded-lg p-8">
                <img
                  src={setupData.qrCode}
                  alt="2FA QR Code"
                  className="w-64 h-64"
                />
              </div>
              <div className="bg-gray-50 border border-black/20 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">
                  Can't scan the QR code? Enter this secret key manually:
                </p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-white border border-black/20 rounded px-3 py-2 text-sm font-mono text-black">
                    {setupData.secret}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(setupData.secret);
                      toast.success('Secret key copied');
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setCurrentStep('verify')}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Verify Code Step */}
        {currentStep === 'verify' && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-black mb-4">Verify Code</h2>
            <p className="text-gray-700 mb-4">
              Enter the 6-digit verification code from your authenticator app to complete the
              setup.
            </p>
            <form onSubmit={handleSubmit(verifyCode)} className="space-y-4">
              <Input
                label="Verification Code"
                type="text"
                placeholder="000000"
                maxLength={6}
                error={errors.code?.message}
                {...register('code')}
              />
              <div className="bg-gray-50 border border-black/20 rounded-lg p-4">
                <div className="flex">
                  <div className="shrink-0">
                    <svg
                      className="h-5 w-5 text-black"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-700">
                      The code refreshes every 30 seconds. If the code doesn't work, wait for a
                      new code and try again.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setCurrentStep('qr-code')}>
                  Back
                </Button>
                <Button type="submit" variant="primary" isLoading={isLoading}>
                  Verify & Enable
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Backup Codes Step */}
        {currentStep === 'backup-codes' && setupData && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-black mb-4">Save Backup Codes</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 border border-black/20 rounded-lg p-4">
                <div className="flex">
                  <div className="shrink-0">
                    <svg
                      className="h-5 w-5 text-black"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-black">Important!</h3>
                    <p className="text-sm text-gray-700 mt-1">
                      Save these backup codes in a secure location. You can use them to access
                      your account if you lose access to your authenticator app. Each code can
                      only be used once.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-black/20 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2">
                  {setupData.backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="font-mono text-sm text-black bg-gray-50 px-3 py-2 rounded"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <Button variant="outline" onClick={copyBackupCodes} className="flex-1">
                  Copy Codes
                </Button>
                <Button variant="primary" onClick={downloadBackupCodes} className="flex-1">
                  {backupCodesDownloaded ? 'Downloaded ✓' : 'Download Codes'}
                </Button>
              </div>

              {backupCodesDownloaded && (
                <div className="bg-gray-50 border border-black/20 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    ✓ Backup codes downloaded. You can now complete the setup.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={onCancel}>
                Skip for Now
              </Button>
              <Button
                variant="primary"
                onClick={finishSetup}
                disabled={!backupCodesDownloaded}
              >
                Complete Setup
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
