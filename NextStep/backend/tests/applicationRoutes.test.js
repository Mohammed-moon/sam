import request from 'supertest';
import app from '../server.js'; // Import the Express app

describe('GET /api/applications/:applicationId', () => {
  it('should return application details for a valid applicationId', async () => {
    const response = await request(app)
      .get('/api/applications/validApplicationId')  // Replace with a valid applicationId
      .set('Authorization', 'Bearer yourAuthToken'); // Set a valid token for authentication

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('profile');
    expect(response.body).toHaveProperty('job');
  });

  it('should return 404 if application not found', async () => {
    const response = await request(app)
      .get('/api/applications/nonExistentApplicationId')
      .set('Authorization', 'Bearer yourAuthToken');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Application not found');
  });
});
