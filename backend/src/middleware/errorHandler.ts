import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = err.statusCode || 500;

  // Handle Multer validation & limit errors
  if (
    err.message &&
    (err.message.includes('Invalid file type') ||
      err.message.includes('File too large') ||
      err.code === 'LIMIT_FILE_SIZE')
  ) {
    statusCode = 400;
  }

  const message = err.message || 'Internal Server Error';

  console.error('Unhandled Error:', err);

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
