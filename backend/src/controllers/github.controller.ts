import type { Request, Response, NextFunction } from 'express';
import { GitHubService } from '../services/github/github.service.js';
import { connectGitHubSchema } from '../validators/github.validator.js';

export const getGitHubStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = await GitHubService.getStatus(req.user!.id);
    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    return next(error);
  }
};

export const connectGitHub = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = connectGitHubSchema.parse(req.body);
    const result = await GitHubService.connect(req.user!.id, validated.username, validated.accessToken);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const syncGitHub = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await GitHubService.syncRepositories(req.user!.id);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const getPortfolioAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const portfolioData = await GitHubService.getPortfolioAnalysis(req.user!.id);
    return res.status(200).json({
      success: true,
      data: portfolioData,
    });
  } catch (error) {
    return next(error);
  }
};

export const getRepositoryDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoId = req.params.id;
    const detail = await GitHubService.getRepositoryDetail(req.user!.id, repoId);
    return res.status(200).json({
      success: true,
      data: detail,
    });
  } catch (error) {
    return next(error);
  }
};

export const disconnectGitHub = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await GitHubService.disconnect(req.user!.id);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};
