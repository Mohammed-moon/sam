import request from 'supertest';
import app from '../server';  // Assuming server.js is in the backend root directory
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';  // JWT package to simulate authentication

// Load the .env.test file for testing environment
dotenv.config({ path: '.env.test' });

describe('Server Routes Tests', () => {
  let userToken;
  
  // Setup user and token for authentication tests
  beforeAll(async () => {
    // Connect to MongoDB (using your MONGO_URI from .env.test)
    await mongoose.connect(process.env.MONGO_URI);
    
    // Mock user authentication (if required for your protected routes)
    const userPayload = { userId: 'testUser123', role: 'seeker' };
    userToken = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    // Clean up and disconnect from MongoDB after tests
    await mongoose.disconnect();
  });

  describe('GET /api/jobs/:jobId', () => {
    it('should return details of a job', async () => {
      const jobId = '123'; // Replace with an actual job ID you want to test
      const res = await request(app).get(`/api/jobs/${jobId}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('jobId', jobId);  // Adjust based on your API response
      expect(res.body).toHaveProperty('title');
    });

    it('should return 404 if job is not found', async () => {
      const jobId = 'nonexistentjobid';
      const res = await request(app).get(`/api/jobs/${jobId}`);
      
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Job not found');
    });
  });

  describe('POST /api/applications/:jobId/apply', () => {
    it('should apply for a job with resume', async () => {
      const jobId = '123'; // Replace with an actual job ID
      const userId = 'testUser123'; // Replace with a test user ID
      const resumePath = 'path/to/resume.pdf'; // Mock path for file upload

      const res = await request(app)
        .post(`/api/applications/${jobId}/apply`)
        .set('Authorization', `Bearer ${userToken}`)  // Attach the JWT token for authentication
        .set('Content-Type', 'multipart/form-data')
        .field('userId', userId)
        .attach('resume', resumePath); // Adjust as needed for your file upload config

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Application submitted successfully');
    });

    it('should return an error if no resume is provided', async () => {
      const jobId = '123';
      const userId = 'testUser123';
      const res = await request(app)
        .post(`/api/applications/${jobId}/apply`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ userId });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Resume is required.');
    });
  });

  describe('POST /api/profile', () => {
    it('should create a new profile for the user', async () => {
      const profileData = {
        fullName: 'Test User',
        phone: '1234567890',
        bio: 'Test bio',
        skills: JSON.stringify(['JavaScript', 'Node.js']),
        address: 'Test Address',
      };

      const res = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${userToken}`)  // Attach the JWT token for authentication
        .send(profileData);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Profile created successfully');
    });

    it('should return an error if profile already exists', async () => {
      const profileData = {
        fullName: 'Test User',
        phone: '1234567890',
        bio: 'Test bio',
        skills: JSON.stringify(['JavaScript', 'Node.js']),
        address: 'Test Address',
      };

      // First create a profile
      await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(profileData);

      // Try to create the profile again
      const res = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(profileData);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Profile already exists. You cannot create a new one.');
    });
  });

  // Add additional tests for other routes as needed
});
