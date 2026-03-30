import { Request, Response, NextFunction } from 'express';

// ── Extend the Express Request type with user claims ─────────────────

/** Decoded user information extracted from the JWT. */
export interface AuthUser {
  oid: string;
  name: string;
  email: string;
  roles: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
      /** GitHub Personal Access Token extracted from Authorization or x-github-token header. */
      githubToken?: string;
    }
  }
}

/** Default mock user injected in development mode. */
const DEV_USER: AuthUser = {
  oid: '00000000-0000-0000-0000-000000000000',
  name: 'Dev User',
  email: 'dev@localhost',
  roles: ['admin'],
};

/**
 * Express middleware that validates Bearer JWT tokens issued by
 * Azure AD / Entra ID.
 *
 * **Development mode** (`NODE_ENV=development` or unset):
 *   Requests without a token are allowed through with a mock user.
 *
 * **Production mode** (`NODE_ENV=production`):
 *   A valid `Authorization: Bearer <token>` header is required.
 *   The token is decoded and its claims are attached to `req.user`.
 *
 * > **Note:** Full JWKS / signature verification is a TODO.
 * > Currently the middleware validates the token structure and
 * > decodes the payload claims without cryptographic verification.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const isDev = process.env.NODE_ENV !== 'production';
  const authHeader = req.headers.authorization;

  // Stash the raw token for GitHub operations
  if (authHeader && authHeader.startsWith('Bearer ')) {
    req.githubToken = authHeader.slice(7);
  }

  // ── No token supplied ──────────────────────────────────────────────
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (isDev) {
      req.user = DEV_USER;
      next();
      return;
    }
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.slice(7); // strip "Bearer "

  try {
    const claims = decodeJwt(token);
    if (!claims) {
      throw new Error('Token payload could not be decoded');
    }

    // Validate required claims
    if (!claims.oid && !claims.sub) {
      throw new Error('Token is missing required "oid" or "sub" claim');
    }

    req.user = {
      oid: (claims.oid as string) || (claims.sub as string) || '',
      name: (claims.name as string) || (claims.preferred_username as string) || 'Unknown',
      email:
        (claims.email as string) ||
        (claims.preferred_username as string) ||
        (claims.upn as string) ||
        '',
      roles: Array.isArray(claims.roles) ? (claims.roles as string[]) : [],
    };

    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[auth] Token validation failed: ${message}`);

    if (isDev) {
      // In development, fall back to mock user so devs aren't blocked.
      req.user = DEV_USER;
      next();
      return;
    }

    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware that ensures a GitHub token is present in the request.
 * Checks for a `x-github-token` header or falls back to the
 * GITHUB_TOKEN environment variable.
 */
export function requireGitHubToken(req: Request, res: Response, next: NextFunction): void {
  const ghToken =
    req.githubToken ||
    (req.headers['x-github-token'] as string | undefined) ||
    process.env.GITHUB_TOKEN;

  if (!ghToken) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'A GitHub token is required via Authorization header, x-github-token header, or GITHUB_TOKEN env var',
      statusCode: 401,
    });
    return;
  }

  req.githubToken = ghToken;
  next();
}

/**
 * Optional auth middleware — extracts token if present but does not
 * reject requests without one.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    req.githubToken = authHeader.slice(7);

    try {
      const claims = decodeJwt(authHeader.slice(7));
      if (claims && (claims.oid || claims.sub)) {
        req.user = {
          oid: (claims.oid as string) || (claims.sub as string) || '',
          name: (claims.name as string) || (claims.preferred_username as string) || 'Unknown',
          email:
            (claims.email as string) ||
            (claims.preferred_username as string) ||
            (claims.upn as string) ||
            '',
          roles: Array.isArray(claims.roles) ? (claims.roles as string[]) : [],
        };
      }
    } catch {
      // Non-fatal — proceed without user context
    }
  }

  next();
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Decode a JWT payload **without** verifying the signature.
 *
 * TODO: Replace with full JWKS validation against the Azure AD
 *       discovery endpoint once `jsonwebtoken` + `jwks-rsa` are added.
 */
function decodeJwt(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
}
