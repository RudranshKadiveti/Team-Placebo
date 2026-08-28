import { Router } from 'express';
import {
  getGitHubStatus,
  connectGitHub,
  syncGitHub,
  getPortfolioAnalysis,
  getRepositoryDetail,
  disconnectGitHub,
} from '../controllers/github.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all GitHub endpoints with JWT authentication
router.use(authMiddleware);

router.get('/status', getGitHubStatus);
router.post('/connect', connectGitHub);
router.post('/sync', syncGitHub);
router.get('/portfolio', getPortfolioAnalysis);
router.get('/repositories/:id', getRepositoryDetail);
router.delete('/disconnect', disconnectGitHub);

export default router;
