"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/providers/auth-provider";

const links = [
  { href: "/jobs", label: "Jobs" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAuth();
  const roleLabel = session?.role ?? "ACCOUNT";
  const emailLabel = session?.email ?? "Signed in user";

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <Link href="/jobs" className="brand-mark">
          <span>SB</span>
          <strong>SkillBridge</strong>
        </Link>

        <nav className="top-nav-links">
          {links.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={active ? "nav-link active" : "nav-link"}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="top-nav-user">
          <span className="pill">{roleLabel}</span>
          <div className="user-email">{emailLabel}</div>
          <button type="button" className="btn-danger" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
