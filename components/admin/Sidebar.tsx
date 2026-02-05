"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { PermissionName } from "@/lib/rbac";

const navItems: { href: string; label: string; permission?: PermissionName }[] = [
  { href: "/dashboard", label: "Dashboard", permission: "tenant:read" },
  { href: "/devices", label: "Devices", permission: "device:read" },
  { href: "/contacts", label: "Contacts", permission: "contact:read" },
  { href: "/broadcast", label: "Broadcast", permission: "broadcast:read" },
];

export function Sidebar({ permissions }: { permissions: PermissionName[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const allowed = new Set(permissions);
  const items = navItems.filter(
    (item) => !item.permission || allowed.has(item.permission)
  );
  const visibleItems = items.length > 0 ? items : [{ href: "/dashboard", label: "Dashboard" }];

  return (
    <>
      <button
        type="button"
        aria-label="Toggle sidebar"
        className="fixed left-4 top-4 z-50 rounded-lg border border-header-border bg-background p-2 md:hidden"
        onClick={() => setOpen((o) => !o)}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-sidebar-bg text-sidebar-foreground transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col pt-16 md:pt-4">
          <div className="px-4 py-4 font-semibold text-white">WhatsApp SaaS</div>
          <nav className="flex-1 space-y-1 px-2">
            {visibleItems.map(({ href, label }) => {
              const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-white"
                      : "text-sidebar-foreground hover:bg-white/10"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
