import request from 'supertest';

// Set PORT to 0 so the app.listen() in index.ts picks a random port
process.env.PORT = '0';

// Import the Express app (this triggers app.listen)
import app from '../../src/backend/src/index';

describe('API Integration Tests', () => {
  describe('GET /api/health', () => {
    it('returns 200 with status ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/templates', () => {
    it('returns all templates', async () => {
      const res = await request(app).get('/api/templates');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(6);
    });

    it('each template has id, name, and category', async () => {
      const res = await request(app).get('/api/templates');
      for (const t of res.body) {
        expect(t).toHaveProperty('id');
        expect(t).toHaveProperty('name');
        expect(t).toHaveProperty('category');
      }
    });
  });

  describe('GET /api/templates/:id', () => {
    it('returns a specific template', async () => {
      const res = await request(app).get('/api/templates/basic-web-app');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('basic-web-app');
      expect(res.body.name).toBe('Basic Web App');
      expect(res.body).toHaveProperty('parameters');
    });

    it('returns 404 for unknown template id', async () => {
      const res = await request(app).get('/api/templates/unknown-template-xyz');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Not Found');
    });
  });

  describe('GET /api/deployments', () => {
    it('returns an array (empty initially)', async () => {
      const res = await request(app).get('/api/deployments');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('404 handling', () => {
    it('returns 404 for unknown routes', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.status).toBe(404);
    });
  });
});
