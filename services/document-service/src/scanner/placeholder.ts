import { readFileSync } from 'fs';
import { VirusScanner, ScanResult } from './interface';

/**
 * Placeholder Scanner — the simulated scanner used in local dev and tests (never
 * in production; the factory refuses it there).
 *
 * Detection is content-based: it reads the file and looks for the EICAR test
 * signature (and the eicar/virus/malware markers the test fixtures use). It used
 * to decide purely from the filename, which meant a malicious file was "clean"
 * the moment it was renamed — a dishonest test oracle. Reading the bytes keeps
 * the simulation at least structurally like a real scan.
 */
const EICAR_SIGNATURE = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

export class PlaceholderScanner implements VirusScanner {
  name = 'PlaceholderScanner (POC)';

  async isAvailable(): Promise<boolean> {
    return true; // Always available
  }

  async scanFile(filePath: string, fileId: string, fileName: string): Promise<ScanResult> {
    let content = '';
    try {
      content = readFileSync(filePath).toString('latin1');
    } catch {
      // Unreadable file → report as not scanned so the caller fails closed
      // rather than recording a clean result for something it never inspected.
      return {
        fileId, fileName, scanned: false, infected: false,
        scanDuration: 0, scanner: this.name, scannedAt: new Date().toISOString(),
        error: 'file unreadable',
      };
    }
    return this.performScan(content, fileId, fileName);
  }

  async scanBuffer(buffer: Buffer, fileId: string, fileName: string): Promise<ScanResult> {
    return this.performScan(buffer.toString('latin1'), fileId, fileName);
  }

  private async performScan(content: string, fileId: string, fileName: string): Promise<ScanResult> {
    const start = Date.now();
    // Small simulated delay (kept short so the test suite stays fast).
    await new Promise(r => setTimeout(r, 50 + Math.random() * 100));

    const lower = content.toLowerCase();
    const infected =
      content.includes(EICAR_SIGNATURE) ||
      lower.includes('eicar') ||
      lower.includes('virus') ||
      lower.includes('malware');

    return {
      fileId,
      fileName,
      scanned: true,
      infected,
      virusName: infected ? 'EICAR-Test-Signature (SIMULATED)' : undefined,
      scanDuration: Date.now() - start,
      scanner: this.name,
      scannedAt: new Date().toISOString(),
    };
  }
}
