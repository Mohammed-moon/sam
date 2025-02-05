import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to a test database
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Clear the database after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Disconnect from the database after all tests
afterAll(async () => {
  await mongoose.connection.close();
});