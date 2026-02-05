"use client";

import { signOut } from "next-auth/react";
import type { Session } from "next-auth";

export function UserMenu({ session }: { session: Session | null }) {
  if (!session) return null;
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600">{session.user?.email}</span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="text-sm text-blue-600 hover:underline"
      >
        Keluar
      </button>
    </div>
  );
}
