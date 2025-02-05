import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import chalk from 'chalk';
import upload from './middlewares/upload.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profileRoute.js';
import jobRoutes from './routes/jobRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import { getJobDetails } from './controllers/jobController.js';
import { fileURLToPath } from 'url';
import messageRoutes from './routes/messageRoutes.js';

// Load environment variables
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' });
} else {
  dotenv.config();
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(helmet());

// Ensure the 'uploads' directory exists
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log(chalk.green('Uploads directory created'));
}

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(chalk.green('MongoDB connected successfully')))
  .catch((err) => console.log(chalk.red('MongoDB connection error:', err)));

// Define frontend path using __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from frontend (next to the backend folder)
const frontendPath = path.resolve(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Serve static files from 'uploads' folder
app.use('/uploads', express.static(uploadDir, {
  setHeaders: (res, path, stat) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    console.log('Serving file:', path); // Log the file being served
  },
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);

// Handle file uploads for job applications
app.post('/api/applications/:jobId/apply', upload.single('resume'), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Resume is required.' });
    }

    const newApplication = new Application({
      job: jobId,
      user: userId,
      resume: `/uploads/${req.file.filename}`, // Save the file path relative to the public URL
      status: 'applied',
    });

    await newApplication.save();

    return res.status(201).json({ message: 'Application submitted successfully', application: newApplication });
  } catch (error) {
    console.error(chalk.red(error));
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Fetch job details by jobId
app.get('/api/jobs/:jobId', getJobDetails);

// Catch-all route to serve index.html for any other routes (frontend routing)
app.get('*', (req, res) => {
  const indexPath = path.resolve(frontendPath, 'index.html');
  console.log(chalk.cyan('Serving index.html from:', indexPath));
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.log(chalk.red('Error serving index.html:', err));
      res.status(500).send({ message: 'Internal server error' });
    }
  });
});

// Message routes
app.use('/api/messages', messageRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  const status = err.name && err.name === 'ValidationError' ? 400 : 500;
  res.status(status).send({ message: err.message });
});

// Start the server
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(chalk.green(`Server running on http://localhost:${PORT}`));
  });
}

export default app;