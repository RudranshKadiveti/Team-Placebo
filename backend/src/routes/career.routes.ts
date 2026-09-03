import { Router } from 'express';
import { CareerController } from '../controllers/career.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Apply auth middleware to all career routes
router.use(authMiddleware);

// POST /api/career/jobs - Search for jobs based on target role
router.post('/jobs', CareerController.searchJobs);

// POST /api/career/roadmap - Generate and save a roadmap for a specific job
router.post('/roadmap', CareerController.generateAndSaveRoadmap);

// GET /api/career/roadmap - Get all saved roadmaps
router.get('/roadmap', CareerController.getSavedRoadmaps);

export default router;
