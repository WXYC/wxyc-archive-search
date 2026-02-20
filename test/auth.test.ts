import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';

// Mock jose before importing auth middleware
vi.mock('jose', () => ({
  createRemoteJWKSet: vi.fn(() => 'mock-jwks'),
  jwtVerify: vi.fn(),
  errors: {
    JWTExpired: class JWTExpired extends Error {},
    JWTClaimValidationFailed: class JWTClaimValidationFailed extends Error {},
    JWSSignatureVerificationFailed: class JWSSignatureVerificationFailed extends Error {},
  },
}));

import { jwtVerify } from 'jose';
import { authMiddleware } from '../src/middleware/auth.js';

const mockedJwtVerify = vi.mocked(jwtVerify);

function createTestApp() {
  const app = new Hono<{ Variables: { authenticated: boolean } }>();
  app.use('*', authMiddleware);
  app.get('/test', (c) => {
    return c.json({ authenticated: c.get('authenticated') });
  });
  return app;
}

describe('authMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets authenticated=false when no Authorization header', async () => {
    const app = createTestApp();
    const res = await app.request('/test');
    const json = await res.json();
    expect(json.authenticated).toBe(false);
  });

  it('sets authenticated=false for invalid Bearer format', async () => {
    const app = createTestApp();
    const res = await app.request('/test', {
      headers: { Authorization: 'Basic abc123' },
    });
    const json = await res.json();
    expect(json.authenticated).toBe(false);
  });

  it('sets authenticated=false for Bearer with empty token', async () => {
    const app = createTestApp();
    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer ' },
    });
    const json = await res.json();
    expect(json.authenticated).toBe(false);
  });

  it('sets authenticated=true for valid DJ token', async () => {
    mockedJwtVerify.mockResolvedValueOnce({
      payload: { sub: 'user1', role: 'dj' },
      protectedHeader: { alg: 'RS256' },
      key: {} as any,
    } as any);

    const app = createTestApp();
    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer valid-dj-token' },
    });
    const json = await res.json();
    expect(json.authenticated).toBe(true);
  });

  it('sets authenticated=true for stationManager role', async () => {
    mockedJwtVerify.mockResolvedValueOnce({
      payload: { sub: 'user2', role: 'stationManager' },
      protectedHeader: { alg: 'RS256' },
      key: {} as any,
    } as any);

    const app = createTestApp();
    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer valid-sm-token' },
    });
    const json = await res.json();
    expect(json.authenticated).toBe(true);
  });

  it('sets authenticated=true for musicDirector role', async () => {
    mockedJwtVerify.mockResolvedValueOnce({
      payload: { sub: 'user3', role: 'musicDirector' },
      protectedHeader: { alg: 'RS256' },
      key: {} as any,
    } as any);

    const app = createTestApp();
    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer valid-md-token' },
    });
    const json = await res.json();
    expect(json.authenticated).toBe(true);
  });

  it('sets authenticated=true for admin role', async () => {
    mockedJwtVerify.mockResolvedValueOnce({
      payload: { sub: 'user4', role: 'admin' },
      protectedHeader: { alg: 'RS256' },
      key: {} as any,
    } as any);

    const app = createTestApp();
    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer valid-admin-token' },
    });
    const json = await res.json();
    expect(json.authenticated).toBe(true);
  });

  it('sets authenticated=false for member role', async () => {
    mockedJwtVerify.mockResolvedValueOnce({
      payload: { sub: 'user5', role: 'member' },
      protectedHeader: { alg: 'RS256' },
      key: {} as any,
    } as any);

    const app = createTestApp();
    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer valid-member-token' },
    });
    const json = await res.json();
    expect(json.authenticated).toBe(false);
  });

  it('sets authenticated=false for expired token', async () => {
    const { errors } = await import('jose');
    mockedJwtVerify.mockRejectedValueOnce(new errors.JWTExpired('expired'));

    const app = createTestApp();
    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer expired-token' },
    });
    const json = await res.json();
    expect(json.authenticated).toBe(false);
  });

  it('sets authenticated=false for invalid signature', async () => {
    const { errors } = await import('jose');
    mockedJwtVerify.mockRejectedValueOnce(
      new errors.JWSSignatureVerificationFailed('bad sig'),
    );

    const app = createTestApp();
    const res = await app.request('/test', {
      headers: { Authorization: 'Bearer bad-sig-token' },
    });
    const json = await res.json();
    expect(json.authenticated).toBe(false);
  });

  it('does not reject unauthenticated requests (returns 200)', async () => {
    const app = createTestApp();
    const res = await app.request('/test');
    expect(res.status).toBe(200);
  });
});
