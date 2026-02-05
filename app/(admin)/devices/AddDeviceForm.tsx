"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createDevice } from "@/app/(admin)/actions/device-actions";
import { DeviceQrModal } from "./DeviceQrModal";

export function AddDeviceForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setPending(true);
    const formData = new FormData();
    formData.set("name", name.trim());
    const result = await createDevice(formData);
    setPending(false);
    if (result.ok) {
      setName("");
      setNewDeviceId(result.deviceId);
    } else {
      alert(result.error);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
        <div className="min-w-[200px]">
          <label htmlFor="device-name" className="mb-1 block text-sm font-medium text-foreground">
            Nama device
          </label>
          <Input
            id="device-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Kantor"
            disabled={pending}
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Menambah…" : "Tambah device"}
        </Button>
      </form>
      {newDeviceId && (
        <DeviceQrModal
          deviceId={newDeviceId}
          onClose={() => {
            setNewDeviceId(null);
            onCreated();
          }}
          onConnected={() => {
            setNewDeviceId(null);
            onCreated();
          }}
        />
      )}
    </>
  );
}
