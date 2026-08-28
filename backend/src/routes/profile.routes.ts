import { Router } from 'express';
import {
  getMyProfile,
  createMyProfile,
  updateMyProfile,
  deleteMyProfile,
  getMyCareerGoals,
  createMyCareerGoal,
  updateMyCareerGoal,
  deleteMyCareerGoal,
} from '../controllers/profile.controller.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all profile & career goal endpoints
router.use(authMiddleware);

// Profile CRUD
router.get('/', getMyProfile);
router.post('/', createMyProfile);
router.put('/', updateMyProfile);
router.delete('/', deleteMyProfile);

// Career Goals CRUD
router.get('/career-goals', getMyCareerGoals);
router.post('/career-goals', createMyCareerGoal);
router.put('/career-goals/:id', updateMyCareerGoal);
router.delete('/career-goals/:id', deleteMyCareerGoal);

export default router;
