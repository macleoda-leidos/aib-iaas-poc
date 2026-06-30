import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';

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

// In-memory document registry (would use DB in production)
const documentRegistry = new Map<string, any>();

// Upload document
documentsRouter.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
    return;
  }

  const docId = uuid();
  const doc = {
    id: docId,
    applicationId: req.body.applicationId,
    fileName: req.file.originalname,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
    filePath: req.file.path,
    category: req.body.category || 'other',
    status: 'uploaded',
    uploadedAt: new Date().toISOString(),
  };

  documentRegistry.set(docId, doc);

  res.status(201).json({
    success: true,
    data: { id: docId, fileName: doc.fileName, fileSize: doc.fileSize, category: doc.category, status: doc.status },
  });
});

// Get document metadata
documentsRouter.get('/:id', (req: Request, res: Response) => {
  const doc = documentRegistry.get(req.params.id);
  if (!doc) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
    return;
  }
  const { filePath, ...metadata } = doc;
  res.json({ success: true, data: metadata });
});

// Download document
documentsRouter.get('/:id/download', (req: Request, res: Response) => {
  const doc = documentRegistry.get(req.params.id);
  if (!doc) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
    return;
  }
  res.download(doc.filePath, doc.fileName);
});

// Delete document
documentsRouter.delete('/:id', (req: Request, res: Response) => {
  const doc = documentRegistry.get(req.params.id);
  if (!doc) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
    return;
  }
  if (fs.existsSync(doc.filePath)) fs.unlinkSync(doc.filePath);
  documentRegistry.delete(req.params.id);
  res.json({ success: true, data: { deleted: true } });
});

// Trigger virus scan - uses ClamAV if available, else placeholder
documentsRouter.post('/:id/scan', async (req: Request, res: Response) => {
  const doc = documentRegistry.get(req.params.id);
  if (!doc) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
    return;
  }

  doc.status = 'scanning';

  try {
    const { getScanner } = await import('../scanner/index');
    const scanner = await getScanner();
    const result = await scanner.scanFile(doc.filePath, doc.id, doc.fileName);

    doc.status = result.infected ? 'quarantined' : 'clean';
    doc.scanResult = result;

    res.json({
      success: true,
      data: {
        id: doc.id,
        status: doc.status,
        scanResult: result,
      },
    });
  } catch (error: any) {
    doc.status = 'uploaded'; // Reset on failure
    res.status(500).json({
      success: false,
      error: { code: 'SCAN_FAILED', message: `Virus scan failed: ${error.message}` },
    });
  }
});

// Scan status endpoint
documentsRouter.get('/:id/scan-status', (req: Request, res: Response) => {
  const doc = documentRegistry.get(req.params.id);
  if (!doc) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
    return;
  }
  res.json({
    success: true,
    data: { id: doc.id, status: doc.status, scanResult: doc.scanResult || null },
  });
});
