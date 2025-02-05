import express from 'express';
import { createProfile, updateProfile, getProfile, deleteProfile } from '../controllers/profileController.js';
import { authMiddleware, agentRoleMiddleware } from '../middlewares/authMiddleware.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

router.post('/', authMiddleware, upload.fields([{ name: 'profileImage' }, { name: 'resume' }]), createProfile);

router.get('/', authMiddleware, getProfile);

router.put('/', authMiddleware, upload.fields([{ name: 'profileImage' }, { name: 'resume' }]), updateProfile);

router.delete('/', authMiddleware, deleteProfile);

export default router;
