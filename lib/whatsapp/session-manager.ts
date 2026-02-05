import path from "path";
import type { DeviceSessionState, OnQrCallback, OnStatusCallback } from "./types";
import { BaileysAdapter, getAuthStatePath } from "./baileys-adapter";

const DEFAULT_SESSIONS_DIR = path.join(process.cwd(), "data", "whatsapp");

/**
 * Mengelola banyak session Baileys per device.
 * Connect dijalankan asinkron (setImmediate) agar tidak block request.
 */
class SessionManagerImpl {
  private sessions = new Map<string, BaileysAdapter>();
  private baseDir: string;

  constructor(baseDir: string = DEFAULT_SESSIONS_DIR) {
    this.baseDir = baseDir;
  }

  /**
   * Memulai koneksi untuk device. QR akan tersedia via getState(deviceId) setelah dipanggil.
   */
  startSession(deviceId: string, onQr?: OnQrCallback, onStatus?: OnStatusCallback): void {
    if (this.sessions.has(deviceId)) {
      return;
    }
    const authPath = getAuthStatePath(this.baseDir, deviceId);
    const adapter = new BaileysAdapter(authPath, { onQr, onStatus });
    this.sessions.set(deviceId, adapter);
    setImmediate(() => {
      adapter.connect().catch(() => {
        // Error already reflected in status
      });
    });
  }

  /**
   * Menghentikan session dan hapus dari memori.
   */
  async stopSession(deviceId: string): Promise<void> {
    const adapter = this.sessions.get(deviceId);
    if (adapter) {
      await adapter.disconnect();
      this.sessions.delete(deviceId);
    }
  }

  /**
   * State saat ini untuk device (untuk polling UI).
   */
  getState(deviceId: string): DeviceSessionState | null {
    const adapter = this.sessions.get(deviceId);
    if (!adapter) return null;
    return {
      status: adapter.getStatus(),
      qr: adapter.getQr(),
      phoneNumber: adapter.getPhoneNumber(),
    };
  }

  /**
   * Kirim pesan teks. Hanya berhasil jika session connected.
   */
  async sendText(deviceId: string, jid: string, text: string): Promise<boolean> {
    const adapter = this.sessions.get(deviceId);
    if (!adapter || !adapter.isConnected()) return false;
    return adapter.sendTextMessage(jid, text);
  }

  /**
   * Apakah device punya session aktif (connecting atau connected).
   */
  hasSession(deviceId: string): boolean {
    return this.sessions.has(deviceId);
  }

  getAuthStatePathForDevice(deviceId: string): string {
    return getAuthStatePath(this.baseDir, deviceId);
  }
}

export const sessionManager = new SessionManagerImpl();

export function getSessionManager(baseDir?: string): SessionManagerImpl {
  if (baseDir) {
    return new SessionManagerImpl(baseDir);
  }
  return sessionManager;
}
