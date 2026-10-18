import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { rows } from '../repositories/db.js';
import { fail } from './errors.js';

export type Principal = { id: string; loginId: string; displayName: string; role: 'ADMIN' | 'USER'; mustChangePassword: boolean; tokenVersion: number };
declare global { namespace Express { interface Request { principal?: Principal } } }
type UserRow = import('mysql2').RowDataPacket & { id: string; login_id: string; display_name: string; role: 'ADMIN'|'USER'; is_active: number; must_change_password: number; token_version: number };
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.session;
    if (token) {
      try {
        const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'], issuer: env.jwtIssuer, audience: env.jwtAudience }) as jwt.JwtPayload;
        const user = (await rows<UserRow>('SELECT id,login_id,display_name,role,is_active,must_change_password,token_version FROM users WHERE id=?', [payload.sub]))[0];
        if (user?.is_active && user.token_version === payload.token_version) req.principal = { id: String(user.id), loginId: user.login_id, displayName: user.display_name, role: user.role, mustChangePassword: !!user.must_change_password, tokenVersion: user.token_version };
      } catch { /* expired or revoked token */ }
    }
    next();
  } catch (error) { next(error); }
}
export function requireAuth(req: Request, _res: Response, next: NextFunction) { try { if (!req.principal) fail(401, 'UNAUTHENTICATED', '로그인이 필요합니다.'); if (req.principal?.mustChangePassword && !['/auth/password','/auth/logout','/auth/me','/auth/csrf'].includes(req.path) && !['/password','/logout','/me','/csrf'].includes(req.path)) fail(403, 'PASSWORD_CHANGE_REQUIRED', '비밀번호를 변경해 주세요.'); next(); } catch (error) { next(error); } }
export function requireAdmin(req: Request, _res: Response, next: NextFunction) { try { if (req.principal?.role !== 'ADMIN') fail(403, 'FORBIDDEN', '관리자 권한이 필요합니다.'); next(); } catch (error) { next(error); } }
const csrfTokens = new Map<string, { token: string; expires: number }>();
export function issueCsrf(req: Request) { const token = randomBytes(32).toString('hex'); csrfTokens.set(req.principal!.id, { token, expires: Date.now() + 3600000 }); return token; }
export function csrfGuard(req: Request, _res: Response, next: NextFunction) { try { if (['GET','HEAD','OPTIONS'].includes(req.method) || req.path === '/api/v1/auth/login') return next(); if (!req.principal) fail(401,'UNAUTHENTICATED','로그인이 필요합니다.'); const expected = csrfTokens.get(req.principal!.id); const given = String(req.get('x-csrf-token') || ''); if (!expected || expected.expires < Date.now() || given.length !== expected.token.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected.token))) fail(403,'BAD_CSRF','CSRF 토큰이 필요합니다.'); next(); } catch(error) { next(error); } }
export function clearCsrf(id: string) { csrfTokens.delete(id); }
export function setSession(res: Response, user: Principal) { const token = jwt.sign({ token_version: user.tokenVersion }, env.jwtSecret, { algorithm: 'HS256', subject: user.id, issuer: env.jwtIssuer, audience: env.jwtAudience, expiresIn: env.jwtTtl }); res.cookie('session', token, { httpOnly: true, secure: env.cookieSecure, sameSite: 'lax', path: '/', maxAge: env.jwtTtl * 1000 }); }
export function clearSession(res: Response) { res.clearCookie('session', { httpOnly: true, secure: env.cookieSecure, sameSite: 'lax', path: '/' }); }
