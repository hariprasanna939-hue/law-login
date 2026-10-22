# Reference Audit: Properties Web Application

## 1. Source Reference Summary

- **Source Asset**: Google Meet Screen Recording (`Screen Recording 2026-10-22 at 5.05.38 PM.mov`), 345 seconds duration.
- **Application Name**: Properties (Land Management & Legal Due Diligence).
- **Primary Domain/Context**: Real estate land acquisition, title verification, legal due diligence of property deeds, power of attorney, partition deeds, legal heir certificates, and plain-language plot discovery.
- **Observed Production URL in Video**: `advocatecasehub.vercel.app` (sharing context during call).

---

## 2. Visual & Design System Audit

### Color Palette & Design Tokens
- **Background**:
  - Primary Workspace: `#ffffff` (pure white) with subtle canvas contrast `#f8fafc` / `#f9fafb` (zinc-50).
  - Active Navigation Item: `#18181b` (zinc-900 / dark charcoal) with white text.
  - Hover states: `#f4f4f5` (zinc-100) or `#27272a` (zinc-800 for dark buttons).
- **Borders & Dividers**:
  - Thin neutral borders: `#e4e4e7` (zinc-200) / `#e2e8f0` (slate-200).
- **Text & Hierarchy**:
  - Primary Headings: `#09090b` (zinc-950 / zinc-900), font-weight 700 / 800.
  - Section Category Subtitles: Uppercase, tracking-widest (e.g., `LAND — LEGAL DUE DILIGENCE`, `AI SEARCH`), text-[11px] font-semibold `#71717a` (zinc-500) / `#a1a1aa` (zinc-400).
  - Body Text: `#18181b` (zinc-900), text-sm / text-xs.
  - Secondary/Meta Labels: `#71717a` (zinc-500).
- **Status Indicators & Badges**:
  - **Verified**: Emerald/Green badge & text (`#059669` / `#10b981`), light emerald background `#ecfdf5` or green outline border.
  - **Needs Rectification**: Amber badge & text (`#d97706` / `#f59e0b`), light amber background `#fffbeb` or amber outline border.
  - **Awaiting Review**: Zinc/Gray badge (`#71717a`), background `#f4f4f5`.
  - **Destructive (Delete)**: Red text & border (`#ef4444` / `#dc2626`).

### Typography & Spacing
- Clean sans-serif system font (Inter / system-ui).
- Compact spacing: restrained padding (`p-4`, `px-3.5 py-2`), small rounded corners (`rounded-xl` for inputs/cards, `rounded-full` for status badges/pills).
- Shadows: Minimal, subtle elevations (`shadow-sm`, `shadow-[0_1px_3px_rgba(0,0,0,0.04)]`).

---

## 3. Page & Module Hierarchy Audit

### Application Shell
1. **Left Sidebar**:
   - Top: Logo (gold/bronze isometric cube within rounded-rect container) + "Properties" bold wordmark.
   - Navigation Menu:
     - `Dashboard`
     - `Land & Legal` (Active pill: dark filled rectangle with rounded corners)
     - `AI Search`
   - Bottom Profile:
     - User Name: `Advocate`
     - Role: `Legal Advisor`
     - Sign Out link (`Sign out`)
2. **Top Header**:
   - Sidebar toggle icon (`☰`)
   - Breadcrumb navigation: `Properties / [Active Page]`
   - Right utility actions:
     - Information circular button (`i`)
     - PWA / App install button (`↓ Install App`)

---

### Module A — Dashboard
- **Role**: Primary landing page giving bird's-eye metrics on land properties and due diligence progress.
- **Key Metrics**:
  - Total Land Parcels & File counts
  - Verification rate (e.g., % verified, verified vs. pending)
  - Critical rectification alerts
- **Interactive Overview**: Direct click-through to individual property legal files.

---

### Module B — Land & Legal (`/land-legal`)
- **Header**: Subtitle `LAND — LEGAL DUE DILIGENCE`, Main Title `Legal Due Diligence`.
- **Toolbar**:
  - Search Input: `Search code or name...`
  - Status Filter Dropdown: `All statuses` (Open, In Progress, Verified, Rectification Needed, Closed).
  - Action Button: `Legal AI` (dark pill with sparkle icon).
  - Summary Count: `X of X land files` (e.g., `5 of 5 land files`).
