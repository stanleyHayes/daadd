import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { AppError } from '../utils/error';
import { Logger } from '../utils/logger';

const logger = new Logger('ValidationMiddleware');

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        logger.warn(`Validation error on ${req.method} ${req.path}:`, messages);
        throw new AppError(`Invalid request body: ${messages.join('; ')}`, 400, 'VALIDATION_ERROR');
      }
      next(error);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        logger.warn(`Validation error on ${req.method} ${req.path}:`, messages);
        throw new AppError(`Invalid query parameters: ${messages.join('; ')}`, 400, 'VALIDATION_ERROR');
      }
      next(error);
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        logger.warn(`Validation error on ${req.method} ${req.path}:`, messages);
        throw new AppError(`Invalid URL parameters: ${messages.join('; ')}`, 400, 'VALIDATION_ERROR');
      }
      next(error);
    }
  };
}
