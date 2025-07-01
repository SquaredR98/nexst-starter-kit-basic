import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../providers/AuthProvider";
import { ThemeProvider } from "../providers/ThemeProvider";
import { FontProvider } from "../providers/FontProvider";
import { Toaster } from "react-hot-toast";
import React from 'react';
import { MainLayout } from "@common/components/layout/MainLayout";

export const metadata: Metadata = {
  title: "ERP System - Complete Business Management",
  description: "Comprehensive ERP system for managing all aspects of your business",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ThemeProvider>
            <FontProvider>
              <MainLayout>
                {children}
              </MainLayout>
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'hsl(var(--card))',
                    color: 'hsl(var(--card-foreground))',
                    border: '1px solid hsl(var(--border))',
                  },
                }}
              />
            </FontProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
