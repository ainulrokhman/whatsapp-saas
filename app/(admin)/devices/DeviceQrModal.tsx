"use client";

import { useEffect, useState } from "react";
import { getDeviceStatus, startDeviceSession } from "@/app/(admin)/actions/device-actions";

export function DeviceQrModal({
  deviceId,
  onClose,
  onConnected,
}: {
  deviceId: string;
  onClose: () => void;
  onConnected: () => void;
}) {
  const [status, setStatus] = useState<string>("loading");
  const [qr, setQr] = useState<string | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void startDeviceSession(deviceId);
  }, [deviceId]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const result = await getDeviceStatus(deviceId);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStatus(result.status);
      if (result.status === "connected") {
        onConnected();
        return;
      }
      if (result.qr) {
        setQr(result.qr);
      } else {
        setQr(null);
      }
    }

    void poll();
    const interval = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [deviceId, onConnected]);

  useEffect(() => {
    if (!qr) {
      setQrImageUrl(null);
      return;
    }
    let cancelled = false;
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(qr, { width: 256 }).then((dataUrl: string) => {
        if (!cancelled) setQrImageUrl(dataUrl);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [qr]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg border border-header-border bg-background p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-foreground">Scan QR Code</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Buka WhatsApp di ponsel → Linked devices → Link a device, lalu scan.
        </p>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <div className="mt-4 flex justify-center rounded-lg bg-white p-4">
          {status === "loading" && !qrImageUrl && (
            <span className="text-muted-foreground">Memuat QR…</span>
          )}
          {qrImageUrl && (
            <img src={qrImageUrl} alt="QR Code WhatsApp" className="h-64 w-64" />
          )}
          {status === "connecting" && qrImageUrl && (
            <p className="absolute mt-2 text-sm text-muted-foreground">
              Menunggu scan…
            </p>
          )}
        </div>
        <p className="mt-2 text-center text-sm text-muted-foreground">Status: {status}</p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-header-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
