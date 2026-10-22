import { Property, LegalDocument, Plot, DashboardStats, LegalAiQuery, Project, User } from '../types';

const API_BASE = '/api';

export const api = {
  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`);
    return res.json();
  },

  async signOut(): Promise<void> {
    await fetch(`${API_BASE}/auth/signout`, { method: 'POST' });
  },

  async getProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`);
    return res.json();
  },

  async getProperties(search?: string, status?: string): Promise<Property[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'All statuses') params.append('status', status);
    const res = await fetch(`${API_BASE}/properties?${params.toString()}`);
    return res.json();
  },

  async getProperty(id: string): Promise<Property> {
    const res = await fetch(`${API_BASE}/properties/${id}`);
    return res.json();
  },

  async updatePropertyStatus(id: string, status: string): Promise<Property> {
    const res = await fetch(`${API_BASE}/properties/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  async getDocuments(propertyId: string): Promise<LegalDocument[]> {
    const res = await fetch(`${API_BASE}/properties/${propertyId}/documents`);
    return res.json();
  },

  async uploadDocument(propertyId: string, formData: FormData): Promise<LegalDocument> {
    const res = await fetch(`${API_BASE}/properties/${propertyId}/documents`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload document');
    }
    return res.json();
  },

  async updateDocumentStatus(
    documentId: string,
    status: 'Verified' | 'Needs rectification' | 'Awaiting review',
    comments?: string
  ): Promise<LegalDocument> {
    const res = await fetch(`${API_BASE}/documents/${documentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, comments }),
    });
    return res.json();
  },

  async updateDocumentComments(documentId: string, comments: string): Promise<LegalDocument> {
    const res = await fetch(`${API_BASE}/documents/${documentId}/comments`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comments }),
    });
    return res.json();
  },

  async renameDocument(documentId: string, title: string): Promise<LegalDocument> {
    const res = await fetch(`${API_BASE}/documents/${documentId}/rename`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to rename document');
    }
    return res.json();
  },

  async deleteDocument(documentId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/documents/${documentId}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async createShareLink(documentId: string): Promise<{ token: string; shareUrl: string; expires_in: string }> {
    const res = await fetch(`${API_BASE}/documents/${documentId}/share`, {
      method: 'POST',
    });
    return res.json();
  },

  async searchPlots(params: {
    projectId?: string;
    nlQuery?: string;
    sizeOperator?: string;
    sizeValue?: number;
    sizeUnit?: string;
    roadWidthFt?: number;
  }): Promise<{ plots: Plot[]; appliedCriteria: string[]; totalMatches: number }> {
    const q = new URLSearchParams();
    if (params.projectId && params.projectId !== 'all') q.append('projectId', params.projectId);
    if (params.nlQuery) q.append('nlQuery', params.nlQuery);
    if (params.sizeOperator) q.append('sizeOperator', params.sizeOperator);
    if (params.sizeValue !== undefined && !isNaN(params.sizeValue)) q.append('sizeValue', params.sizeValue.toString());
    if (params.sizeUnit) q.append('sizeUnit', params.sizeUnit);
    if (params.roadWidthFt !== undefined && !isNaN(params.roadWidthFt)) q.append('roadWidthFt', params.roadWidthFt.toString());

    const res = await fetch(`${API_BASE}/plots/search?${q.toString()}`);
    return res.json();
  },

  async getLegalAiHistory(propertyId: string): Promise<LegalAiQuery[]> {
    const res = await fetch(`${API_BASE}/properties/${propertyId}/legal-ai`);
    return res.json();
  },

  async askLegalAi(propertyId: string, question: string): Promise<LegalAiQuery> {
    const res = await fetch(`${API_BASE}/properties/${propertyId}/legal-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Legal AI query failed');
    }
    return res.json();
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    return res.json();
  },
};
