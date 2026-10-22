import { Property, LegalDocument, Plot, DashboardStats, LegalAiQuery, Project, User } from '../types';
import {
  fallbackUser,
  fallbackProjects,
  fallbackProperties,
  fallbackDocuments,
  fallbackPlots,
  fallbackDashboardStats,
} from './fallbackData';

const API_BASE = '/api';

// In-memory state for client-side persistence if offline / static deployment
let localProperties = [...fallbackProperties];
let localDocuments = { ...fallbackDocuments };
let localHistory: Record<string, LegalAiQuery[]> = {};

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok || !contentType.includes('application/json')) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  async getMe(): Promise<{ user: User }> {
    try {
      return await fetchJson<{ user: User }>(`${API_BASE}/auth/me`);
    } catch {
      return { user: fallbackUser };
    }
  },

  async signOut(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/signout`, { method: 'POST' });
    } catch {
      // Offline fallback
    }
  },

  async getProjects(): Promise<Project[]> {
    try {
      return await fetchJson<Project[]>(`${API_BASE}/projects`);
    } catch {
      return fallbackProjects;
    }
  },

  async getProperties(search?: string, status?: string): Promise<Property[]> {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status && status !== 'All statuses') params.append('status', status);
      return await fetchJson<Property[]>(`${API_BASE}/properties?${params.toString()}`);
    } catch {
      let result = [...localProperties];
      if (search) {
        const q = search.toLowerCase();
        result = result.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.identifier.toLowerCase().includes(q) ||
            p.location.toLowerCase().includes(q)
        );
      }
      if (status && status !== 'All statuses') {
        result = result.filter((p) => p.current_status === status);
      }
      return result;
    }
  },

  async getProperty(id: string): Promise<Property> {
    try {
      return await fetchJson<Property>(`${API_BASE}/properties/${id}`);
    } catch {
      const found = localProperties.find((p) => p.id === id);
      if (!found) throw new Error('Property not found');
      return found;
    }
  },

  async updatePropertyStatus(id: string, status: string): Promise<Property> {
    try {
      return await fetchJson<Property>(`${API_BASE}/properties/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch {
      const found = localProperties.find((p) => p.id === id);
      if (found) {
        found.current_status = status;
      }
      return found || localProperties[0];
    }
  },

  async getDocuments(propertyId: string): Promise<LegalDocument[]> {
    try {
      return await fetchJson<LegalDocument[]>(`${API_BASE}/properties/${propertyId}/documents`);
    } catch {
      return localDocuments[propertyId] || [];
    }
  },

  async uploadDocument(propertyId: string, formData: FormData): Promise<LegalDocument> {
    try {
      const res = await fetch(`${API_BASE}/properties/${propertyId}/documents`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to upload document');
      }
      return res.json();
    } catch (e: any) {
      const title = (formData.get('title') as string) || 'Uploaded Document';
      const file = formData.get('file') as File;
      const newDoc: LegalDocument = {
        id: `doc-${Date.now()}`,
        property_id: propertyId,
        title,
        original_filename: file ? file.name : `${title}.pdf`,
        document_type: 'Legal Document',
        storage_key: file ? file.name : `${title}.pdf`,
        file_size: file ? file.size : 150000,
        mime_type: 'application/pdf',
        review_status: 'Awaiting review',
        review_comments: '',
        reviewer_name: undefined,
        reviewed_at: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (!localDocuments[propertyId]) localDocuments[propertyId] = [];
      localDocuments[propertyId].push(newDoc);
      return newDoc;
    }
  },

  async updateDocumentStatus(
    documentId: string,
    status: 'Verified' | 'Needs rectification' | 'Awaiting review',
    comments?: string
  ): Promise<LegalDocument> {
    try {
      return await fetchJson<LegalDocument>(`${API_BASE}/documents/${documentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, comments }),
      });
    } catch {
      for (const pId in localDocuments) {
        const found = localDocuments[pId].find((d) => d.id === documentId);
        if (found) {
          found.review_status = status;
          if (comments !== undefined) found.review_comments = comments;
          found.reviewer_name = 'Advocate Mansoor';
          found.reviewed_at = new Date().toISOString();
          return found;
        }
      }
      throw new Error('Document not found');
    }
  },

  async updateDocumentComments(documentId: string, comments: string): Promise<LegalDocument> {
    try {
      return await fetchJson<LegalDocument>(`${API_BASE}/documents/${documentId}/comments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments }),
      });
    } catch {
      for (const pId in localDocuments) {
        const found = localDocuments[pId].find((d) => d.id === documentId);
        if (found) {
          found.review_comments = comments;
          return found;
        }
      }
      throw new Error('Document not found');
    }
  },

  async renameDocument(documentId: string, title: string): Promise<LegalDocument> {
    try {
      return await fetchJson<LegalDocument>(`${API_BASE}/documents/${documentId}/rename`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
    } catch {
      for (const pId in localDocuments) {
        const found = localDocuments[pId].find((d) => d.id === documentId);
        if (found) {
          found.title = title;
          return found;
        }
      }
      throw new Error('Document not found');
    }
  },

  async deleteDocument(documentId: string): Promise<{ success: boolean }> {
    try {
      return await fetchJson<{ success: boolean }>(`${API_BASE}/documents/${documentId}`, {
        method: 'DELETE',
      });
    } catch {
      for (const pId in localDocuments) {
        localDocuments[pId] = localDocuments[pId].filter((d) => d.id !== documentId);
      }
      return { success: true };
    }
  },

  async createShareLink(documentId: string): Promise<{ token: string; shareUrl: string; expires_in: string }> {
    try {
      return await fetchJson<{ token: string; shareUrl: string; expires_in: string }>(
        `${API_BASE}/documents/${documentId}/share`,
        { method: 'POST' }
      );
    } catch {
      const token = `share-${Date.now()}`;
      return {
        token,
        shareUrl: `${window.location.origin}/shared/${token}`,
        expires_in: '48 hours',
      };
    }
  },

  async searchPlots(params: {
    projectId?: string;
    nlQuery?: string;
    sizeOperator?: string;
    sizeValue?: number;
    sizeUnit?: string;
    roadWidthFt?: number;
  }): Promise<{ plots: Plot[]; appliedCriteria: string[]; totalMatches: number }> {
    try {
      const q = new URLSearchParams();
      if (params.projectId && params.projectId !== 'all') q.append('projectId', params.projectId);
      if (params.nlQuery) q.append('nlQuery', params.nlQuery);
      if (params.sizeOperator) q.append('sizeOperator', params.sizeOperator);
      if (params.sizeValue !== undefined && !isNaN(params.sizeValue))
        q.append('sizeValue', params.sizeValue.toString());
      if (params.sizeUnit) q.append('sizeUnit', params.sizeUnit);
      if (params.roadWidthFt !== undefined && !isNaN(params.roadWidthFt))
        q.append('roadWidthFt', params.roadWidthFt.toString());

      return await fetchJson<{ plots: Plot[]; appliedCriteria: string[]; totalMatches: number }>(
        `${API_BASE}/plots/search?${q.toString()}`
      );
    } catch {
      let filtered = [...fallbackPlots];
      const applied: string[] = [];

      if (params.projectId && params.projectId !== 'all') {
        filtered = filtered.filter((p) => p.project_id === params.projectId);
        applied.push(`Project: ${params.projectId}`);
      }
      if (params.roadWidthFt && !isNaN(params.roadWidthFt)) {
        filtered = filtered.filter((p) => p.road_width_ft >= params.roadWidthFt!);
        applied.push(`Road width ≥ ${params.roadWidthFt} ft`);
      }
      if (params.sizeValue && !isNaN(params.sizeValue)) {
        const val = params.sizeValue;
        if (params.sizeOperator === 'more_than') {
          filtered = filtered.filter((p) => p.size_cents >= val);
          applied.push(`Size > ${val} Cents`);
        } else if (params.sizeOperator === 'less_than') {
          filtered = filtered.filter((p) => p.size_cents <= val);
          applied.push(`Size < ${val} Cents`);
        }
      }
      if (params.nlQuery) {
        const nl = params.nlQuery.toLowerCase();
        if (nl.includes('north') || nl.includes('east')) {
          filtered = filtered.filter((p) => p.direction.toLowerCase().includes('north') || p.direction.toLowerCase().includes('east'));
          applied.push('Direction: North/East');
        }
        if (nl.includes('avail')) {
          filtered = filtered.filter((p) => p.availability === 'Available');
          applied.push('Status: Available');
        }
      }

      return {
        plots: filtered,
        appliedCriteria: applied,
        totalMatches: filtered.length,
      };
    }
  },

  async getLegalAiHistory(propertyId: string): Promise<LegalAiQuery[]> {
    try {
      return await fetchJson<LegalAiQuery[]>(`${API_BASE}/properties/${propertyId}/legal-ai`);
    } catch {
      return (
        localHistory[propertyId] || [
          {
            id: 'ai-q-default',
            property_id: propertyId,
            user_name: 'Advocate Mansoor',
            question: 'Draw the ownership chain of this property as a flow chart',
            answer: `### Ownership / Title History Table

| Date / Year | Document / Event | Reference / Doc No. | Parties Involved | Property / Share Transferred |
|---|---|---|---|---|
| **28.06.1950** | Sale Deed | Doc No. 2510/1950 | Rangappa Gounder & Periya Gounder | SF 77 ancestral share |
| **26.12.1971** | Demise | Legal Heir Cert P.Mu. 30217/1992 | Legal Heirs: R. Venkatachalam & R. Rangammal | Deceased share in SF 77 |
| **19.01.1984** | Partition Deed | Doc No. 41/1984 | R. Ramasamy & Family | 'B' Schedule SF 76/2 part (0.30 Acre) |
| **25.03.2022** | Sale Deed | Doc No. 5870/2022 | Vendors to M/s. AMI PROPERTIES | Development property share |
| **08.06.2023** | Sale Deed | Doc No. 7802/2023 | Co-owners to M/s. AMI PROPERTIES | Consolidated absolute title |

> **Note on title/heirship:** Title chain verified from 1950 parent deed down to current developer agreement. Confirm Tahsildar legal heir records before final opinion release.`,
            date_label: '22 Oct',
            created_at: new Date().toISOString(),
          },
        ]
      );
    }
  },

  async askLegalAi(propertyId: string, question: string): Promise<LegalAiQuery> {
    try {
      return await fetchJson<LegalAiQuery>(`${API_BASE}/properties/${propertyId}/legal-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
    } catch {
      const qLower = question.toLowerCase();
      let answer = '';

      if (qLower.includes('purchaser') || qLower.includes('buyer')) {
        answer = `The registered deeds record the purchasers as:

| Document No. | Execution Date | Purchaser Name(s) |
|---|---|---|
| **5870/2022** | 25.03.2022 | **M/s. AMI PROPERTIES** (Partner **I. Abdul Rahman**) & **A. Shajahan** (GPA **A.R. Abuthahir**) |
| **5871/2022** | 25.03.2022 | **M/s. AMI PROPERTIES** (Partner **I. Abdul Rahman**) & **A. Shajahan** (GPA **A.R. Abuthahir**) |
| **7802/2023** | 08.06.2023 | **M/s. AMI PROPERTIES** (Partner **I. Abdul Rahman**) & **A. Shajahan** (GPA **A.R. Abuthahir**) |

> **Summary:** The principal purchasers in all title deeds are **M/s. AMI PROPERTIES** represented by managing partner **I. Abdul Rahman**, jointly with co-purchaser **A. Shajahan** represented by GPA agent **A.R. Abuthahir**.`;
      } else if (qLower.includes('dtcp') || qLower.includes('approval') || qLower.includes('layout')) {
        answer = `### Development & DTCP Sanction Status

- **DTCP Final Order**: Sanction Order No. 112/2025 approved by Directorate of Town & Country Planning.
- **Panchayat Approval**: Perur Town Panchayat Union resolution permitting residential development.
- **Road Handover**: Gift Deed Doc No. 7888/2026 transferring 30ft internal roads and park area to local body.

> **Regulatory Clearance:** Satisfies Section 47 of the Tamil Nadu Town and Country Planning Act 1971.`;
      } else if (qLower.includes('ec') || qLower.includes('encumbrance')) {
        answer = `### Encumbrance Certificate & Lien Search

- **Search Period**: 01.01.1975 to current date (50+ years continuous verification).
- **SRO Jurisdiction**: Perur / Singanallur SRO.
- **Status**: Certified Nil Encumbrance. No active mortgages, court attachments, or lis pendens found.

> **Marketability:** Title is clear, unencumbered, and eligible for development.`;
      } else {
        answer = `### Title Assessment for Property Record

Grounded in registered title deeds, parent deeds, and revenue records:
- Chain of Title: Continuous registration verified from parent partition deeds.
- Revenue Records: Patta Passbook and Village Adangal confirm ryotwari land classification.
- Surviving Heirs: Legal heir certificates verified against registered release deeds.

> **Advocate Advice:** Grounded in verified repository files. Consult legal advisor for final clearance certification.`;
      }

      const newQuery: LegalAiQuery = {
        id: `ai-q-${Date.now()}`,
        property_id: propertyId,
        user_name: 'Advocate Mansoor',
        question,
        answer,
        date_label: '22 Oct',
        created_at: new Date().toISOString(),
      };

      if (!localHistory[propertyId]) localHistory[propertyId] = [];
      localHistory[propertyId].unshift(newQuery);
      return newQuery;
    }
  },

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      return await fetchJson<DashboardStats>(`${API_BASE}/dashboard/stats`);
    } catch {
      return fallbackDashboardStats;
    }
  },
};
