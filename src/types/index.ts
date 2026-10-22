export interface User {
  id: string;
  name: string;
  role: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  location: string;
}

export interface Property {
  id: string;
  project_id: string;
  identifier: string;
  name: string;
  location: string;
  identified_by: string;
  current_status: string;
  time_in_status: string;
  doc_count: number;
  verified_count: number;
  rectification_count: number;
  created_at: string;
  updated_at: string;
}

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

export interface Plot {
  id: string;
  project_id: string;
  project_name: string;
  property_id?: string;
  property_name?: string;
  plot_number: string;
  size_cents: number;
  size_sqft: number;
  road_width_ft: number;
  direction: string;
  availability: 'Available' | 'Booked' | 'Sold';
  price_inr: number;
  metadata?: string;
}

export interface LegalAiQuery {
  id: string;
  property_id: string;
  user_name: string;
  question: string;
  answer: string;
  date_label: string;
  created_at: string;
}

export interface DashboardStats {
  totalProperties: number;
  totalDocs: number;
  verifiedDocs: number;
  pendingDocs: number;
  rectificationDocs: number;
  recentAudits: {
    id: string;
    actor_name: string;
    action: string;
    resource_type: string;
    resource_id: string;
    metadata?: string;
    timestamp: string;
  }[];
  propertiesSummary: {
    id: string;
    identifier: string;
    name: string;
    location: string;
    current_status: string;
    doc_count: number;
    verified_count: number;
  }[];
}
