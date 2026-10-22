# Testing Checklist: AMI Properties

## 1. Automated Test Plan

### Backend & API Tests
- [ ] **Health & Status**: `/api/health` returns 200 OK.
- [ ] **Authentication**:
  - Sign in as `Advocate Mansoor` (`mansoor@amiproperties.com` or demo login).
  - Unauthenticated access to protected routes returns 401.
  - Sign out invalidates session.
- [ ] **Properties & Land Records**:
  - `GET /api/properties` returns all 5 properties with accurate document counts.
  - Search by code (`LND-26-00001`) or name (`Perur`).
  - Filter by status (`Open`, `In Progress`, etc.).
- [ ] **Documents Workflow**:
  - `GET /api/properties/:id/documents` returns associated files.
  - `POST /api/documents/upload` validates file type/size, stores file, and creates record.
  - `PATCH /api/documents/:id/status` updates status to `Verified` or `Needs Rectification`.
  - `PATCH /api/documents/:id/comments` saves reviewer notes and records reviewer identity.
  - `PATCH /api/documents/:id/rename` renames document display name.
  - `DELETE /api/documents/:id` deletes or archives document and logs audit event.
  - `GET /api/documents/:id/download` serves file securely with Content-Disposition.
  - `POST /api/documents/:id/share` generates authorized time-limited share token.
- [ ] **AI Search & Filtering**:
  - Natural language parsing (e.g., "available plots more than 2 cents facing 30 feet road").
  - Structured filters: size operator (`More than`, `Less than`, `Equal to`), unit conversion (`1 cent = 435.6 sq.ft.`).
  - Road-facing width filtering.
  - Combined queries.
  - Empty state handling.
- [ ] **Legal AI Assistant**:
  - Query retrieval grounded in property documents.
  - Fallback deterministic responses when AI API key is not present.
  - History persistence.
  - Audit logging.

---

## 2. UI & Responsive Design Checklist

### Viewport Verification
- [ ] **Desktop (1440px / 1280px)**:
  - Persistent left sidebar with active dark pill navigation.
  - Top header with breadcrumbs and install action.
  - 4-column property card grid.
  - Centered document review modal.
  - Responsive AI search layout with side-by-side filters.
- [ ] **Tablet (768px - 1024px)**:
  - 2-column property card grid.
  - Collapsible sidebar with toggle button.
  - Usable modal without horizontal overflow.
- [ ] **Mobile (375px - 414px)**:
  - Sidebar folds into navigation drawer.
  - Single-column property cards.
  - Stacked search input and filter form.
  - Full-width modal drawer.

---

## 3. Visual & Interaction Fidelity Checklist

- [ ] Top identity shows AMI Properties with golden isometric cube logo.
- [ ] Active navigation tab uses solid dark filled pill (`#18181b`).
- [ ] Breadcrumb updates dynamically across routes.
- [ ] Status badges match reference:
  - Verified: emerald text/badge.
  - Needs rectification: amber text/badge.
  - Awaiting review: gray badge.
- [ ] Delete button uses restrained red styling.
- [ ] Text extraction toast appears when viewing legal documents.
- [ ] No placeholder dead buttons; every button performs a verified action.
