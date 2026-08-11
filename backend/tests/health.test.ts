import request from 'supertest';
import app from '../src/app';

describe('GET /api/health', () => {
  it('should return health status JSON response structure', async () => {
    const res = await request(app).get('/api/health');
    expect([200, 503]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('success');
    expect(res.body).toHaveProperty('message', 'CareerPilot API is running');
    expect(res.body).toHaveProperty('database');
  });

  it('should return 404 for non-existent route', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual({
      success: false,
      error: {
        message: 'Route not found - /api/unknown-route',
      },
    });
  });
});
