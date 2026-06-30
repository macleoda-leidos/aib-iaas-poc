/**
 * Virus Scanner Interface
 * Defines the contract for file scanning implementations.
 * Production would use ClamAV; POC provides both a ClamAV client
 * and a placeholder that simulates scanning behaviour.
 */

export interface ScanResult {
  fileId: string;
  fileName: string;
  scanned: boolean;
  infected: boolean;
  virusName?: string;
  scanDuration: number; // ms
  scanner: string;
  scannedAt: string;
  error?: string;
}

export interface VirusScanner {
  name: string;
  isAvailable(): Promise<boolean>;
  scanFile(filePath: string, fileId: string, fileName: string): Promise<ScanResult>;
  scanBuffer(buffer: Buffer, fileId: string, fileName: string): Promise<ScanResult>;
}
