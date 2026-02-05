"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useHasPermission } from "@/components/providers/PermissionsProvider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import type { Device } from "@prisma/client";
import type { Contact } from "@prisma/client";
import type { BroadcastLog } from "@prisma/client";
import { startBroadcast } from "@/app/(admin)/actions/broadcast-actions";

export function BroadcastPageContent({
  initialLogs,
  devices,
  contacts,
}: {
  initialLogs: BroadcastLog[];
  devices: Device[];
  contacts: Contact[];
}) {
  const router = useRouter();
  const canSend = useHasPermission("broadcast:send");
  const [deviceId, setDeviceId] = useState("");
  const [message, setMessage] = useState("");
  const [tag, setTag] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);

  const connectedDevices = devices.filter((d) => d.status === "connected");
  const tags = [...new Set(contacts.map((c) => c.tag).filter(Boolean))] as string[];

  function refresh() {
    router.refresh();
  }

  function toggleContact(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const formData = new FormData();
    formData.set("deviceId", deviceId);
    formData.set("message", message);
    if (tag.trim()) {
      formData.set("tag", tag.trim());
    } else if (selectedIds.size > 0) {
      formData.set("contactIds", [...selectedIds].join(","));
    } else {
      alert("Pilih tag atau centang kontak yang akan dikirimi.");
      setPending(false);
      return;
    }
    const result = await startBroadcast(formData);
    setPending(false);
    if (result.ok) {
      setMessage("");
      setTag("");
      setSelectedIds(new Set());
      refresh();
    } else {
      alert(result.error);
    }
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-foreground">Broadcast</h1>
      <p className="mt-2 text-muted-foreground">
        Kirim pesan ke banyak kontak. Pilih device yang sudah connected, lalu pilih kontak atau tag.
      </p>

      {canSend && (
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Device</label>
          <select
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            required
            className="w-full max-w-xs rounded-md border border-header-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Pilih device</option>
            {connectedDevices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.phoneNumber ?? d.status})
              </option>
            ))}
            {connectedDevices.length === 0 && (
              <option value="" disabled>
                Tidak ada device connected
              </option>
            )}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Pesan</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            className="w-full max-w-xl rounded-md border border-header-border bg-background px-3 py-2 text-sm"
            placeholder="Tulis pesan broadcast..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Kirim ke (pilih salah satu)
          </label>
          <div className="flex flex-wrap gap-6">
            <div>
              <span className="text-sm text-muted-foreground">Filter by tag: </span>
              <select
                value={tag}
                onChange={(e) => {
                  setTag(e.target.value);
                  setSelectedIds(new Set());
                }}
                className="ml-2 rounded-md border border-header-border bg-background px-3 py-2 text-sm"
              >
                <option value="">-- Pilih tag --</option>
                {tags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Atau pilih kontak:</span>
              {tag ? (
                <span className="text-sm">Kosongkan tag dulu untuk pilih per kontak.</span>
              ) : (
                <span className="text-sm">
                  {selectedIds.size} kontak dipilih
                </span>
              )}
            </div>
          </div>
          {!tag && contacts.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto rounded border border-header-border p-2">
              {contacts.map((c) => (
                <label key={c.id} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={() => toggleContact(c.id)}
                  />
                  <span className="text-sm">
                    {c.phone} {c.name ? `(${c.name})` : ""}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Memproses…" : "Kirim broadcast"}
        </Button>
      </form>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-medium text-foreground">Riwayat broadcast</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pesan</TableHead>
              <TableHead>Penerima</TableHead>
              <TableHead>Sukses / Gagal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Waktu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Belum ada broadcast.
                </TableCell>
              </TableRow>
            ) : (
              initialLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="max-w-[200px] truncate">{log.message}</TableCell>
                  <TableCell>{log.recipientCount}</TableCell>
                  <TableCell>
                    {log.successCount} / {log.failCount}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        log.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : log.status === "running"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : log.status === "failed"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {log.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {log.startedAt
                      ? new Date(log.startedAt).toLocaleString("id-ID")
                      : "–"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
