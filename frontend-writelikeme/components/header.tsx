"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { PenLine } from "lucide-react";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <PenLine className="h-6 w-6" />
            <span className="font-bold">WriteLikeMe</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/upload"
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === "/upload" ? "text-foreground" : "text-foreground/60"
              )}
            >
              Upload
            </Link>
            <Link
              href="/analyze"
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === "/analyze" ? "text-foreground" : "text-foreground/60"
              )}
            >
              Analyze
            </Link>
            <Link
              href="/profiles"
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === "/profiles" ? "text-foreground" : "text-foreground/60"
              )}
            >
              Profiles
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}