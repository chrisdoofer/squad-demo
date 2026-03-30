import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../../src/backend/src/middleware/auth';

/** Build a minimal JWT token with the given payload claims. */
function makeToken(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.fakesignature`;
}

function mockReqResNext(headers: Record<string, string | undefined> = {}) {
  const req = {
    headers: { ...headers },
    user: undefined,
    githubToken: undefined,
  } as unknown as Request;

  const resData: { statusCode?: number; body?: unknown } = {};
  const res = {
    status(code: number) {
      resData.statusCode = code;
      return res;
    },
    json(body: unknown) {
      resData.body = body;
      return res;
    },
  } as unknown as Response;

  const next = jest.fn() as NextFunction;

  return { req, res, next, resData };
}

describe('Auth Middleware', () => {
  const ORIGINAL_ENV = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_ENV;
  });

  describe('development mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('allows requests without a token', () => {
      const { req, res, next } = mockReqResNext();
      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('attaches mock dev user when no token is provided', () => {
      const { req, res, next } = mockReqResNext();
      authMiddleware(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user!.oid).toBe('00000000-0000-0000-0000-000000000000');
      expect(req.user!.name).toBe('Dev User');
      expect(req.user!.email).toBe('dev@localhost');
      expect(req.user!.roles).toEqual(['admin']);
    });

    it('falls back to mock user for malformed tokens', () => {
      const { req, res, next } = mockReqResNext({
        authorization: 'Bearer not-a-valid-jwt',
      });
      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user!.name).toBe('Dev User');
    });
  });

  describe('production mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('rejects requests without a token', () => {
      const { req, res, next, resData } = mockReqResNext();
      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(resData.statusCode).toBe(401);
    });

    it('rejects requests with malformed tokens', () => {
      const { req, res, next, resData } = mockReqResNext({
        authorization: 'Bearer not-a-jwt',
      });
      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(resData.statusCode).toBe(401);
    });

    it('rejects tokens missing required oid/sub claim', () => {
      const token = makeToken({ name: 'No OID User' });
      const { req, res, next, resData } = mockReqResNext({
        authorization: `Bearer ${token}`,
      });
      authMiddleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(resData.statusCode).toBe(401);
    });
  });

  describe('valid JWT decoding', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('decodes valid JWT claims and attaches user', () => {
      const token = makeToken({
        oid: 'user-oid-123',
        name: 'Test User',
        email: 'test@example.com',
        roles: ['reader', 'contributor'],
      });

      const { req, res, next } = mockReqResNext({
        authorization: `Bearer ${token}`,
      });
      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({
        oid: 'user-oid-123',
        name: 'Test User',
        email: 'test@example.com',
        roles: ['reader', 'contributor'],
      });
    });

    it('uses sub claim when oid is absent', () => {
      const token = makeToken({
        sub: 'subject-456',
        preferred_username: 'jdoe@corp.com',
      });

      const { req, res, next } = mockReqResNext({
        authorization: `Bearer ${token}`,
      });
      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user!.oid).toBe('subject-456');
      expect(req.user!.email).toBe('jdoe@corp.com');
    });

    it('extracts githubToken from Authorization header', () => {
      const token = makeToken({ oid: 'user-1', name: 'User' });
      const { req, res, next } = mockReqResNext({
        authorization: `Bearer ${token}`,
      });
      authMiddleware(req, res, next);

      expect(req.githubToken).toBe(token);
    });
  });
});
