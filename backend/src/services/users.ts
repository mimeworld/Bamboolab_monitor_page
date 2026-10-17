import argon2 from 'argon2';
import type { RowDataPacket } from 'mysql2';
import { db, execute, rows } from '../repositories/db.js';
import { env } from '../config/env.js';
import { fail } from '../middleware/errors.js';

export type User = RowDataPacket & { id: string; login_id: string; display_name: string; password_hash: string; role: 'ADMIN'|'USER'; is_active: number; must_change_password: number; token_version: number };
export function publicUser(user: User) { return { id: String(user.id), loginId: user.login_id, displayName: user.display_name, role: user.role, isActive: !!user.is_active, mustChangePassword: !!user.must_change_password }; }
export async function userById(id: string) { return (await rows<User>('SELECT * FROM users WHERE id=?', [id]))[0]; }
export async function bootstrapAdmin() {
  const existing = (await rows<RowDataPacket>('SELECT COUNT(*) AS count FROM users'))[0].count;
  if (existing) return;
  if (!env.bootstrapLogin || !env.bootstrapPassword) throw new Error('BOOTSTRAP_ADMIN_LOGIN and BOOTSTRAP_ADMIN_PASSWORD required for first installation');
  if (env.bootstrapPassword.length < 12) throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters');
  await execute('INSERT INTO users(login_id,display_name,password_hash,role) VALUES(?,?,?,?)', [env.bootstrapLogin.toLowerCase(), '관리자', await argon2.hash(env.bootstrapPassword, { type: argon2.argon2id }), 'ADMIN']);
}
export async function createUser(loginId: string, displayName: string, password: string) {
  if (!/^[a-z0-9._-]{3,100}$/.test(loginId) || !displayName?.trim() || password.length < 12) fail(400,'BAD_INPUT','계정 정보가 올바르지 않습니다.');
  const result = await execute('INSERT INTO users(login_id,display_name,password_hash) VALUES(?,?,?)', [loginId, displayName.trim(), await argon2.hash(password, { type: argon2.argon2id })]);
  return userById(String(result.insertId));
}
export async function updateUser(id: string, patch: { displayName?: string; role?: string; isActive?: boolean }) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [found] = await connection.execute<User[]>('SELECT * FROM users WHERE id=? FOR UPDATE',[id]);
    const user = found[0]; if (!user) fail(404,'NOT_FOUND','사용자를 찾을 수 없습니다.');
    const role = patch.role ?? user.role, active = patch.isActive ?? !!user.is_active, name = patch.displayName ?? user.display_name;
    if (!['ADMIN','USER'].includes(role) || !name.trim()) fail(400,'BAD_INPUT','계정 정보가 올바르지 않습니다.');
    if (user.role === 'ADMIN' && user.is_active && (role !== 'ADMIN' || !active)) {
      const [admins] = await connection.execute<RowDataPacket[]>('SELECT id FROM users WHERE role=\'ADMIN\' AND is_active=1 FOR UPDATE');
      if (admins.length <= 1) fail(409,'LAST_ADMIN','마지막 관리자는 변경할 수 없습니다.');
    }
    await connection.execute('UPDATE users SET display_name=?,role=?,is_active=?,token_version=token_version+? WHERE id=?',[name.trim(),role,active,role !== user.role || active !== !!user.is_active ? 1 : 0,id]);
    await connection.commit();
  } catch(error) { await connection.rollback(); throw error; } finally { connection.release(); }
  return userById(id);
}
