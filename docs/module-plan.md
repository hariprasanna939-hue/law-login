# Module Implementation Plan: Properties Land & Legal

## 1. Architecture Overview

### Technology Stack
- **Frontend**: Vite 6 + React 19 + TypeScript + Tailwind CSS (v3/v4 compatible) + Lucide Icons.
- **Backend & API**: Node.js + Express + SQLite (or better-sqlite3) with Prisma/Drizzle-style clean SQL database model.
- **Storage**: Local file storage under `storage/documents/` with content-type verification, secure tokens for download/sharing, and simulated/real text extraction.
- **AI Integration**:
  - LLM integration with Google Gemini SDK (`@google/genai`) or OpenAI for natural-language query decomposition and document-grounded legal Q&A.
  - Robust deterministic fallback when `GEMINI_API_KEY` is not provided:
    - Regex & rules-based natural-language plot query parser.
    - Grounded keyword/TF-IDF document search with structured legal chain templates.
- **Authentication**: JWT/Session authentication with `Advocate` (`Legal Advisor`) and admin roles, protected routes, and audit trails.

---

## 2. Phase-by-Phase Implementation Plan

### Phase 1: Reference Audit & Codebase Initialization
- [x] Complete video keyframe audit and crop analysis.
- [x] Create `docs/reference-audit.md`, `docs/module-plan.md`, `docs/test-checklist.md`.
- [ ] Initialize repository structure with Vite + React + TypeScript + Tailwind CSS + Express backend.

### Phase 2: Design System & Core Shell
- [ ] Implement design tokens: exact colors, typography, borders, subtle shadows.
- [ ] Create `AppShell`, `AppSidebar`, `AppHeader`, `Breadcrumbs`, and `UserBadge`.
- [ ] Implement responsive layout with collapsible sidebar and mobile drawer.
- [ ] Setup routing: `/dashboard`, `/land-legal`, `/ai-search`.

### Phase 3: Module A — Dashboard
- [ ] Real database summary: Total land files, verified document percentage, rectification needed counts, recent activity.
- [ ] Interactive land parcel cards and progress meters.
- [ ] Quick navigation to property legal reviews.
- [ ] Empty, loading, and error states.

### Phase 4: Module B — Land & Legal
- [ ] Page heading, subtitle `LAND — LEGAL DUE DILIGENCE`.
- [ ] Search input for property name or code with debouncing.
- [ ] Status dropdown filtering (`All statuses`, `Open`, `In Progress`, `Verified`, etc.).
- [ ] Property cards grid (4-column responsive) displaying codes (`LND-26-00001` .. `LND-26-00005`), verification ratio pills, `Legal AI` pill, time in status.
- [ ] Live document counter (`5 of 5 land files`).

### Phase 5: Module C — Document Review Modal
- [ ] Property metadata header: Status, time in status, identified by broker, document count.
- [ ] Status quick filters (`Mark verified`, `Needs rectification`).
- [ ] Scrollable document list item cards with:
  - Title, original filename, clickable document preview.
  - Review status badge (Verified green, Needs rectification amber, Awaiting review gray).
  - Actions: Rename, Download, Share, Delete.
  - Remarks / Comments input with live persistence.
  - Last reviewed by audit stamp.
  - One-click `Verified ✓` and `Needs rectification` status toggles.
- [ ] Document upload section: File selector, custom name input, validation, progress.
- [ ] `Update Status` primary button.

### Phase 6: Module D — AI Search
- [ ] Subtitle `AI SEARCH`, heading `Search plots in plain language`.
- [ ] Project selector (`All projects`, `Ami Perur Enclave — phase 1`, etc.).
- [ ] Plain-language search input with search execution.
- [ ] Structured filter card:
  - Plot size operator (`More than`, `Less than`, `Equal to`), value, unit (`Cents`, `Sq.Ft.`, `Acres`).
  - Road-facing width filter (`feet`).
  - Metric helper explanation: `1 cent = 435.6 sq.ft...`.
- [ ] Database query builder executing verified structured plot filters.
- [ ] Plot search results cards and empty results handler.

### Phase 7: Module E — Legal AI Assistant
- [ ] In-modal and standalone assistant interface.
- [ ] Query input with `Ask` / `Asking...` loading state.
- [ ] Suggested queries (e.g. `Build ownership chain flow chart`).
- [ ] History feed with timestamps (`19 Oct`, `22 Oct`).
- [ ] Grounded response generator returning structured Markdown tables (Ownership / Title History Table) and advocate caution notes.
- [ ] Real-time document context injection.

### Phase 8: Module F — Document Viewer & Text Extraction
- [ ] Modal/Panel document viewer with page controls, zoom, and download.
- [ ] Toast notification: `Extracting text from PDF...`.
- [ ] Text extraction service with OCR fallback and searchable text view.

### Phase 9: Persistence, Authentication & Security
- [ ] Relational schema for `User`, `Project`, `Property`, `LegalDocument`, `DocumentReview`, `AuditEvent`, `Plot`.
- [ ] Seed script with accurate reference properties (`Ami Perur Enclave`, `Ami Vishnu Land`, `Ami Sulur Land`, `Ami Heritage City`, `Ami Ismail Land`), real document records, and plots.
- [ ] Protected endpoints, tokenized sharing, path traversal prevention, role validation.

### Phase 10: Verification, Testing & Polish
- [ ] Execute comprehensive unit and integration tests.
- [ ] Run browser verification on desktop (1440px), tablet (768px), and mobile (375px).
- [ ] Verify zero console errors, zero dead links, and seamless routing.
