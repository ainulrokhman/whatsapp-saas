import path from "path";
import type {
  IWhatsAppClient,
  SessionStatus,
  OnQrCallback,
  OnStatusCallback,
} from "./types";

// Baileys types may not be installed yet; use type-safe imports
type BaileysSocket = {
  ev: {
    on: (event: string, handler: (arg: unknown) => void) => void;
    off: (event: string) => void;
  };
  end: (reason?: string) => void;
  sendMessage: (jid: string, content: { text: string }, options?: unknown) => Promise<unknown>;
};

/**
 * Adapter Baileys: implementasi IWhatsAppClient menggunakan @whiskeysockets/baileys.
 * Connect dijalankan asinkron (tidak block caller).
 */
export class BaileysAdapter implements IWhatsAppClient {
  private socket: BaileysSocket | null = null;
  private _status: SessionStatus = "disconnected";
  private _qr: string | null = null;
  private _phoneNumber: string | null = null;
  private authStatePath: string;
  private onQr?: OnQrCallback;
  private onStatus?: OnStatusCallback;

  constructor(
    authStatePath: string,
    callbacks?: { onQr?: OnQrCallback; onStatus?: OnStatusCallback }
  ) {
    this.authStatePath = authStatePath;
    this.onQr = callbacks?.onQr;
    this.onStatus = callbacks?.onStatus;
  }

  getStatus(): SessionStatus {
    return this._status;
  }

  getQr(): string | null {
    return this._qr;
  }

  getPhoneNumber(): string | null {
    return this._phoneNumber;
  }

  isConnected(): boolean {
    return this._status === "connected";
  }

  async connect(): Promise<void> {
    if (this._status === "connecting" || this._status === "connected") {
      return;
    }
    this._status = "connecting";
    this._qr = null;
    this.onStatus?.(this._status);

    const makeWASocket = (await import("@whiskeysockets/baileys")).default;
    const { useMultiFileAuthState } = await import("@whiskeysockets/baileys");

    const { state, saveCreds } = await useMultiFileAuthState(this.authStatePath);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
    }) as BaileysSocket;

    sock.ev.on("connection.update", (update: Record<string, unknown>) => {
      const connection = update.connection as string | undefined;
      const qr = update.qr as string | undefined;
      const lastDisconnect = update.lastDisconnect as { error?: { output?: { statusCode?: number } } } | undefined;

      if (qr) {
        this._qr = qr;
        this.onQr?.(qr);
      }

      if (connection === "close") {
        this._status = "disconnected";
        this._qr = null;
        this._phoneNumber = null;
        this.socket = null;
        this.onStatus?.("disconnected");
        return;
      }

      if (connection === "open") {
        this._qr = null;
        this._status = "connected";
        this.onStatus?.("connected", this._phoneNumber);
      }
    });

    sock.ev.on("creds.update", (creds: { me?: { id?: string } }) => {
      saveCreds();
      const meId = creds?.me?.id;
      if (meId) {
        this._phoneNumber = meId.replace(/:\d+@s\.whatsapp\.net/, "").replace(/@s\.whatsapp\.net/, "");
      }
    });

    this.socket = sock;
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.end();
      this.socket = null;
    }
    this._status = "disconnected";
    this._qr = null;
    this._phoneNumber = null;
    this.onStatus?.("disconnected");
  }

  async sendTextMessage(jid: string, text: string): Promise<boolean> {
    if (!this.socket || this._status !== "connected") return false;
    const normalizedJid = jid.includes("@") ? jid : `${jid}@s.whatsapp.net`;
    try {
      await this.socket.sendMessage(normalizedJid, { text });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Membuat path folder auth state per device (persisten di filesystem).
 */
export function getAuthStatePath(baseDir: string, deviceId: string): string {
  return path.join(baseDir, "sessions", deviceId);
}
