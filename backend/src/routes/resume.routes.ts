import { Router } from 'express';
import {
  getResumes,
  getResumeByIdController,
  uploadResumeController,
  deleteResumeController,
  embedResumeController,
  parseResumeController,
  scoreResumeController,
  tailorBulletController,
  analyzeRoleController,
  generateActionPlanController,
} from '../controllers/resume.controller.js';
import { resumeUploadMiddleware } from '../middleware/upload.middleware.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getResumes);
router.post('/upload', resumeUploadMiddleware.single('resume'), uploadResumeController);
router.post('/tailor-bullet', tailorBulletController);
router.post('/analyze-role', analyzeRoleController);
router.post('/action-plan', generateActionPlanController);
router.post('/:id/embed', embedResumeController);
router.post('/:id/parse', parseResumeController);
router.post('/:id/score', scoreResumeController);
router.get('/:id', getResumeByIdController);
router.delete('/:id', deleteResumeController);

export default router;
