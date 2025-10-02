"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { Bell, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Button } from "@/components/ui/button";

type AdminHeaderProps = {
  onToggleSidebar: () => void;
  className?: string;
};

export function AdminHeader({ onToggleSidebar, className }: AdminHeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header
      className={`flex h-16 items-center justify-between border-b bg-background px-6 ${className}`}
    >
      {/* Left section - Mobile Menu */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="md:hidden"
        >
          <Menu className="size-5" />
        </Button>
      </div>

      {/* Center section - Spacer */}
      <div className="flex-1"></div>

      {/* Right section - Actions and User */}
      <div className="flex items-center justify-end gap-2">
        {/* Language Switcher */}
        <LocaleSwitcher />

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="hidden sm:flex"
        >
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
          <span className="absolute -right-1 -top-1 flex size-3 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            3
          </span>
          <span className="sr-only">Notifications</span>
        </Button>

        {/* Organization Switcher */}
        <OrganizationSwitcher
          appearance={{
            elements: {
              organizationSwitcherTrigger:
                "flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
              organizationSwitcherTriggerIcon: "size-4",
              organizationSwitcherPopoverCard: "w-64",
            },
          }}
        />

        {/* User Button */}
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "size-8",
              userButtonPopoverCard: "w-64",
              userButtonPopoverActionButton: "text-sm",
            },
          }}
        />
      </div>
    </header>
  );
}
