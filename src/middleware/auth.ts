import { createMiddleware } from 'hono/factory';
import * as jose from 'jose';
import {
  roleToAuthorization,
  Authorization,
} from '@wxyc/shared/auth-client/auth';

const JWKS_URL =
  process.env.BETTER_AUTH_JWKS_URL || 'https://api.wxyc.org/auth/jwks';

let jwks: jose.JWTVerifyGetKey | null = null;

function getJWKS(): jose.JWTVerifyGetKey {
  if (!jwks) {
    jwks = jose.createRemoteJWKSet(new URL(JWKS_URL));
  }
  return jwks;
}

/**
 * Hono middleware that verifies JWT from the Authorization header
 * and sets `authenticated` to true if the user has a DJ-level role.
 *
 * Does NOT reject unauthenticated requests -- it only sets the flag.
 */
export const authMiddleware = createMiddleware<{
  Variables: { authenticated: boolean };
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    c.set('authenticated', false);
    return next();
  }

  const token = authHeader.slice(7);
  if (!token) {
    c.set('authenticated', false);
    return next();
  }

  try {
    const { payload } = await jose.jwtVerify(token, getJWKS());
    const role = payload.role as string | undefined;
    const auth = roleToAuthorization(role);
    c.set('authenticated', auth >= Authorization.DJ);
  } catch {
    c.set('authenticated', false);
  }

  return next();
});
