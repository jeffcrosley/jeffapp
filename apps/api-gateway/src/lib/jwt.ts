import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { Request, Response, NextFunction } from 'express';

const AUTHENTIK_ISSUER =
  process.env['AUTHENTIK_ISSUER'] ?? 'http://104.131.79.117:9000/application/o/jeffapp/';
const AUTHENTIK_JWKS_URI =
  process.env['AUTHENTIK_JWKS_URI'] ??
  'http://104.131.79.117:9000/application/o/jeffapp/jwks/';

const jwks = createRemoteJWKSet(new URL(AUTHENTIK_JWKS_URI));

export interface AuthenticatedRequest extends Request {
  jwtPayload?: JWTPayload;
  authentikSub?: string;
}

export async function requireJwt(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'missing_token' });
    return;
  }

  const token = header.slice(7);
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: AUTHENTIK_ISSUER,
    });
    req.jwtPayload = payload;
    req.authentikSub = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'invalid_token' });
  }
}
