import type { ErrorRequestHandler } from 'express';
export function fail(status: number, code: string, message: string): never { throw Object.assign(new Error(message), { status, code }); }
export const errors: ErrorRequestHandler = (error: Error & { status?: number; code?: string }, _req, res, _next) => {
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ error: { code: status === 500 ? 'INTERNAL_ERROR' : error.code || 'ERROR', message: status === 500 ? '서버 오류가 발생했습니다.' : error.message } });
};
