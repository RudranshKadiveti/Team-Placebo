import type { Request, Response, NextFunction } from 'express';
import {
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  getCareerGoals,
  createCareerGoal,
  updateCareerGoal,
  deleteCareerGoal,
} from '../services/profile.service.js';

export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const result = await getProfile(userId);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const createMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const result = await createProfile(userId, req.body);
    return res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const result = await updateProfile(userId, req.body);
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const result = await deleteProfile(userId);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

// --- Career Goals Handlers ---

export const getMyCareerGoals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const goals = await getCareerGoals(userId);
    return res.status(200).json({
      success: true,
      data: goals,
    });
  } catch (error) {
    return next(error);
  }
};

export const createMyCareerGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const newGoal = await createCareerGoal(userId, req.body);
    return res.status(201).json({
      success: true,
      message: 'Career goal created successfully',
      data: newGoal,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateMyCareerGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const goalId = req.params.id;
    const updatedGoal = await updateCareerGoal(userId, goalId, req.body);
    return res.status(200).json({
      success: true,
      message: 'Career goal updated successfully',
      data: updatedGoal,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteMyCareerGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const goalId = req.params.id;
    const result = await deleteCareerGoal(userId, goalId);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};
