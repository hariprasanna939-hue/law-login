import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'ami_properties.db');
export const db = new Database(dbPath);

// Enable foreign keys and WAL mode for reliability
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'Legal Advisor',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      identifier TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      location TEXT,
      identified_by TEXT,
      current_status TEXT NOT NULL DEFAULT 'Open',
      time_in_status TEXT DEFAULT '3 days',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS legal_documents (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL,
      title TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      document_type TEXT,
      document_number TEXT,
      storage_key TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      mime_type TEXT DEFAULT 'application/pdf',
      review_status TEXT NOT NULL DEFAULT 'Awaiting review',
      review_comments TEXT DEFAULT '',
      reviewer_name TEXT,
      reviewed_at DATETIME,
      extracted_text TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS document_reviews (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      reviewer_id TEXT,
      reviewer_name TEXT NOT NULL,
      status TEXT NOT NULL,
      comments TEXT,
      reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES legal_documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      actor_id TEXT,
      actor_name TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      metadata TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS share_links (
      token TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES legal_documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS plots (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      property_id TEXT,
      plot_number TEXT NOT NULL,
      size_cents REAL NOT NULL,
      size_sqft REAL NOT NULL,
      road_width_ft REAL NOT NULL,
      direction TEXT NOT NULL,
      availability TEXT NOT NULL DEFAULT 'Available',
      price_inr INTEGER DEFAULT 0,
      metadata TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS legal_ai_queries (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      date_label TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    );
  `);
}
