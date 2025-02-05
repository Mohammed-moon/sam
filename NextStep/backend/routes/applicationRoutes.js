import express from 'express';
import { 
  deleteApplication, 
  createApplication, 
  getApplicationDetails, 
  updateApplicationStatus,
  getApplicationsForJob,
  createApplicationFromProfile 
} from '../controllers/applicationController.js';
import { authMiddleware, agentRoleMiddleware } from '../middlewares/authMiddleware.js';


const router = express.Router();

router.delete('/:applicationId', authMiddleware, agentRoleMiddleware, deleteApplication);
router.post('/', authMiddleware, createApplication);
router.get('/:applicationId', authMiddleware, agentRoleMiddleware, getApplicationDetails);
router.put('/user/:userId/status', authMiddleware, agentRoleMiddleware, updateApplicationStatus);
router.put('/user/:userId/status/:jobId', authMiddleware, agentRoleMiddleware, updateApplicationStatus);
router.get('/:jobId', authMiddleware, agentRoleMiddleware, getApplicationsForJob);
router.post('/profile', authMiddleware, createApplicationFromProfile);

export default router;
