/**
 * Status koneksi session WhatsApp.
 */
export type SessionStatus = "disconnected" | "connecting" | "connected";

/**
 * Data yang bisa dibaca untuk satu device (untuk polling UI).
 */
export type DeviceSessionState = {
  status: SessionStatus;
  qr: string | null;
  phoneNumber: string | null;
  error?: string;
};

/**
 * Callback saat QR di-generate (untuk display atau simpan).
 */
export type OnQrCallback = (qr: string) => void;

/**
 * Callback saat status berubah (connecting / connected / disconnected).
 */
export type OnStatusCallback = (status: SessionStatus, phoneNumber?: string | null) => void;

/**
 * Interface client WhatsApp (abstraksi agar bisa ganti implementasi).
 */
export interface IWhatsAppClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getStatus(): SessionStatus;
  getQr(): string | null;
  getPhoneNumber(): string | null;
  sendTextMessage(jid: string, text: string): Promise<boolean>;
  isConnected(): boolean;
}

export type CreateSocketOptions = {
  authStatePath: string;
  onQr?: OnQrCallback;
  onStatus?: OnStatusCallback;
};
