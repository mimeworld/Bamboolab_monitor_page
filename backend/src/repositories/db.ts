import mysql, { type PoolConnection, type RowDataPacket, type ResultSetHeader } from 'mysql2/promise';
import { env } from '../config/env.js';

export const db = mysql.createPool({ host: env.db.host, port: env.db.port, user: env.db.user, password: env.db.password, database: env.db.name, waitForConnections: true, connectionLimit: 10, timezone: 'Z', decimalNumbers: true, dateStrings: true });
export async function rows<T extends RowDataPacket>(sql: string, params: any[] = [], connection: typeof db | PoolConnection = db): Promise<T[]> {
  const [result] = await connection.execute<T[]>(sql, params);
  return result;
}
export async function execute(sql: string, params: any[] = [], connection: typeof db | PoolConnection = db): Promise<ResultSetHeader> {
  const [result] = await connection.execute<ResultSetHeader>(sql, params);
  return result;
}
export async function withPrinterLock<T>(key: string, work: (connection: PoolConnection) => Promise<T>): Promise<T> {
  const connection = await db.getConnection();
  const lockName = `bambu:reservation:${key}`.slice(0, 64);
  let locked = false;
  try {
    const [result] = await connection.query<RowDataPacket[]>('SELECT GET_LOCK(?, 5) AS locked', [lockName]);
    if (result[0].locked !== 1) throw Object.assign(new Error('Printer reservation lock busy'), { status: 503, code: 'LOCK_BUSY' });
    locked = true;
    await connection.beginTransaction();
    try { const value = await work(connection); await connection.commit(); return value; }
    catch (error) { await connection.rollback(); throw error; }
  } finally {
    if (locked) await connection.query('SELECT RELEASE_LOCK(?)', [lockName]);
    connection.release();
  }
}
