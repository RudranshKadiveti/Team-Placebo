import type { Request, Response } from 'express';
import { checkDatabaseConnection } from '../config/database.js';

export const getHealth = async (_req: Request, res: Response) => {
  const isDbConnected = await checkDatabaseConnection();

  if (isDbConnected) {
    return res.status(200).json({
      success: true,
      message: 'CareerPilot API is running',
      database: 'connected',
    });
  }

  return res.status(503).json({
    success: false,
    message: 'CareerPilot API is running',
    database: 'disconnected',
  });
};
