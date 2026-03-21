import type { UserRole } from "@/lib/types";

export type NavItem = {
  href: string;
  label: string;
};

const commonItems: NavItem[] = [{ href: "/jobs", label: "Jobs" }, { href: "/profile", label: "Profile" }];
const freelancerItems: NavItem[] = [
  { href: "/saved-jobs", label: "Saved Jobs" },
  { href: "/companies/following", label: "Followed Companies" },
  { href: "/dashboard/freelancer", label: "Freelancer Dashboard" },
];
const clientItems: NavItem[] = [
  { href: "/dashboard/client", label: "Client Dashboard" },
  { href: "/dashboard/reports", label: "Reports" },
];

export function getNavItems(role: UserRole | undefined): NavItem[] {
  if (role === "FREELANCER") {
    return [...commonItems, ...freelancerItems];
  }
  if (role === "CLIENT") {
    return [...commonItems, ...clientItems];
  }
  return commonItems;
}
