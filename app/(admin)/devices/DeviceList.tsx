"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { useHasPermission } from "@/components/providers/PermissionsProvider";
import type { Device } from "@prisma/client";
import { deleteDevice } from "@/app/(admin)/actions/device-actions";
import { DeviceQrModal } from "./DeviceQrModal";

export function DeviceList({
  devices,
  onRefresh,
}: {
  devices: Device[];
  onRefresh: () => void;
}) {
  const [qrDeviceId, setQrDeviceId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const canUpdate = useHasPermission("device:update");
  const canDelete = useHasPermission("device:delete");

  async function handleDelete(deviceId: string) {
    if (!confirm("Yakin ingin menghapus device ini? Session akan diputus.")) return;
    setDeletingId(deviceId);
    const result = await deleteDevice(deviceId);
    setDeletingId(null);
    if (result.ok) onRefresh();
    else alert(result.error);
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Nomor</TableHead>
            <TableHead>Terakhir aktif</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                Belum ada device. Tambah session untuk memulai.
              </TableCell>
            </TableRow>
          ) : (
            devices.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      d.status === "connected"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : d.status === "connecting"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {d.status}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{d.phoneNumber ?? "–"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {d.lastActiveAt
                    ? new Date(d.lastActiveAt).toLocaleString("id-ID")
                    : "–"}
                </TableCell>
                <TableCell className="text-right">
                  {canUpdate && d.status === "disconnected" && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="mr-2"
                      onClick={() => setQrDeviceId(d.id)}
                    >
                      Scan QR
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={deletingId === d.id}
                      onClick={() => handleDelete(d.id)}
                    >
                      {deletingId === d.id ? "Menghapus…" : "Hapus"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {qrDeviceId && (
        <DeviceQrModal
          deviceId={qrDeviceId}
          onClose={() => setQrDeviceId(null)}
          onConnected={() => {
            setQrDeviceId(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
}
