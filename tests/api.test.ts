import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server/index.js';
import { seedData } from '../server/seed.js';

beforeAll(() => {
  seedData();
});

describe('AMI Properties - API & Backend Integration Tests', () => {
  it('GET /api/health returns 200 OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/auth/me returns Advocate Mansoor profile', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Advocate Mansoor');
    expect(res.body.user.role).toBe('Legal Advisor');
  });

  it('GET /api/properties returns all 5 properties with accurate document counts', async () => {
    const res = await request(app).get('/api/properties');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(5);

    const perur = res.body.find((p: any) => p.identifier === 'LND-26-00001');
    expect(perur).toBeDefined();
    expect(perur.name).toBe('Ami Perur Enclave');
    expect(perur.doc_count).toBe(16);
    expect(perur.verified_count).toBe(15);

    const heritage = res.body.find((p: any) => p.identifier === 'LND-26-00002');
    expect(heritage).toBeDefined();
    expect(heritage.doc_count).toBe(8);
  });

  it('GET /api/properties?search=Perur filters correctly', async () => {
    const res = await request(app).get('/api/properties?search=Perur');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe('Ami Perur Enclave');
  });

  it('GET /api/properties/:id/documents returns files for property', async () => {
    const res = await request(app).get('/api/properties/prop-1/documents');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(16);
    expect(res.body[0].title).toBeDefined();
  });

  it('PATCH /api/documents/:id/status updates review status and logs review', async () => {
    const docs = await request(app).get('/api/properties/prop-2/documents');
    const firstDoc = docs.body[0];

    const patchRes = await request(app)
      .patch(`/api/documents/${firstDoc.id}/status`)
      .send({ status: 'Verified', comments: 'Title verified by Advocate Mansoor' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.review_status).toBe('Verified');
    expect(patchRes.body.review_comments).toBe('Title verified by Advocate Mansoor');
  });

  it('PATCH /api/documents/:id/rename modifies title persistently', async () => {
    const docs = await request(app).get('/api/properties/prop-2/documents');
    const targetDoc = docs.body[1];

    const patchRes = await request(app)
      .patch(`/api/documents/${targetDoc.id}/rename`)
      .send({ title: 'Updated Layout Approval Plan 2026' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.title).toBe('Updated Layout Approval Plan 2026');
  });

  it('POST /api/documents/:id/share creates an authorized share token and URL', async () => {
    const docs = await request(app).get('/api/properties/prop-1/documents');
    const doc = docs.body[0];

    const res = await request(app).post(`/api/documents/${doc.id}/share`);
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.shareUrl).toContain(res.body.token);

    // Verify retrieval via share token
    const verifyRes = await request(app).get(`/api/share/${res.body.token}`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.id).toBe(doc.id);
  });

  it('GET /api/documents/:id/download serves file with proper headers', async () => {
    const docs = await request(app).get('/api/properties/prop-1/documents');
    const doc = docs.body[0];

    const res = await request(app).get(`/api/documents/${doc.id}/download`);
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toContain('attachment');
  });

  it('AI Search: parses natural language "northeast plots that are available"', async () => {
    const res = await request(app).get('/api/plots/search?nlQuery=northeast%20plots%20that%20are%20available');
    expect(res.status).toBe(200);
    expect(res.body.plots.length).toBeGreaterThan(0);
    res.body.plots.forEach((p: any) => {
      expect(p.direction).toBe('North-East');
      expect(p.availability).toBe('Available');
    });
  });

  it('AI Search: handles structured size and unit filters (more than 2 cents)', async () => {
    const res = await request(app).get('/api/plots/search?sizeOperator=more_than&sizeValue=2.0&sizeUnit=cents');
    expect(res.status).toBe(200);
    expect(res.body.plots.length).toBeGreaterThan(0);
    res.body.plots.forEach((p: any) => {
      expect(p.size_cents).toBeGreaterThanOrEqual(2.0);
    });
  });

  it('AI Search: handles road width filter (facing 30 feet road)', async () => {
    const res = await request(app).get('/api/plots/search?roadWidthFt=30');
    expect(res.status).toBe(200);
    expect(res.body.plots.length).toBeGreaterThan(0);
    res.body.plots.forEach((p: any) => {
      expect(p.road_width_ft).toBeGreaterThanOrEqual(30);
    });
  });

  it('Legal AI: answers title chain flowchart with structured markdown table', async () => {
    const res = await request(app)
      .post('/api/properties/prop-2/legal-ai')
      .send({ question: 'Draw the ownership chain of this property as a flow chart' });

    expect(res.status).toBe(200);
    expect(res.body.question).toContain('flow chart');
    expect(res.body.answer).toContain('Ownership / Title History Table');
    expect(res.body.answer).toContain('Rangappa Gounder');
    expect(res.body.answer).toContain('Note on title/heirship');
  });

  it('Legal AI: answers purchaser question accurately', async () => {
    const res = await request(app)
      .post('/api/properties/prop-2/legal-ai')
      .send({ question: 'What is the name of the purchaser' });

    expect(res.status).toBe(200);
    expect(res.body.answer).toContain('M/s. AMI PROPERTIES');
    expect(res.body.answer).toContain('I. Abdul Rahman');
  });

  it('GET /api/dashboard/stats returns real counts from database', async () => {
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.status).toBe(200);
    expect(res.body.totalProperties).toBe(5);
    expect(res.body.totalDocs).toBeGreaterThan(30);
    expect(res.body.verifiedDocs).toBeGreaterThan(15);
  });
});
