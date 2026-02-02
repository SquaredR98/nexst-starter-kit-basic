'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-12">
              <span className="text-xl font-bold text-black">Auth Starter Kit</span>
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">Features</a>
                <a href="#security" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">Security</a>
                <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">Pricing</a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="primary" size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block px-4 py-2 bg-gray-100 rounded-full mb-6">
              <span className="text-sm font-semibold text-gray-900">Production-Ready Authentication</span>
            </div>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-black leading-tight mb-8">
              Enterprise Auth
              <span className="block text-gray-400 mt-2">in Minutes</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto mb-12">
              Skip months of development. Deploy secure, scalable authentication with OAuth, 2FA, RBAC, and session management built-in.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  Start Building Free
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  View Demo
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-500">No credit card required • Full source code included</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-black mb-2">22+</div>
              <div className="text-sm text-gray-600 font-medium">API Endpoints</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-black mb-2">7</div>
              <div className="text-sm text-gray-600 font-medium">Auth Modules</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-black mb-2">100%</div>
              <div className="text-sm text-gray-600 font-medium">Test Coverage</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-black mb-2">2min</div>
              <div className="text-sm text-gray-600 font-medium">Setup Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">Everything you need</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A complete authentication system with enterprise-grade features out of the box
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <div className="p-8 border border-gray-200 rounded-2xl hover:border-gray-900 transition-all duration-300">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-3">JWT Authentication</h3>
              <p className="text-gray-600 leading-relaxed">Secure token-based authentication with automatic refresh, access control, and session management across devices.</p>
            </div>

            <div className="p-8 border border-gray-200 rounded-2xl hover:border-gray-900 transition-all duration-300">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-3">OAuth 2.0</h3>
              <p className="text-gray-600 leading-relaxed">Sign in with Google and GitHub. Support for multiple providers, account linking, and profile sync.</p>
            </div>

            <div className="p-8 border border-gray-200 rounded-2xl hover:border-gray-900 transition-all duration-300">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Two-Factor Auth</h3>
              <p className="text-gray-600 leading-relaxed">TOTP-based 2FA with QR code setup, backup codes, and optional enforcement for enhanced security.</p>
            </div>

            <div className="p-8 border border-gray-200 rounded-2xl hover:border-gray-900 transition-all duration-300">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-3">RBAC System</h3>
              <p className="text-gray-600 leading-relaxed">Complete role-based access control with custom roles, permissions, and fine-grained authorization.</p>
            </div>

            <div className="p-8 border border-gray-200 rounded-2xl hover:border-gray-900 transition-all duration-300">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Session Management</h3>
              <p className="text-gray-600 leading-relaxed">Track active sessions across devices with IP and user agent. Revoke sessions remotely for security.</p>
            </div>

            <div className="p-8 border border-gray-200 rounded-2xl hover:border-gray-900 transition-all duration-300">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Modern Stack</h3>
              <p className="text-gray-600 leading-relaxed">Built with Next.js 15, NestJS 11, PostgreSQL, Redis, and TypeScript for optimal performance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-24 px-6 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Enterprise-Grade
                <span className="block text-gray-400 mt-2">Security</span>
              </h2>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                Built with security-first principles. Every component is designed to protect your users and meet compliance standards.
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Password Security</h4>
                    <p className="text-gray-400">Bcrypt hashing with configurable rounds, password history, and strength requirements</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Token Security</h4>
                    <p className="text-gray-400">JWT with RS256 signing, automatic rotation, and configurable expiration</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Rate Limiting</h4>
                    <p className="text-gray-400">Redis-based rate limiting to prevent brute force and abuse attempts</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800">
                <div className="space-y-4 font-mono text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-400">All systems operational</span>
                  </div>
                  <div className="border-t border-gray-800 pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Encryption</span>
                      <span className="text-green-400">AES-256</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hash Algorithm</span>
                      <span className="text-green-400">bcrypt</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Token Signing</span>
                      <span className="text-green-400">RS256</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Session Storage</span>
                      <span className="text-green-400">Redis</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-24 px-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">Built with the best</h2>
            <p className="text-lg text-gray-600">Industry-leading technologies for maximum reliability</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="text-center p-6 border border-gray-200 rounded-xl">
              <div className="text-2xl font-bold text-black mb-2">Next.js</div>
              <div className="text-sm text-gray-500">v15</div>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-xl">
              <div className="text-2xl font-bold text-black mb-2">NestJS</div>
              <div className="text-sm text-gray-500">v11</div>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-xl">
              <div className="text-2xl font-bold text-black mb-2">PostgreSQL</div>
              <div className="text-sm text-gray-500">v15</div>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-xl">
              <div className="text-2xl font-bold text-black mb-2">Redis</div>
              <div className="text-sm text-gray-500">v7</div>
            </div>
            <div className="text-center p-6 border border-gray-200 rounded-xl">
              <div className="text-2xl font-bold text-black mb-2">TypeScript</div>
              <div className="text-sm text-gray-500">v5</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
            Ready to build?
          </h2>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Start with production-ready authentication in minutes, not months.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                Get Started Free
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              © 2026 Auth Starter Kit. All rights reserved.
            </div>
            <div className="flex items-center gap-8">
              <a href="#" className="text-sm text-gray-600 hover:text-black transition-colors">Documentation</a>
              <a href="#" className="text-sm text-gray-600 hover:text-black transition-colors">Privacy</a>
              <a href="#" className="text-sm text-gray-600 hover:text-black transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
