import type { Metadata } from "next";
import { Inter, Roboto, Open_Sans, Lato, Poppins, Playfair_Display, Merriweather, Crimson_Text } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { FontProvider } from "@/providers/FontProvider";
import { Toaster } from "react-hot-toast";

const USE_GOOGLE_FONTS = false; // Set to true to enable Google Fonts, false to use system fonts only

let inter, roboto, openSans, lato, poppins, playfairDisplay, merriweather, crimsonText;

if (USE_GOOGLE_FONTS) {
  const { Inter, Roboto, Open_Sans, Lato, Poppins, Playfair_Display, Merriweather, Crimson_Text } = require("next/font/google");
  inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
  roboto = Roboto({ subsets: ["latin"], weight: ["300", "400", "500", "700"], variable: "--font-roboto", display: "swap" });
  openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans", display: "swap" });
  lato = Lato({ subsets: ["latin"], weight: ["300", "400", "700"], variable: "--font-lato", display: "swap" });
  poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-poppins", display: "swap" });
  playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
  merriweather = Merriweather({ subsets: ["latin"], weight: ["300", "400", "700"], variable: "--font-merriweather", display: "swap" });
  crimsonText = Crimson_Text({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-crimson", display: "swap" });
}

export const metadata: Metadata = {
  title: "ERP System - Complete Business Management",
  description: "Comprehensive ERP system for managing all aspects of your business",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={
          USE_GOOGLE_FONTS
            ? [
                inter?.variable,
                roboto?.variable,
                openSans?.variable,
                lato?.variable,
                poppins?.variable,
                playfairDisplay?.variable,
                merriweather?.variable,
                crimsonText?.variable,
              ]
                .filter(Boolean)
                .join(' ')
            : ''
        }
      >
        <AuthProvider>
          <ThemeProvider>
            <FontProvider>
              {children}
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
