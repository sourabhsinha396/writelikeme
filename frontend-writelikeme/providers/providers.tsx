"use client";

import { AuthProvider } from "./AuthProvider";
import { ThemeProvider } from "@/providers/theme-provider";
import PayPalProvider from "./PaypalProvider";
import { PostHogProvider } from "./PosthogProvider";


export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      <PostHogProvider>
        <AuthProvider>
          <PayPalProvider>{children}</PayPalProvider>
        </AuthProvider>
      </PostHogProvider>
    </ThemeProvider>
  );
}