- **Property Cards Grid** (4 columns on desktop):
  - Card Header: Land Code (e.g., `LND-26-00001`) + `Open` button.
  - Property Name: `Ami Perur Enclave`, `Ami Vishnu Land`, `Ami Sulur Land`, `Ami Heritage City`, `Ami Ismail Land`.
  - Bottom Footer:
    - Document count (`16 docs`, `0 docs`, etc.)
    - Verification progress badge (`15/16 verified`, `2/14 verified`, `0/8 verified`)
    - Shortcut badge: `Legal AI`
    - Time in status: `3d in status`

---

### Module C — Document Review Modal
- Centered modal above dimmed backdrop with `✕` close control.
- Property Details:
  - `Current status`: `Open`
  - `Time in status`: `3 days`
  - `Identified by`: `Broker — Satyaseelan`
  - `Documents`: `16`
- Quick Action Filters: `Mark verified`, `Needs rectification`.
- Document List items:
  - Document Title & Original Filename (e.g., `Doc no 4853/2026 - power document`, `General Power of Attorney...pdf`). Clicking filename opens document preview.
  - Status badge: `Verified` (green), `Needs rectification` (amber), `Awaiting review` (gray).
  - Action buttons: `Rename`, `Download`, `Share`, `Delete` (red).
  - Review Remarks textarea: `Remarks — what you checked, or what needs rectification (required)`.
  - Review Audit label: `Last reviewed by [Reviewer] on [Date]`.
  - Status Toggle Buttons: `Verified ✓`, `Needs rectification`.
- Document Upload Area:
  - `Upload one document at a time — give it its own name (any name; there's no fixed list).`
  - Name field + File selector + Upload progress.
- Status Update: `Update Status` primary button.

---

### Module D — AI Search (`/ai-search`)
- **Subtitle**: `AI SEARCH`, **Title**: `Search plots in plain language`.
- **Main Search Bar**:
  - Project dropdown: `All projects ⌄`, `Ami Perur Enclave — phase 1`, `Ami Sulur Land`, `Ami Heritage City`, etc.
  - Natural Language Input: placeholder `e.g. northeast plots that are available`.
  - Button: `Search` (black pill).
- **Structured Filter Card**:
  - `Plot size`: Operator (`More than`, `Less than`, `Equal to`), numeric input (`e.g. 2`), unit dropdown (`Cents`, `Sq.Ft.`, `Acres`).
  - `Facing a road of width`: numeric input (`e.g. 30`), suffix `feet`.
  - Helpful measurement converter note:
    `1 cent = 435.6 sq.ft. "Equal to" finds plots within 2% of the size. You can also just type it — "more than 2 cents", "plots facing 30 feet road". A 9 m road counts as 30 feet.`
- **Results Display**:
  - Real database plot records showing Plot ID, Project, Size in Cents & Sq.Ft, Road Facing Width, Direction/Orientation, Availability Status (Available / Booked / Sold), and action to view details.

---

### Module E — Legal AI Assistant
- Integrated inside the Land & Legal modal or accessible via the `Legal AI` pill.
- Subtitle: `Ask about these documents`, `Not a substitute for legal advice.`
- Query Input + `Ask` / `Asking...` button.
- Quick prompt pills: `Build ownership chain flow chart`, `Identify missing legal records`, `Review encumbrance status`.
- Query History with dates (`19 Oct`, `22 Oct`).
- Grounded Legal Responses:
  - Ownership / Title History Table: Date / Year | Document / Event | Reference / Doc No. | Parties Involved | Property / Share Transferred.
  - Cautionary heirship/title legal notes: highlighting unverified releases or missing heirs (e.g., Rangammal legal heirs Paramasivam and Manoharan).
  - Purchaser tables with deed execution dates.
- Document grounding with transparent fallback when AI credentials are absent.

---

### Module F — Document Viewer & Text Extraction
- Full-screen or modal PDF/Document viewer.
- Top bar with filename, page navigation (`1 / 10`), zoom (`- 100% +`), rotate, download.
- Text Extraction indicator: Toast `• Extracting text from PDF...`.
- Extracted text display and search capabilities.
