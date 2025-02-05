import request from 'supertest';
const app = require('../server'); 
//import app from '../server.js';  // Assuming server.js is the entry point for the Express app
import mongoose from 'mongoose';

describe('Authentication Routes', () => {
  beforeAll(async () => {
    // Setup in-memory database
    const connection = await mongoose.connect('mongodb://localhost/test');
  });

  afterAll(async () => {
    // Close database connection after tests
    await mongoose.connection.close();
  });

  it('should register a new user successfully', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'Test@123',
    };
    
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);
    
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User registered successfully');
  });

  it('should login successfully with valid credentials', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'Test@123',
    };
    
    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData);
    
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();  // Assumes the token is returned on login
  });

  it('should return 401 for invalid credentials', async () => {
    const loginData = {
      email: 'invalid@example.com',
      password: 'Invalid123',
    };
    
    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData);
    
    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials');
  });
});
