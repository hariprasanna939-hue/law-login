# AMI Properties — Land & Legal Due Diligence Application

Recreation of the AMI Properties web application based on the reference screen recording.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Database
```bash
npm run seed
```

### 3. Run in Development Mode
```bash
npm run dev
```
- Client runs on `http://localhost:3000`
- API server runs on `http://localhost:3001`

### 4. Build & Run in Production Mode
```bash
npm run build
npx tsx server/index.ts
```
Serves the full-stack app on `http://localhost:3001`.

### 5. Run Automated Tests
```bash
npm test
```

---

## Implemented Modules

1. **Application Shell & Design System**:
   - Left Navigation Sidebar with AMI Properties gold cube branding.
   - Dark filled active navigation pill (`Dashboard`, `Land & Legal`, `AI Search`).
   - Profile Section with `Advocate Mansoor`, `Legal Advisor`, and `Sign out`.
   - Top Header with Breadcrumbs (`AMI Properties / Land & Legal`), Info dialog, and `Install App`.
   - Responsive drawer for mobile and tablet viewports.

2. **Module A — Dashboard**:
   - Portfolio overview metrics backed by live SQLite database records.
   - Clearance rate progress bars for all 5 land properties.
   - Recent legal audit trail with timestamps and reviewer identities.

3. **Module B — Land & Legal (`/land-legal`)**:
   - `LAND — LEGAL DUE DILIGENCE` subtitle and `Legal Due Diligence` heading.
   - Real-time search (`Search code or name...`).
   - Status dropdown filter (`All statuses`, `Open`, `In Progress`, `Verified`, `Needs rectification`).
   - 4-column responsive grid matching exact reference cards (`LND-26-00001` through `LND-26-00005`).
   - Document counts, verification ratios (`15/16 verified`), `Legal AI` pill shortcut, time in status (`3d in status`).

4. **Module C — Document Review Modal**:
   - Centered vertically scrollable modal with dimmed backdrop.
   - Property metadata: `Current status: Open`, `Time in status: 3 days`, `Identified by: Broker — Satyaseelan`, `Documents: 16`.
   - Top filter buttons: `Mark verified`, `Needs rectification`.
   - Document items: title, clickable original filename to launch document viewer, status badges (Verified green, Needs rectification amber, Awaiting review gray).
   - Document actions: `Rename`, `Download` (serves stored PDF), `Share` (48-hour secure token link), `Delete` (red styling with confirmation).
   - Live reviewer remarks textarea.
   - Status toggle actions: `Verified ✓`, `Needs rectification`.
   - Document upload area with validation and progress state.
   - Primary `Update Status` button.

5. **Module D — AI Search (`/ai-search`)**:
   - Heading: `Search plots in plain language`.
   - Project selector defaulting to `All projects` with individual project options.
   - Wide natural-language search bar with placeholder `e.g. northeast plots that are available`.
   - Structured filter card:
     - Plot size operator (`More than`, `Less than`, `Equal to` within 2%), numeric input, unit selector (`Cents`, `Sq.Ft.`, `Acres`).
     - Facing road width input in feet.
     - Helper text: `1 cent = 435.6 sq.ft. "Equal to" finds plots within 2% of the size... A 9 m road counts as 30 feet.`
   - Database-backed plot search returning real records with direction, availability, price, and details modal.

6. **Module E — Legal AI Assistant**:
   - Integrated in modal and available via card pills.
   - Subtitle: `Ask about these documents`, `Not a substitute for legal advice.`
   - Suggested prompts: `Build ownership chain flow chart`, `What is the name of the purchaser`, `Identify missing legal records`.
   - Grounded Q&A generating structured markdown tables (Ownership / Title History Table) and advocate caution notes.
   - History feed with dates (`19 Oct`, `22 Oct`).

7. **Module F — Document Viewer & Text Extraction**:
   - Dedicated viewer interface matching reference: top bar with pagination (`1 / 10`), zoom (`- 100% +`), rotate, download, and print.
   - Toast notification: `Extracting text from PDF...`.
   - Document canvas rendering vintage stamp paper deed and toggleable OCR extracted text.

8. **Security, Persistence & Audit**:
   - SQLite relational schema (`properties`, `legal_documents`, `document_reviews`, `plots`, `projects`, `users`, `audit_events`, `share_links`).
   - Audit logging for all status changes, renames, uploads, shares, and deletions.
