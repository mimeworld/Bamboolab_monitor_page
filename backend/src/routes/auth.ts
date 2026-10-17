import { Router } from 'express';
import argon2 from 'argon2';
import { execute, rows } from '../repositories/db.js';
import { clearCsrf, clearSession, issueCsrf, requireAuth, setSession } from '../middleware/auth.js';
import { fail } from '../middleware/errors.js';
import { publicUser, type User, userById } from '../services/users.js';
const router = Router();
const attempts = new Map<string, { count: number; until: number }>();
router.post('/login', async (req,res) => {
  const login = String(req.body?.loginId || '').trim().toLowerCase(), password = String(req.body?.password || '');
  const key = `${req.ip}:${login}`, now = Date.now(), attempt = attempts.get(key);
  if (attempt && attempt.count >= 5 && attempt.until > now) fail(429,'LOGIN_LIMIT','잠시 후 다시 시도해 주세요.');
  const user = (await rows<User>('SELECT * FROM users WHERE login_id=?',[login]))[0];
  if (!user || !user.is_active || !(await argon2.verify(user.password_hash,password))) {
    attempts.set(key,{ count: (attempt?.until && attempt.until > now ? attempt.count : 0)+1, until: now+300000 });
    fail(401,'INVALID_CREDENTIALS','로그인 정보가 올바르지 않습니다.');
  }
  attempts.delete(key);
  setSession(res,{ id:String(user.id), loginId:user.login_id, displayName:user.display_name, role:user.role, mustChangePassword:!!user.must_change_password, tokenVersion:user.token_version });
  res.json({ user: publicUser(user) });
});
router.use(requireAuth);
router.get('/me', async(req,res)=>res.json({ user: publicUser((await userById(req.principal!.id))!) }));
router.get('/csrf',(req,res)=>res.json({ token: issueCsrf(req) }));
router.post('/logout',async(req,res)=>{ await execute('UPDATE users SET token_version=token_version+1 WHERE id=?',[req.principal!.id]); clearCsrf(req.principal!.id); clearSession(res); res.status(204).end(); });
router.patch('/password',async(req,res)=>{
  const current=String(req.body?.currentPassword||''), replacement=String(req.body?.newPassword||'');
  if (replacement.length<12) fail(400,'BAD_INPUT','새 비밀번호는 12자 이상이어야 합니다.');
  const user=(await userById(req.principal!.id))!;
  if (!(await argon2.verify(user.password_hash,current))) fail(403,'BAD_PASSWORD','현재 비밀번호가 올바르지 않습니다.');
  await execute('UPDATE users SET password_hash=?,must_change_password=0,token_version=token_version+1 WHERE id=?',[await argon2.hash(replacement,{type:argon2.argon2id}),user.id]);
  clearCsrf(req.principal!.id); clearSession(res); res.status(204).end();
});
export default router;
