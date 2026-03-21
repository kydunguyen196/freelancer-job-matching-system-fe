"use client";

import Link from "next/link";
import { Bell, LogOut, Menu, Moon, RefreshCcw, Sun, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getNavItems } from "@/components/layout/nav-config";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getMyNotifications, markNotificationRead } from "@/lib/api";
import { formatRelativeDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const navItems = useMemo(() => getNavItems(session?.role), [session?.role]);

  const notificationsQuery = useQuery({
    queryKey: ["notifications", "nav"],
    queryFn: getMyNotifications,
    staleTime: 20_000,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((item) => !item.read).length;

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1320px] items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileOpen((prev) => !prev)}>
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <Link href="/jobs" className="inline-flex items-center gap-2">
            <span className="rounded-lg bg-[var(--accent)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">SB</span>
            <span className="font-display text-sm font-semibold tracking-tight">SkillBridge</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <div className="relative">
            <Button variant="ghost" size="sm" onClick={() => setNotificationOpen((prev) => !prev)} aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Button>
            {notificationOpen ? (
              <Card className="absolute right-0 mt-2 w-[340px] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Notifications</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void notificationsQuery.refetch()}
                    disabled={notificationsQuery.isFetching}
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                </div>
                <div className="max-h-[320px] space-y-2 overflow-auto pr-1">
                  {notifications.slice(0, 12).map((item) => (
                    <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="line-clamp-1 text-sm font-semibold">{item.title}</p>
                        {!item.read ? <Badge className="bg-amber-100 text-amber-800">New</Badge> : null}
                      </div>
                      <p className="line-clamp-2 text-xs text-slate-600">{item.message}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">{formatRelativeDate(item.createdAt)}</span>
                        {!item.read ? (
                          <button
                            type="button"
                            className="text-xs font-medium text-blue-700 hover:text-blue-800"
                            onClick={() => markReadMutation.mutate(item.id)}
                          >
                            Mark read
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                  {!notifications.length ? (
                    <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">No notifications yet.</p>
                  ) : null}
                </div>
              </Card>
            ) : null}
          </div>
          <Badge>{session?.role ?? "ACCOUNT"}</Badge>
          <p className="hidden max-w-[220px] truncate text-xs text-slate-600 md:block">{session?.email}</p>
          <Button variant="secondary" size="sm" onClick={() => void handleLogout()}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>

      {mobileOpen ? (
        <nav className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-3 md:hidden">
          <div className="grid gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
