"use client";

import { useRouter } from "next/navigation";
import { useHasPermission } from "@/components/providers/PermissionsProvider";
import { DeviceList } from "./DeviceList";
import { AddDeviceForm } from "./AddDeviceForm";
import type { Device } from "@prisma/client";

export function DevicesPageContent({ devices }: { devices: Device[] }) {
  const router = useRouter();
  const canCreate = useHasPermission("device:create");

  function refresh() {
    router.refresh();
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-foreground">Devices</h1>
      <p className="mt-2 text-muted-foreground">
        Daftar session WhatsApp per tenant. Tambah device lalu scan QR dengan WhatsApp di ponsel.
      </p>
      <div className="mt-6 space-y-6">
        {canCreate && <AddDeviceForm onCreated={refresh} />}
        <DeviceList devices={devices} onRefresh={refresh} />
      </div>
    </>
  );
}
