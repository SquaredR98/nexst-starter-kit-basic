'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthRegister = (provider: 'google' | 'github') => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
    window.location.href = `${apiUrl}/auth/${provider}`;
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white overflow-y-auto">
        <div className="max-w-md w-full space-y-8 py-12">
          {/* Header */}
          <div className="text-center">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-bold text-black">
                Auth Starter Kit
              </h1>
            </Link>
            <h2 className="mt-6 text-3xl font-bold text-black">
              Create your account
            </h2>
            <p className="mt-2 text-base text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-black hover:text-gray-700 transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthRegister('google')}
              className="w-full justify-center"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#4285F4"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthRegister('github')}
              className="w-full justify-center"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              Continue with GitHub
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Or continue with email</span>
            </div>
          </div>

          {/* Registration Form */}
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                type="text"
                autoComplete="given-name"
                placeholder="John"
                error={errors.firstName?.message}
                {...register('firstName')}
              />

              <Input
                label="Last name"
                type="text"
                autoComplete="family-name"
                placeholder="Doe"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>

            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm your password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900 mb-2">Password requirements:</p>
              <ul className="space-y-1 text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>At least 8 characters long</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Contains uppercase and lowercase letters</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Contains at least one number</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>Contains at least one special character</span>
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Create account
            </Button>
          </form>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 bg-black items-center justify-center p-12 sticky top-0 h-screen">
        <div className="max-w-md text-white">
          <h2 className="text-4xl font-bold mb-6">
            Start Building in Minutes
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed mb-8">
            Get instant access to a complete authentication system with user management, OAuth providers, and enterprise-grade security features.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white flex items-center justify-center mt-1">
                <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Complete Auth System</p>
                <p className="text-gray-400 text-sm">JWT, OAuth, 2FA, sessions, and more</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white flex items-center justify-center mt-1">
                <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Developer Friendly</p>
                <p className="text-gray-400 text-sm">Well-documented, type-safe APIs</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white flex items-center justify-center mt-1">
                <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Enterprise Ready</p>
                <p className="text-gray-400 text-sm">RBAC, audit logs, rate limiting</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
