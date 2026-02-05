"use client";

import { createContext, useContext } from "react";
import type { PermissionName } from "@/lib/rbac";

const PermissionsContext = createContext<PermissionName[]>([]);

export function PermissionsProvider({
  permissions,
  children,
}: {
  permissions: PermissionName[];
  children: React.ReactNode;
}) {
  return (
    <PermissionsContext.Provider value={permissions}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionName[] {
  return useContext(PermissionsContext);
}

export function useHasPermission(permission: PermissionName): boolean {
  const permissions = useContext(PermissionsContext);
  return permissions.includes(permission);
}
