"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TenantRecord } from "@/lib/repositories/tenant-repository";
import { setActiveTenant } from "@/app/(admin)/actions/tenant-actions";

export function TenantSwitcher({
  tenantId,
  tenants,
}: {
  tenantId: string | null;
  tenants: TenantRecord[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const current = tenants.find((t) => t.id === tenantId);

  async function handleSelect(id: string) {
    if (id === tenantId) {
      setOpen(false);
      return;
    }
    setPending(true);
    const result = await setActiveTenant(id);
    setPending(false);
    setOpen(false);
    if (result.ok) {
      router.refresh();
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className="flex items-center gap-2 rounded-lg border border-header-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Pilih workspace"
      >
        <span className="truncate max-w-[140px]">
          {current?.name ?? "Workspace"}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            className="absolute left-0 top-full z-50 mt-1 max-h-60 w-56 overflow-auto rounded-lg border border-header-border bg-background py-1 shadow-lg"
          >
            {tenants.map((t) => (
              <li key={t.id} role="option" aria-selected={t.id === tenantId}>
                <button
                  type="button"
                  onClick={() => handleSelect(t.id)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-muted ${
                    t.id === tenantId ? "bg-muted font-medium" : ""
                  }`}
                >
                  {t.name}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
