import request from 'supertest';
//import app from '../server.js';
const app = require('../server'); 
import mongoose from 'mongoose';
import Job from '../models/Job.js';

beforeAll(async () => {
  await mongoose.connect('mongodb://localhost/test');
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Job Routes', () => {
  it('should create a new job', async () => {
    const jobData = {
      title: 'Software Developer',
      description: 'Test job description',
      company: 'Test Company',
      location: 'Remote',
      salary: 100000,
    };

    const response = await request(app)
      .post('/api/jobs')
      .send(jobData);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Job created successfully');
  });

  it('should get job details', async () => {
    const job = await Job.create({
      title: 'Software Developer',
      description: 'Test job description',
      company: 'Test Company',
      location: 'Remote',
      salary: 100000,
    });

    const response = await request(app)
      .get(`/api/jobs/${job._id}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('title', 'Software Developer');
  });

  it('should return 404 if job not found', async () => {
    const response = await request(app)
      .get('/api/jobs/invalidJobId');
    
    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Job not found');
  });
});
