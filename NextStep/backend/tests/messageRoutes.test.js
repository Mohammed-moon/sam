import request from 'supertest';
//import app from '../server.js';
const app = require('../server'); 

describe('Message Routes', () => {
  it('should send a message successfully', async () => {
    const messageData = {
      from: 'user1',
      to: 'user2',
      message: 'Hello, how are you?',
    };

    const response = await request(app)
      .post('/api/messages')
      .send(messageData);
    
    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Message sent successfully');
  });

  it('should return 400 if message body is missing', async () => {
    const messageData = {
      from: 'user1',
      to: 'user2',
    };

    const response = await request(app)
      .post('/api/messages')
      .send(messageData);
    
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Message is required.');
  });
});
