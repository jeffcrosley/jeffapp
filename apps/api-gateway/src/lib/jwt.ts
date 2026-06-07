import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { Request, Response, NextFunction } from 'express';

const AUTHENTIK_ISSUER =
  process.env['AUTHENTIK_ISSUER'] ?? 'https://auth.jeffcrosley.com/application/o/jeffapp/';
const AUTHENTIK_JWKS_URI =
  process.env['AUTHENTIK_JWKS_URI'] ??
  'https://auth.jeffcrosley.com/application/o/jeffapp/jwks/';

const jwks = createRemoteJWKSet(new URL(AUTHENTIK_JWKS_URI));

export interface AuthenticatedRequest extends Request {
  jwtPayload?: JWTPayload;
  authentikSub?: string;
}

// Session-first auth: accepts BFF session cookie or JWT bearer token.
// Session user.id is the Authentik subject (set from id_token sub claim at login).
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // BFF session flow
  if (req.session.user?.id) {
    req.authentikSub = req.session.user.id;
    next();
    return;
  }

  // Direct JWT bearer flow (kept for client-side OIDC compatibility)
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const token = header.slice(7);
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer: AUTHENTIK_ISSUER });
    req.jwtPayload = payload;
    req.authentikSub = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'invalid_token' });
  }
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
