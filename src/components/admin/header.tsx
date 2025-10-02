"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { Bell, Calendar, Menu, Moon, Plus, Search, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Feature flags - can be moved to env variables later
const HEADER_SEARCH_ENABLED = false;
const HEADER_CREATE_ENABLED = false;
const HEADER_CALENDAR_ENABLED = false;

type AdminHeaderProps = {
  onToggleSidebar: () => void;
  className?: string;
};

export function AdminHeader({ onToggleSidebar, className }: AdminHeaderProps) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("header");

  return (
    <header
      className={`flex h-16 items-center justify-between border-b bg-background px-6 ${className}`}
    >
      {/* Left section - Mobile Menu & Search */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="md:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="size-5" />
        </Button>

        {/* Search Bar - Feature Flag Controlled */}
        {HEADER_SEARCH_ENABLED && (
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              className="w-64 pl-9"
              aria-label={t("search")}
            />
          </div>
        )}
      </div>

      {/* Center section - Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Create Project Button - Feature Flag Controlled */}
        {HEADER_CREATE_ENABLED && (
          <Button variant="default" size="sm" className="hidden sm:flex">
            <Plus className="mr-2 size-4" />
            {t("createProject")}
          </Button>
        )}

        {/* Calendar Button - Feature Flag Controlled */}
        {HEADER_CALENDAR_ENABLED && (
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Calendar className="size-4" />
            <span className="sr-only">{t("viewCalendar")}</span>
          </Button>
        )}
      </div>

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
          aria-label={t("toggleTheme")}
        >
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t("toggleTheme")}</span>
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={t("notifications")}
        >
          <Bell className="size-4" />
          <span className="absolute -right-1 -top-1 flex size-3 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            3
          </span>
          <span className="sr-only">{t("notifications")}</span>
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
