import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import { createRepositories } from '@aib-iaas/database';

export const documentsRouter = Router();

const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '10') * 1024 * 1024;

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_PATH),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not allowed`));
    }
  },
});

// Document metadata + scan state now persist in SQLite via DocumentRepository
// (previously an in-memory Map, lost on every restart). The file bytes still live
// on disk; only the metadata/scan-state moved, so an upload — and its clean/
// quarantined verdict — survives a service restart. The scan_status column carries
// the route's lifecycle vocabulary ('uploaded' | 'scanning' | 'clean' |
// 'quarantined' | 'scan_failed'); scan_result holds the JSON scanner report.
const { documents } = createRepositories();

// Upload document
documentsRouter.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
    return;
  }

  // The public /apply upload step runs before an application row exists, so
  // applicationId is often absent — stored as NULL (a document not yet linked to a
  // case). A supplied id is FK-validated: an unknown one fails here, so the file is
  // removed rather than orphaned on disk.
  let doc;
  try {
    doc = documents.create({
      applicationId: req.body.applicationId || null,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      category: req.body.category || 'other',
      storagePath: req.file.path,
    });
  } catch {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(400).json({ success: false, error: { code: 'INVALID_APPLICATION', message: 'Document could not be linked to the given application.' } });
    return;
  }

  // create() defaults scan_status to 'pending'; move it to the route's 'uploaded'
  // (awaiting scan) so the status vocabulary stays consistent with pre-DB behaviour.
  documents.updateScanStatus(doc.id, 'uploaded');

  res.status(201).json({
    success: true,
    data: { id: doc.id, fileName: doc.originalName, fileSize: doc.size, category: doc.category, status: 'uploaded' },
  });
});

// Get document metadata
documentsRouter.get('/:id', (req: Request, res: Response) => {
  const doc = documents.findById(req.params.id);
  if (!doc) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
    return;
  }
  res.json({
    success: true,
    data: {
      id: doc.id,
      applicationId: doc.applicationId,
      fileName: doc.originalName,
      fileType: doc.mimeType,
      fileSize: doc.size,
      category: doc.category,
      status: doc.scanStatus,
      uploadedAt: doc.uploadedAt,
    },
  });
});

// Download document — only ever serve a file that passed a virus scan.
// Previously any uploaded file could be downloaded, including one that was never
// scanned or was quarantined (M5 / GAP-014). Authentication/authorisation for
// this route is enforced upstream by the gateway (documents.read); this gate is
// the content-safety half: withhold anything not confirmed clean.
documentsRouter.get('/:id/download', (req: Request, res: Response) => {
  const doc = documents.findById(req.params.id);
  if (!doc) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
    return;
  }
  const scanned = doc.scanResult && doc.scanResult.scanned === true;
  if (doc.scanStatus !== 'clean' || !scanned) {
    res.status(409).json({
      success: false,
      error: { code: 'NOT_CLEAN', message: 'Document is not available until it has passed a virus scan.' },
    });
    return;
  }
  res.download(doc.storagePath, doc.originalName);
});

// Delete document
documentsRouter.delete('/:id', (req: Request, res: Response) => {
  const doc = documents.findById(req.params.id);
  if (!doc) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
    return;
  }
  if (fs.existsSync(doc.storagePath)) fs.unlinkSync(doc.storagePath);
  documents.delete(req.params.id);
  res.json({ success: true, data: { deleted: true } });
});

// Trigger virus scan - uses ClamAV if available, else placeholder
documentsRouter.post('/:id/scan', async (req: Request, res: Response) => {
  const doc = documents.findById(req.params.id);
  if (!doc) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
    return;
  }

  documents.updateScanStatus(doc.id, 'scanning');

  try {
    const { getScanner } = await import('../scanner/index');
    const scanner = await getScanner();
    const result = await scanner.scanFile(doc.storagePath, doc.id, doc.originalName);

    // Compute status from BOTH flags. 'clean' requires a scan that actually ran
    // and found nothing; a scan that did not run is 'scan_failed', never clean
    // (closes the fail-open where !scanned was recorded as clean).
    let status: string;
    if (!result.scanned) {
      status = 'scan_failed';
    } else if (result.infected) {
      status = 'quarantined';
    } else {
      status = 'clean';
    }
    documents.updateScanStatus(doc.id, status, result);

    res.json({
      success: true,
      data: {
        id: doc.id,
        status,
        scanResult: result,
      },
    });
  } catch (error: any) {
    documents.updateScanStatus(doc.id, 'uploaded'); // Reset on failure
    res.status(500).json({
      success: false,
      error: { code: 'SCAN_FAILED', message: `Virus scan failed: ${error.message}` },
    });
  }
});

// Scan status endpoint
documentsRouter.get('/:id/scan-status', (req: Request, res: Response) => {
  const doc = documents.findById(req.params.id);
  if (!doc) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
    return;
  }
  res.json({
    success: true,
    data: { id: doc.id, status: doc.scanStatus, scanResult: doc.scanResult || null },
  });
});
