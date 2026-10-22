import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db, initDatabase } from './db.js';
import {
  getDocumentsForProperty,
  getDocumentById,
  updateDocumentStatus,
  updateDocumentComments,
  renameDocument,
  deleteDocument,
  createShareLink,
  verifyShareLink,
  logAuditEvent,
} from './services/documentService.js';
import { searchPlots, PlotSearchParams } from './services/aiSearchService.js';
import { getLegalAiHistory, askLegalAi } from './services/legalAiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

initDatabase();

export const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(cors());
app.use(express.json());

const storageDir = path.resolve(__dirname, '../storage/documents');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// Multer storage configuration for uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, storageDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitized}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.pdf') || file.originalname.endsWith('.png')) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload a PDF, PNG, JPG, or DOC file.'));
    }
  },
});

// Authentication stub (matching Advocate / Legal Advisor session)
app.get('/api/auth/me', (_req, res) => {
  res.json({
    user: {
      id: 'usr-advocate',
      name: 'Advocate',
      role: 'Legal Advisor',
      email: 'advocate@legalhub.com',
    },
  });
});

app.post('/api/auth/signout', (_req, res) => {
  logAuditEvent('Advocate', 'SIGN_OUT', 'user', 'usr-advocate');
  res.json({ success: true, message: 'Signed out successfully' });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Projects list
app.get('/api/projects', (_req, res) => {
  const rows = db.prepare('SELECT * FROM projects ORDER BY name ASC').all();
  res.json(rows);
});

// Properties list with document counts
app.get('/api/properties', (req, res) => {
  const { search, status } = req.query;

  let query = `
    SELECT
      p.*,
      COUNT(d.id) as doc_count,
      SUM(CASE WHEN d.review_status = 'Verified' THEN 1 ELSE 0 END) as verified_count,
      SUM(CASE WHEN d.review_status = 'Needs rectification' THEN 1 ELSE 0 END) as rectification_count
    FROM properties p
    LEFT JOIN legal_documents d ON d.property_id = p.id
  `;

  const where: string[] = [];
  const params: any[] = [];

  if (search && typeof search === 'string' && search.trim()) {
    where.push('(p.name LIKE ? OR p.identifier LIKE ?)');
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }

  if (status && typeof status === 'string' && status !== 'All statuses') {
    where.push('p.current_status = ?');
    params.push(status);
  }

  if (where.length > 0) {
    query += ` WHERE ${where.join(' AND ')}`;
  }

  query += ` GROUP BY p.id ORDER BY p.identifier DESC`;

  const properties = db.prepare(query).all(...params);
  res.json(properties);
});

// Single property details
app.get('/api/properties/:id', (req, res) => {
  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
  if (!property) {
    return res.status(404).json({ error: 'Property not found' });
  }
  res.json(property);
});

// Update property status
app.patch('/api/properties/:id/status', (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  const stmt = db.prepare(`
    UPDATE properties
    SET current_status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(status, req.params.id);
  logAuditEvent('Advocate', 'UPDATE_PROPERTY_STATUS', 'property', req.params.id, { newStatus: status });
  const updated = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Documents for a property
app.get('/api/properties/:id/documents', (req, res) => {
  const docs = getDocumentsForProperty(req.params.id);
  res.json(docs);
});

// Upload document
app.post('/api/properties/:id/documents', upload.single('file'), (req, res) => {
  try {
    const propertyId = req.params.id;
    const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const { title, document_type, document_number } = req.body;
    const docTitle = (title && title.trim()) || req.file.originalname;
    const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const stmt = db.prepare(`
      INSERT INTO legal_documents (
        id, property_id, title, original_filename, document_type, document_number,
        storage_key, file_size, mime_type, review_status, review_comments, reviewer_name, extracted_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Awaiting review', '', 'Advocate', ?)
    `);

    stmt.run(
      docId,
      propertyId,
      docTitle,
      req.file.originalname,
      document_type || 'General Legal Document',
      document_number || null,
      req.file.filename,
      req.file.size,
      req.file.mimetype,
      `Extracted content from ${req.file.originalname}`
    );

    logAuditEvent('Advocate', 'UPLOAD_DOCUMENT', 'legal_document', docId, {
      title: docTitle,
      filename: req.file.originalname,
      propertyId,
    });

    const created = getDocumentById(docId);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to upload document' });
  }
});

// Update document status
app.patch('/api/documents/:id/status', (req, res) => {
  const { status, comments, reviewer_name } = req.body;
  if (!status || !['Verified', 'Needs rectification', 'Awaiting review'].includes(status)) {
    return res.status(400).json({ error: 'Valid status is required' });
  }

  const updated = updateDocumentStatus(
    req.params.id,
    status,
    comments,
    reviewer_name || 'Advocate'
  );

  if (!updated) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json(updated);
});

// Update document comments
app.patch('/api/documents/:id/comments', (req, res) => {
  const { comments, reviewer_name } = req.body;
  if (comments === undefined) {
    return res.status(400).json({ error: 'Comments field is required' });
  }

  const updated = updateDocumentComments(
    req.params.id,
    comments,
    reviewer_name || 'Advocate'
  );

  if (!updated) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json(updated);
});

// Rename document
app.patch('/api/documents/:id/rename', (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'New title is required' });
  }

  try {
    const updated = renameDocument(req.params.id, title);
    if (!updated) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Delete document
app.delete('/api/documents/:id', (req, res) => {
  const success = deleteDocument(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json({ success: true, message: 'Document removed successfully' });
});

// Download document
app.get('/api/documents/:id/download', (req, res) => {
  const doc = getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const filePath = path.join(storageDir, doc.storage_key);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Stored document file not found on server' });
  }

  logAuditEvent('Advocate', 'DOWNLOAD_DOCUMENT', 'legal_document', doc.id, {
    filename: doc.original_filename,
  });

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.original_filename)}"`);
  res.setHeader('Content-Type', doc.mime_type || 'application/pdf');
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

// View / preview document file stream
app.get('/api/documents/:id/view', (req, res) => {
  const doc = getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const filePath = path.join(storageDir, doc.storage_key);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Stored file not found' });
  }

  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.original_filename)}"`);
  res.setHeader('Content-Type', doc.mime_type || 'application/pdf');
  fs.createReadStream(filePath).pipe(res);
});

// Share document (create authorized token)
app.post('/api/documents/:id/share', (req, res) => {
  const doc = getDocumentById(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const token = createShareLink(doc.id, 'Advocate', 48);
  const shareUrl = `${req.protocol}://${req.get('host')}/shared/${token}`;
  res.json({ token, shareUrl, expires_in: '48 hours' });
});

// Verify share link
app.get('/api/share/:token', (req, res) => {
  const doc = verifyShareLink(req.params.token);
  if (!doc) {
    return res.status(404).json({ error: 'Share link has expired or is invalid.' });
  }
  res.json(doc);
});

// Download shared document
app.get('/api/share/:token/download', (req, res) => {
  const doc = verifyShareLink(req.params.token);
  if (!doc) {
    return res.status(404).json({ error: 'Share link has expired or is invalid.' });
  }

  const filePath = path.join(storageDir, doc.storage_key);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.original_filename)}"`);
  res.setHeader('Content-Type', doc.mime_type || 'application/pdf');
  fs.createReadStream(filePath).pipe(res);
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', (_req, res) => {
  const totalProperties = (db.prepare('SELECT COUNT(*) as count FROM properties').get() as any).count;
  const totalDocs = (db.prepare('SELECT COUNT(*) as count FROM legal_documents').get() as any).count;
  const verifiedDocs = (db.prepare("SELECT COUNT(*) as count FROM legal_documents WHERE review_status = 'Verified'").get() as any).count;
  const pendingDocs = (db.prepare("SELECT COUNT(*) as count FROM legal_documents WHERE review_status != 'Verified'").get() as any).count;
  const rectificationDocs = (db.prepare("SELECT COUNT(*) as count FROM legal_documents WHERE review_status = 'Needs rectification'").get() as any).count;

  const recentAudits = db.prepare(`
    SELECT * FROM audit_events
    ORDER BY timestamp DESC
    LIMIT 6
  `).all();

  const propertiesSummary = db.prepare(`
    SELECT
      p.id,
      p.identifier,
      p.name,
      p.location,
      p.current_status,
      COUNT(d.id) as doc_count,
      SUM(CASE WHEN d.review_status = 'Verified' THEN 1 ELSE 0 END) as verified_count
    FROM properties p
    LEFT JOIN legal_documents d ON d.property_id = p.id
    GROUP BY p.id
    ORDER BY p.identifier DESC
  `).all();

  res.json({
    totalProperties,
    totalDocs,
    verifiedDocs,
    pendingDocs,
    rectificationDocs,
    recentAudits,
    propertiesSummary,
  });
});

// AI Search endpoint
app.get('/api/plots/search', (req, res) => {
  const {
    projectId,
    nlQuery,
    sizeOperator,
    sizeValue,
    sizeUnit,
    roadWidthFt,
  } = req.query;

  const params: PlotSearchParams = {
    projectId: projectId as string,
    nlQuery: nlQuery as string,
    sizeOperator: sizeOperator as any,
    sizeValue: sizeValue ? parseFloat(sizeValue as string) : undefined,
    sizeUnit: (sizeUnit as any) || 'cents',
    roadWidthFt: roadWidthFt ? parseFloat(roadWidthFt as string) : undefined,
  };

  const results = searchPlots(params);
  res.json(results);
});

// Legal AI History
app.get('/api/properties/:id/legal-ai', (req, res) => {
  const history = getLegalAiHistory(req.params.id);
  res.json(history);
});

// Ask Legal AI
app.post('/api/properties/:id/legal-ai', async (req, res) => {
  const { question } = req.body;
  if (!question || !question.trim()) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    const result = await askLegalAi(req.params.id, question.trim(), 'Advocate');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Legal AI query failed' });
  }
});

// Start server if executed directly
const distDir = path.resolve(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(distDir, 'index.html'));
    }
    next();
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mainServer = app.listen(PORT, () => {
    console.log(`Properties Legal Server running at http://localhost:${PORT}`);
  });

  mainServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${PORT} in use, attempting fallback port...`);
      const fallback = PORT === 3000 ? 3001 : 3000;
      app.listen(fallback, () => {
        console.log(`Properties Legal Server running at http://localhost:${fallback}`);
      });
    }
  });

  // Also bind to 3001 if primary is 3000, so both ports work simultaneously
  if (PORT === 3000) {
    try {
      const s3001 = app.listen(3001, () => {
        console.log(`Properties Legal Server also listening at http://localhost:3001`);
      });
      s3001.on('error', () => {
        // Safe ignore if 3001 is already bound
      });
    } catch {
      // Ignore
    }
  }
}
