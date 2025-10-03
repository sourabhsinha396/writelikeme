import { type Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google'
import SidebarLayout from "@/components/sidebar-layout";
import { Providers } from "@/providers/providers";
import ProtectedRoute from "@/components/ProtectedRoute";
import CrispChat from "@/components/common/CrispChat";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StyleMimic - Write in Your Style",
  description: "Upload your text samples and let AI analyze and replicate your unique writing style.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased font-sans`}>
        <Providers>
            <SidebarLayout>{children}</SidebarLayout>
          <GoogleAnalytics gaId="G-M7VC9VD3SZ" />
          <CrispChat />
        </Providers>
      </body>
    </html>
  );
}