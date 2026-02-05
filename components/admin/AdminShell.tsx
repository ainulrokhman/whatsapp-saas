"use client";

import type { Session } from "next-auth";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AdminShell({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-64">
        <Header session={session} />
        <main
          className="p-4 md:p-6"
          style={{ padding: "var(--content-padding, 1.5rem)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
