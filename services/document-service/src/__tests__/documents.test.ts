import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../index';
import http from 'http';
import path from 'path';
import fs from 'fs';

let server: http.Server;
let baseUrl: string;

function request(method: string, urlPath: string, body?: any): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, baseUrl);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode || 0, data: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode || 0, data: d }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Multipart form data upload helper
function uploadFile(
  urlPath: string,
  fileName: string,
  fileContent: Buffer,
  fields: Record<string, string> = {}
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const boundary = '----TestBoundary' + Date.now();
    const url = new URL(urlPath, baseUrl);

    let body = '';
    // Add fields
    for (const [key, value] of Object.entries(fields)) {
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
      body += `${value}\r\n`;
    }
    // Add file
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`;
    body += `Content-Type: application/octet-stream\r\n\r\n`;

    const bodyStart = Buffer.from(body, 'utf8');
    const bodyEnd = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
    const fullBody = Buffer.concat([bodyStart, fileContent, bodyEnd]);

    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullBody.length,
      },
    };

    const req = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode || 0, data: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode || 0, data: d }); }
      });
    });
    req.on('error', reject);
    req.write(fullBody);
    req.end();
  });
}

describe('Document Service - /api/documents', () => {
  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://localhost:${(server.address() as any).port}`;
        resolve();
      });
    });
  });

  afterAll(() => { server?.close(); });

  describe('POST /api/documents/upload', () => {
    it('accepts multipart PDF file upload', async () => {
      const fileContent = Buffer.from('%PDF-1.4 fake pdf content');
      const res = await uploadFile(
        '/api/documents/upload',
        'bank-statement.pdf',
        fileContent,
        { applicationId: 'app-001', category: 'bank_statement' }
      );

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.id).toBeDefined();
      expect(res.data.data.fileName).toBe('bank-statement.pdf');
      expect(res.data.data.category).toBe('bank_statement');
      expect(res.data.data.status).toBe('uploaded');
    });

    it('accepts PNG image upload', async () => {
      const fileContent = Buffer.from('fake png content');
      const res = await uploadFile(
        '/api/documents/upload',
        'id-photo.png',
        fileContent,
        { applicationId: 'app-001' }
      );

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.fileName).toBe('id-photo.png');
    });

    it('accepts JPG image upload', async () => {
      const fileContent = Buffer.from('fake jpg content');
      const res = await uploadFile(
        '/api/documents/upload',
        'payslip.jpg',
        fileContent,
        { applicationId: 'app-002' }
      );

      expect(res.status).toBe(201);
      expect(res.data.data.fileName).toBe('payslip.jpg');
    });

    it('rejects disallowed file types', async () => {
      const fileContent = Buffer.from('malicious script');
      const res = await uploadFile(
        '/api/documents/upload',
        'malware.exe',
        fileContent,
        { applicationId: 'app-001' }
      );

      // Multer rejects with an error - returns 500 or error status
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('defaults category to "other" when not specified', async () => {
      const fileContent = Buffer.from('some doc content');
      const res = await uploadFile(
        '/api/documents/upload',
        'misc.pdf',
        fileContent,
        { applicationId: 'app-001' }
      );

      expect(res.status).toBe(201);
      expect(res.data.data.category).toBe('other');
    });
  });

  describe('POST /api/documents/:id/scan', () => {
    it('triggers virus scan and returns clean status for safe file', async () => {
      // Upload a file first
      const fileContent = Buffer.from('safe file content');
      const uploadRes = await uploadFile(
        '/api/documents/upload',
        'safe-document.pdf',
        fileContent,
        { applicationId: 'app-001' }
      );
      const docId = uploadRes.data.data.id;

      // Trigger scan
      const scanRes = await request('POST', `/api/documents/${docId}/scan`);

      expect(scanRes.status).toBe(200);
      expect(scanRes.data.success).toBe(true);
      expect(scanRes.data.data.status).toBe('clean');
      expect(scanRes.data.data.scanResult.infected).toBe(false);
    });

    it('flags files with "virus" in filename as infected', async () => {
      const fileContent = Buffer.from('test virus content');
      const uploadRes = await uploadFile(
        '/api/documents/upload',
        'virus-sample.pdf',
        fileContent,
        { applicationId: 'app-001' }
      );
      const docId = uploadRes.data.data.id;

      const scanRes = await request('POST', `/api/documents/${docId}/scan`);

      expect(scanRes.status).toBe(200);
      expect(scanRes.data.data.status).toBe('quarantined');
      expect(scanRes.data.data.scanResult.infected).toBe(true);
    });

    it('flags files with "eicar" in filename as infected', async () => {
      const fileContent = Buffer.from('eicar test content');
      const uploadRes = await uploadFile(
        '/api/documents/upload',
        'eicar-test.pdf',
        fileContent,
        { applicationId: 'app-001' }
      );
      const docId = uploadRes.data.data.id;

      const scanRes = await request('POST', `/api/documents/${docId}/scan`);

      expect(scanRes.status).toBe(200);
      expect(scanRes.data.data.status).toBe('quarantined');
      expect(scanRes.data.data.scanResult.infected).toBe(true);
    });

    it('returns 404 when scanning non-existent document', async () => {
      const res = await request('POST', '/api/documents/nonexistent-id/scan');

      expect(res.status).toBe(404);
      expect(res.data.success).toBe(false);
      expect(res.data.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/documents/:id/scan-status', () => {
    it('returns scan status for a scanned document', async () => {
      const fileContent = Buffer.from('content to check');
      const uploadRes = await uploadFile(
        '/api/documents/upload',
        'check-status.pdf',
        fileContent,
        { applicationId: 'app-001' }
      );
      const docId = uploadRes.data.data.id;

      // Scan it
      await request('POST', `/api/documents/${docId}/scan`);

      // Check status
      const res = await request('GET', `/api/documents/${docId}/scan-status`);

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.status).toBe('clean');
    });
  });
});
