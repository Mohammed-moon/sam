import request from 'supertest';
//import app from '../server.js';
const app = require('../server'); 
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Profile from '../models/Profile.js'; // Assuming Profile model is located here

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Profile Routes', () => {
  let userToken;

  beforeEach(async () => {
    // Register a user and log in to get token
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test@123',
      });
    
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test@123',
      });
    
    userToken = loginResponse.body.token;
  });

  it('should create a new profile', async () => {
    const profileData = {
      fullName: 'Test User',
      phone: '123456789',
      experience: '[]',
      education: '[]',
      bio: 'Test Bio',
      skills: '[]',
      socialLinks: '{}',
      address: 'Test Address',
    };

    const response = await request(app)
      .post('/api/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send(profileData);
    
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Profile created successfully');
    expect(response.body.profile).toHaveProperty('fullName', 'Test User');
  });

  it('should get the profile', async () => {
    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('fullName', 'Test User');
  });

  it('should update the profile', async () => {
    const updatedProfileData = {
      fullName: 'Updated Test User',
      phone: '987654321',
    };

    const response = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send(updatedProfileData);
    
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Profile updated successfully');
    expect(response.body.profile).toHaveProperty('fullName', 'Updated Test User');
  });

  it('should delete the profile', async () => {
    const response = await request(app)
      .delete('/api/profile')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Profile deleted successfully');
  });
});
