// @shared/interfaces/firmware.ts
export interface Firmware {
  id: number;
  name: string;
  version: string;
  uploadedAt: number;
}

export interface FirmwareUpdate {
  status: string;
  message: string;
  sessionId?: string;
}

export interface FirmwareUpdateProgress {
  status: string;
  message: string;
}
