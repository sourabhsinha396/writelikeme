"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileText, Wand2, Home, MenuIcon, X, CreditCard } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      router.push("/login");
    }
  };

  // Navigation items
  const navItems = [
    { href: "/", label: "Home", icon: <Home className="w-5 h-5 mr-2" /> },
    { href: "/profiles", label: "Writing Profiles", icon: <FileText className="w-5 h-5 mr-2" /> },
    { href: "/generate", label: "Generate Content", icon: <Wand2 className="w-5 h-5 mr-2" /> },
    { href: "/pricing", label: "Pricing & Plans", icon: <CreditCard className="w-5 h-5 mr-2" /> },
  ];

  // Filter nav items based on auth state
  const filteredNavItems = navItems.filter(item => {
    if (!isAuthenticated && item.href !== "/") {
      return false;
    }
    return true;
  });

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
      </Button>

      {/* Sidebar - desktop */}
      <div className="hidden md:flex md:flex-col w-64 h-screen bg-gray-100 dark:bg-stone-950 border-r">
        {/* Logo and theme toggle - fixed height */}
        <div className="p-6 flex flex-col shrink-0">
          <h1 className="text-2xl font-bold">
            <Link href="/">
              WriteLike<span className="text-emerald-500">Me</span>
            </Link>
          </h1>
          <div className="mt-2">
            <ThemeToggle />
          </div>
        </div>
        
        {/* Nav section - scrollable with fixed height */}
        <nav className="overflow-y-auto px-4 py-2 space-y-2" style={{ height: "calc(100vh - 220px)" }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-md transition-colors font-semibold ${
                pathname === item.href || 
                (item.href !== "/" && pathname?.startsWith(item.href))
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                  : "hover:bg-muted-foreground/10"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        
        {/* Auth section - fixed at bottom */}
        <div className="p-4 border-t mt-auto shrink-0">
          {isAuthenticated ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Signed in as
                <Link href="/profile" className="text-emerald-500 font-bold">
                 {" "}{user?.username}
                </Link>
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="w-full">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar - mobile */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative flex flex-col w-64 h-screen bg-background">
            {/* Logo and theme toggle - fixed height */}
            <div className="p-6 flex flex-col shrink-0">
              <h1 className="text-2xl font-bold">
                WriteLike<span className="text-emerald-500">Me</span>
              </h1>
              <div className="mt-2">
                <ThemeToggle />
              </div>
            </div>
            
            {/* Nav section - scrollable with fixed height */}
            <nav className="overflow-y-auto px-4 py-2 space-y-2" style={{ height: "calc(100vh - 220px)" }}>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                    pathname === item.href || 
                    (item.href !== "/" && pathname?.startsWith(item.href))
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                      : "hover:bg-muted-foreground/10"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
            
            {/* Auth section - fixed at bottom */}
            <div className="p-4 border-t mt-auto shrink-0">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Signed in as 
                    <Link href="/profile" className="text-emerald-500 font-bold">
                    {" "}{user?.username}
                    </Link>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild size="sm" className="w-full">
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}