import net from 'net';
import fs from 'fs';
import { VirusScanner, ScanResult } from './interface';

/**
 * ClamAV Scanner Implementation
 *
 * Connects to ClamAV daemon (clamd) via TCP socket.
 * ClamAV must be running as a separate service.
 *
 * Docker setup:
 *   docker run -d --name clamav -p 3310:3310 clamav/clamav:latest
 *
 * Configuration:
 *   CLAMAV_HOST=localhost (default)
 *   CLAMAV_PORT=3310 (default)
 *   CLAMAV_TIMEOUT=30000 (default, ms)
 *
 * Protocol: ClamAV uses INSTREAM command.
 *   1. Send "zINSTREAM\0"
 *   2. Send file in chunks: [4-byte big-endian length][chunk data]
 *   3. Send terminator: [4 bytes of 0]
 *   4. Receive response: "stream: OK\0" or "stream: <virus> FOUND\0"
 */
export class ClamAVScanner implements VirusScanner {
  name = 'ClamAV';
  private host: string;
  private port: number;
  private timeout: number;

  constructor() {
    this.host = process.env.CLAMAV_HOST || 'localhost';
    this.port = parseInt(process.env.CLAMAV_PORT || '3310');
    this.timeout = parseInt(process.env.CLAMAV_TIMEOUT || '30000');
  }

  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(3000);

      socket.connect(this.port, this.host, () => {
        // Send PING command
        socket.write('zPING\0');
      });

      socket.on('data', (data) => {
        const response = data.toString().trim();
        socket.destroy();
        resolve(response === 'PONG');
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
    });
  }

  async scanFile(filePath: string, fileId: string, fileName: string): Promise<ScanResult> {
    const start = Date.now();

    try {
      if (!fs.existsSync(filePath)) {
        return {
          fileId,
          fileName,
          scanned: false,
          infected: false,
          scanDuration: Date.now() - start,
          scanner: this.name,
          scannedAt: new Date().toISOString(),
          error: 'File not found',
        };
      }

      const buffer = fs.readFileSync(filePath);
      return this.scanBuffer(buffer, fileId, fileName);
    } catch (error: any) {
      return {
        fileId,
        fileName,
        scanned: false,
        infected: false,
        scanDuration: Date.now() - start,
        scanner: this.name,
        scannedAt: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  async scanBuffer(buffer: Buffer, fileId: string, fileName: string): Promise<ScanResult> {
    const start = Date.now();

    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(this.timeout);

      let response = '';

      socket.connect(this.port, this.host, () => {
        // Send INSTREAM command
        socket.write('zINSTREAM\0');

        // Send file data in chunks (max 2MB per chunk)
        const CHUNK_SIZE = 2 * 1024 * 1024;
        let offset = 0;

        while (offset < buffer.length) {
          const chunk = buffer.slice(offset, offset + CHUNK_SIZE);
          const lengthBuf = Buffer.alloc(4);
          lengthBuf.writeUInt32BE(chunk.length, 0);
          socket.write(lengthBuf);
          socket.write(chunk);
          offset += CHUNK_SIZE;
        }

        // Send terminator (4 zero bytes)
        const terminator = Buffer.alloc(4, 0);
        socket.write(terminator);
      });

      socket.on('data', (data) => {
        response += data.toString();
      });

      socket.on('end', () => {
        const trimmed = response.trim().replace(/\0/g, '');
        const infected = trimmed.includes('FOUND');
        const virusName = infected
          ? trimmed.replace('stream: ', '').replace(' FOUND', '')
          : undefined;

        resolve({
          fileId,
          fileName,
          scanned: true,
          infected,
          virusName,
          scanDuration: Date.now() - start,
          scanner: this.name,
          scannedAt: new Date().toISOString(),
        });
      });

      socket.on('error', (err) => {
        socket.destroy();
        resolve({
          fileId,
          fileName,
          scanned: false,
          infected: false,
          scanDuration: Date.now() - start,
          scanner: this.name,
          scannedAt: new Date().toISOString(),
          error: `ClamAV connection error: ${err.message}`,
        });
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          fileId,
          fileName,
          scanned: false,
          infected: false,
          scanDuration: Date.now() - start,
          scanner: this.name,
          scannedAt: new Date().toISOString(),
          error: 'ClamAV scan timed out',
        });
      });
    });
  }
}
