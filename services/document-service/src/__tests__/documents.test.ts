// The scanner now fails closed: 'auto' with no ClamAV throws rather than
// silently using the placeholder. Tests opt into the placeholder explicitly.
process.env.SCANNER_MODE = 'placeholder';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../index';
import { getDatabase } from '@aib-iaas/database';
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
    // Document metadata now persists in SQLite and application_id carries a
    // foreign key to applications(id). Seed the parent rows the uploads below
    // reference so a supplied, non-null applicationId satisfies the FK (an orphan
    // upload with no applicationId is stored NULL and needs no parent).
    const db = getDatabase();
    const insertApp = db.prepare(
      "INSERT OR IGNORE INTO applications (id, reference_number, status, created_at, updated_at) VALUES (?, ?, 'draft', datetime('now'), datetime('now'))"
    );
    for (const id of ['app-001', 'app-002']) insertApp.run(id, `TEST-${id}`);

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

  describe('GET /api/documents/:id (repo-backed metadata)', () => {
    it('persists and returns the application link and metadata', async () => {
      const upload = await uploadFile(
        '/api/documents/upload',
        'linked-evidence.pdf',
        Buffer.from('%PDF-1.4 linked'),
        { applicationId: 'app-001', category: 'income_evidence' }
      );
      const docId = upload.data.data.id;

      const res = await request('GET', `/api/documents/${docId}`);
      expect(res.status).toBe(200);
      expect(res.data.data.applicationId).toBe('app-001');
      expect(res.data.data.fileName).toBe('linked-evidence.pdf');
      expect(res.data.data.category).toBe('income_evidence');
      expect(res.data.data.status).toBe('uploaded');
      expect(res.data.data.uploadedAt).toBeDefined();
      // storage path is internal and must not leak in the metadata response
      expect(res.data.data.storagePath).toBeUndefined();
      expect(res.data.data.filePath).toBeUndefined();
    });

    it('stores an upload with no applicationId as an unlinked (NULL) document', async () => {
      const upload = await uploadFile(
        '/api/documents/upload',
        'orphan-evidence.pdf',
        Buffer.from('%PDF-1.4 orphan'),
        { category: 'other' }
      );
      expect(upload.status).toBe(201);
      const res = await request('GET', `/api/documents/${upload.data.data.id}`);
      expect(res.status).toBe(200);
      expect(res.data.data.applicationId).toBeNull();
    });

    it('returns 404 for an unknown document id', async () => {
      const res = await request('GET', '/api/documents/no-such-doc');
      expect(res.status).toBe(404);
      expect(res.data.error.code).toBe('NOT_FOUND');
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

  describe('GET /api/documents/:id/download (fail-closed, M5)', () => {
    it('withholds a file that has not been scanned (409)', async () => {
      const upload = await uploadFile('/api/documents/upload', 'unscanned.pdf', Buffer.from('safe content'), { applicationId: 'app-001' });
      const docId = upload.data.data.id;

      const res = await request('GET', `/api/documents/${docId}/download`);
      expect(res.status).toBe(409);
      expect(res.data.error.code).toBe('NOT_CLEAN');
    });

    it('withholds a quarantined file (409)', async () => {
      const upload = await uploadFile('/api/documents/upload', 'infected.pdf', Buffer.from('this is a virus payload'), { applicationId: 'app-001' });
      const docId = upload.data.data.id;
      const scan = await request('POST', `/api/documents/${docId}/scan`);
      expect(scan.data.data.status).toBe('quarantined');

      const res = await request('GET', `/api/documents/${docId}/download`);
      expect(res.status).toBe(409);
    });

    it('allows download once a scan has confirmed the file clean', async () => {
      const upload = await uploadFile('/api/documents/upload', 'clean.pdf', Buffer.from('%PDF-1.4 entirely benign content'), { applicationId: 'app-001' });
      const docId = upload.data.data.id;
      const scan = await request('POST', `/api/documents/${docId}/scan`);
      expect(scan.data.data.status).toBe('clean');

      const res = await request('GET', `/api/documents/${docId}/download`);
      expect(res.status).toBe(200);
    });
  });
});
