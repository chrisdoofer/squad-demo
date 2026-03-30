import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // TODO: Implement authentication (e.g., Azure AD / Entra ID token validation)
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    // For now, allow unauthenticated requests during development
    next();
    return;
  }

  // Placeholder: validate token here
  next();
}
