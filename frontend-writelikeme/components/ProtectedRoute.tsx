"use client";

import { useAuth } from "@/providers/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip during server-side rendering
    if (typeof window === "undefined") return;
    
    // Don't redirect if still loading auth status
    if (isLoading) return;
    
    // If not authenticated and not on auth pages, redirect to login
    if (!isAuthenticated && 
        !pathname.includes("/login") && 
        !pathname.includes("/signup") && 
        pathname !== "/") {
      router.push("/login?redirect=" + encodeURIComponent(pathname));
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  // Show nothing while loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // On auth pages, always render content
  if (pathname.includes("/login") || pathname.includes("/signup") || pathname === "/") {
    return <>{children}</>;
  }

  // On protected pages, only render if authenticated
  return isAuthenticated ? <>{children}</> : null;
}