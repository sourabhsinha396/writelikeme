"use client";

import { useTheme } from "@/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Monitor } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme("light")}
        className={theme === "light" ? "text-emerald-500" : "text-muted-foreground"}
        title="Light mode"
      >
        <Sun className="h-5 w-5" />
        <span className="sr-only">Light mode</span>
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme("dark")}
        className={theme === "dark" ? "text-emerald-500" : "text-muted-foreground"}
        title="Dark mode"
      >
        <Moon className="h-5 w-5" />
        <span className="sr-only">Dark mode</span>
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme("system")}
        className={theme === "system" ? "text-emerald-500" : "text-muted-foreground"}
        title="System theme"
      >
        <Monitor className="h-5 w-5" />
        <span className="sr-only">System theme</span>
      </Button>
    </div>
  );
}