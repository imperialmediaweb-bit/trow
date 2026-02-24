import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AppError } from './error-handler.js';

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  plan: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Missing or invalid authorization header');
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    throw new AppError(401, 'TOKEN_INVALID', 'Invalid or expired token');
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (header?.startsWith('Bearer ')) {
    try {
      const token = header.slice(7);
      req.user = jwt.verify(token, config.jwtSecret) as AuthPayload;
    } catch {
      // Token invalid, continue without auth
    }
  }

  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    }
    next();
  };
}

export function requirePlan(...plans: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }
    if (!plans.includes(req.user.plan)) {
      throw new AppError(403, 'PLAN_REQUIRED', `This feature requires one of: ${plans.join(', ')}`);
    }
    next();
  };
}
