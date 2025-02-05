import express from 'express';
import { createJob, getJobsByCompany, updateJob, getApplicationCountForJob, getJobsAppliedByUser, applyForJob, updateJobStatus, getFilteredJobs, getJobs, getJobDetails, recommendJobs, deleteJob, getApplicationsForJob, getJobRecommendations } from '../controllers/jobController.js';
//import agentRoleMiddleware from '../middlewares/authMiddleware.js';
import { updateApplicationStatus } from '../controllers/applicationController.js';
import applicationRoute from '../routes/applicationRoutes.js';
import upload from '../middlewares/upload.js';
import { authMiddleware, agentRoleMiddleware } from '../middlewares/authMiddleware.js';


const router = express.Router();

router.get('/search', authMiddleware, getFilteredJobs);

router.use('/:jobId/applications', applicationRoute);

router.post('/', authMiddleware, agentRoleMiddleware, createJob);

router.get('/', authMiddleware, getJobsByCompany);

router.get('/api/jobs/:jobId', getJobDetails);

router.get('/', authMiddleware, getJobs);

router.get('/search', authMiddleware, getFilteredJobs);

router.put('/:id', authMiddleware, agentRoleMiddleware, updateJob);

router.put('/:id/status', authMiddleware, agentRoleMiddleware, updateJobStatus);

router.get('/:id/applications/count', authMiddleware, getApplicationCountForJob);

router.get('/user/applications', authMiddleware, getJobsAppliedByUser);

router.post('/:jobId/apply', authMiddleware, upload.single('resume'), applyForJob);

router.put('/:id/status', authMiddleware, agentRoleMiddleware, updateJobStatus);

router.get('/jobs/:jobId', getJobDetails);

router.get('/recommend', authMiddleware, getJobRecommendations);

router.delete('/:id', authMiddleware, agentRoleMiddleware, deleteJob);

router.get('/:jobId/applications', authMiddleware, agentRoleMiddleware, getApplicationsForJob);

export default router;