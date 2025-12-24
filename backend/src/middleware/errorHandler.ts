import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode?: number;
  status?: string;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode && statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Si c'est une AppError, utiliser ses propriétés
  if (err instanceof AppError) {
    const statusCode = err.statusCode || 500;
    const status = err.status || 'error';

    return res.status(statusCode).json({
      status,
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Gérer les erreurs Prisma (contraintes uniques, etc.)
  if (err.code === 'P2002') {
    // Erreur de contrainte unique
    const target = err.meta?.target as string[] | undefined;
    let message = 'Cette valeur existe déjà dans le système';

    if (target) {
      if (target.includes('telephone')) {
        message = 'Un patient avec ce numéro de téléphone existe déjà';
      } else if (target.includes('numeroSS')) {
        message = 'Un patient avec ce numéro de sécurité sociale existe déjà';
      } else if (target.includes('email')) {
        message = 'Un utilisateur avec cet email existe déjà';
      } else if (target.includes('numeroOrdre')) {
        message = 'Un utilisateur avec ce numéro d\'ordre existe déjà';
      }
    }

    return res.status(409).json({
      status: 'fail',
      message,
    });
  }

  // Erreur par défaut
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  res.status(statusCode).json({
    status,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};


