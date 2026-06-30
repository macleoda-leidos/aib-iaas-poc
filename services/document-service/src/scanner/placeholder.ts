import { VirusScanner, ScanResult } from './interface';

/**
 * Placeholder Scanner - used when ClamAV is not available.
 * Simulates scanning behaviour with configurable delay.
 * Files named containing 'eicar' or 'virus' are flagged as infected for testing.
 */
export class PlaceholderScanner implements VirusScanner {
  name = 'PlaceholderScanner (POC)';

  async isAvailable(): Promise<boolean> {
    return true; // Always available
  }

  async scanFile(filePath: string, fileId: string, fileName: string): Promise<ScanResult> {
    return this.performScan(fileId, fileName);
  }

  async scanBuffer(_buffer: Buffer, fileId: string, fileName: string): Promise<ScanResult> {
    return this.performScan(fileId, fileName);
  }

  private async performScan(fileId: string, fileName: string): Promise<ScanResult> {
    const start = Date.now();

    // Simulate scan delay (500-2000ms)
    const delay = 500 + Math.random() * 1500;
    await new Promise(r => setTimeout(r, delay));

    // Files with 'eicar' or 'virus' in the name are treated as infected (for testing)
    const lowerName = fileName.toLowerCase();
    const infected = lowerName.includes('eicar') || lowerName.includes('virus') || lowerName.includes('malware');

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
