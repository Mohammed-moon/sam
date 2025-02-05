import request from 'supertest';
//import app from '../server.js';
const app = require('../server'); 
import User from '../models/User.js';
import Profile from '../models/Profile.js';

describe('Profile Routes', () => {
  let token;

  beforeAll(async () => {
    // Register and login a user to get a token
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'seeker@example.com',
        password: 'password123',
        role: 'seeker',
      });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'seeker@example.com',
        password: 'password123',
      });

    token = res.body.token;
  });

  it('should create a new profile', async () => {
    const res = await request(app)
      .post('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'John Doe',
        phone: '1234567890',
        bio: 'I am a software engineer',
        skills: ['JavaScript', 'Node.js'],
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('profile');
    expect(res.body.profile).toHaveProperty('fullName', 'John Doe');
  });

  it('should get the user profile', async () => {
    await Profile.create({
      user: 'seeker@example.com',
      fullName: 'John Doe',
      phone: '1234567890',
      bio: 'I am a software engineer',
      skills: ['JavaScript', 'Node.js'],
    });

    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('fullName', 'John Doe');
  });
});