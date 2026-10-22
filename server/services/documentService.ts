import { db } from '../db.js';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageDir = path.resolve(__dirname, '../../storage/documents');

export interface LegalDocument {
  id: string;
  property_id: string;
  title: string;
  original_filename: string;
  document_type?: string;
  document_number?: string;
  storage_key: string;
  file_size: number;
  mime_type: string;
  review_status: 'Verified' | 'Needs rectification' | 'Awaiting review';
  review_comments: string;
  reviewer_name?: string;
  reviewed_at?: string;
  extracted_text?: string;
  created_at: string;
  updated_at: string;
}

export function logAuditEvent(
  actorName: string,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata?: any
) {
  const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const stmt = db.prepare(`
    INSERT INTO audit_events (id, actor_name, action, resource_type, resource_id, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, actorName, action, resourceType, resourceId, metadata ? JSON.stringify(metadata) : null);
}

export function getDocumentsForProperty(propertyId: string): LegalDocument[] {
  const stmt = db.prepare(`
    SELECT * FROM legal_documents
    WHERE property_id = ?
    ORDER BY created_at ASC
  `);
  return stmt.all(propertyId) as LegalDocument[];
}

export function getDocumentById(id: string): LegalDocument | undefined {
  const stmt = db.prepare('SELECT * FROM legal_documents WHERE id = ?');
  return stmt.get(id) as LegalDocument | undefined;
}

export function updateDocumentStatus(
  id: string,
  status: 'Verified' | 'Needs rectification' | 'Awaiting review',
  comments?: string,
  reviewerName: string = 'Advocate'
): LegalDocument | undefined {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const current = getDocumentById(id);
  if (!current) return undefined;

  const newComments = comments !== undefined ? comments : current.review_comments;

  const updateStmt = db.prepare(`
    UPDATE legal_documents
    SET review_status = ?,
        review_comments = ?,
        reviewer_name = ?,
        reviewed_at = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  updateStmt.run(status, newComments, reviewerName, now, id);

  // Log in document_reviews table
  const revId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const revStmt = db.prepare(`
    INSERT INTO document_reviews (id, document_id, reviewer_name, status, comments, reviewed_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  revStmt.run(revId, id, reviewerName, status, newComments, now);

  logAuditEvent(reviewerName, `STATUS_UPDATE_${status.toUpperCase()}`, 'legal_document', id, {
    previousStatus: current.review_status,
    newStatus: status,
    comments: newComments,
  });

  return getDocumentById(id);
}

export function updateDocumentComments(
  id: string,
  comments: string,
  reviewerName: string = 'Advocate'
): LegalDocument | undefined {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const updateStmt = db.prepare(`
    UPDATE legal_documents
    SET review_comments = ?,
        reviewer_name = ?,
        reviewed_at = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  updateStmt.run(comments, reviewerName, now, id);

  logAuditEvent(reviewerName, 'UPDATE_COMMENTS', 'legal_document', id, { comments });
  return getDocumentById(id);
}

export function renameDocument(
  id: string,
  newTitle: string,
  actorName: string = 'Advocate'
): LegalDocument | undefined {
  const current = getDocumentById(id);
  if (!current) return undefined;

  const trimmed = newTitle.trim();
  if (!trimmed) {
    throw new Error('Document title cannot be empty');
  }

  const updateStmt = db.prepare(`
    UPDATE legal_documents
    SET title = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  updateStmt.run(trimmed, id);

  logAuditEvent(actorName, 'RENAME_DOCUMENT', 'legal_document', id, {
    oldTitle: current.title,
    newTitle: trimmed,
  });

  return getDocumentById(id);
}

export function deleteDocument(
  id: string,
  actorName: string = 'Advocate'
): boolean {
  const current = getDocumentById(id);
  if (!current) return false;

  const deleteStmt = db.prepare('DELETE FROM legal_documents WHERE id = ?');
  deleteStmt.run(id);

  logAuditEvent(actorName, 'DELETE_DOCUMENT', 'legal_document', id, {
    title: current.title,
    original_filename: current.original_filename,
    property_id: current.property_id,
  });

  return true;
}

export function createShareLink(
  documentId: string,
  createdByName: string = 'Advocate',
  expiresInHours: number = 48
): string {
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000)
    .toISOString()
    .replace('T', ' ')
    .substring(0, 19);

  const stmt = db.prepare(`
    INSERT INTO share_links (token, document_id, created_by, expires_at)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(token, documentId, createdByName, expiresAt);

  logAuditEvent(createdByName, 'CREATE_SHARE_LINK', 'legal_document', documentId, {
    expiresAt,
    expiresInHours,
  });

  return token;
}

export function verifyShareLink(token: string): LegalDocument | null {
  const stmt = db.prepare(`
    SELECT d.* FROM share_links s
    JOIN legal_documents d ON d.id = s.document_id
    WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP
  `);
  const doc = stmt.get(token) as LegalDocument | undefined;
  return doc || null;
}
