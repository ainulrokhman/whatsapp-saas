"use client";

import type { Session } from "next-auth";
import { UserMenu } from "@/components/auth/UserMenu";
import { Breadcrumb } from "./Breadcrumb";

export function Header({ session }: { session: Session | null }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-header-border bg-header-bg px-4 backdrop-blur supports-[backdrop-filter]:bg-header-bg/95">
      <Breadcrumb />
      <UserMenu session={session} />
    </header>
  );
}
