import type { RowDataPacket } from 'mysql2';
import { env } from '../config/env.js';
import { execute, rows, withPrinterLock } from '../repositories/db.js';
import { fail } from '../middleware/errors.js';
import type { Principal } from '../middleware/auth.js';
export type RecordRow = RowDataPacket & { id:string; user_id:string|null; printer_key:string; title:string; reservation_start:string|null; reservation_end:string|null; reservation_status:string; print_status:string; version:number; armed_until:string|null };
// A single physical printer is managed; changing its serial must not orphan reservations.
export const printerKey = () => 'x2d-primary';
const sqlDate = (date: Date) => date.toISOString().replace('T',' ').slice(0,23);
const iso = (value: string|null) => value ? `${value.replace(' ','T')}Z` : null;
export function visibleReservation(row:RecordRow, principal?:Principal) { const own=principal?.id===String(row.user_id), admin=principal?.role==='ADMIN'; return { id:String(row.id), startAt:iso(row.reservation_start), endAt:iso(row.reservation_end), status:row.reservation_status, ...(own||admin?{title:row.title,userId:row.user_id&&String(row.user_id),version:row.version,printStatus:row.print_status,armedUntil:iso(row.armed_until)}:{}) }; }
function interval(startAt:unknown,endAt:unknown) {
  if(typeof startAt!=='string'||typeof endAt!=='string'||!/(Z|[+-]\d\d:\d\d)$/.test(startAt)||!/(Z|[+-]\d\d:\d\d)$/.test(endAt)) fail(400,'BAD_TIME','시간대가 포함된 ISO 시간을 입력해 주세요.');
  const start=new Date(startAt as string),end=new Date(endAt as string),now=Date.now();
  if (!Number.isFinite(start.valueOf())||!Number.isFinite(end.valueOf())||start.valueOf()<=now||end<=start||end.valueOf()-start.valueOf()>env.maxHours*3600000||start.valueOf()>now+env.horizonDays*86400000||start.getUTCMinutes()%env.slotMinutes!==0||end.getUTCMinutes()%env.slotMinutes!==0||start.getUTCSeconds()||end.getUTCSeconds()) fail(400,'BAD_TIME','예약 시간 범위 또는 단위가 올바르지 않습니다.');
  return { start:sqlDate(start),end:sqlDate(end) };
}
export async function expireReservations() { await execute("UPDATE print_records SET reservation_status='EXPIRED',armed_at=NULL,armed_until=NULL,version=version+1 WHERE reservation_status='BOOKED' AND reservation_end<UTC_TIMESTAMP(3) AND started_at IS NULL"); }
async function overlap(connection: Parameters<Parameters<typeof withPrinterLock>[1]>[0], key:string,start:string,end:string,except?:string) { const found=await rows<RowDataPacket>("SELECT id FROM print_records WHERE printer_key=? AND reservation_status='BOOKED' AND reservation_start<? AND reservation_end>? AND (? IS NULL OR id<>?) LIMIT 1",[key,end,start,except||null,except||null],connection); if(found.length) fail(409,'RESERVATION_CONFLICT','선택한 시간에 예약이 있습니다.'); }
export async function createReservation(body:any, principal:Principal) { const {start,end}=interval(body.startAt,body.endAt), title=String(body.title||'').trim(); if(!title||title.length>255) fail(400,'BAD_INPUT','예약 이름을 입력해 주세요.'); const userId=principal.role==='ADMIN'&&body.userId?String(body.userId):principal.id, key=printerKey(); return withPrinterLock(key,async connection=>{await overlap(connection,key,start,end);const result=await execute("INSERT INTO print_records(user_id,printer_key,title,reservation_start,reservation_end,reservation_status,ownership_status) VALUES(?,?,?,?,?,'BOOKED','CONFIRMED')",[userId,key,title,start,end],connection);return String(result.insertId);}); }
export async function changeReservation(id:string,body:any,principal:Principal,action:'edit'|'cancel'|'arm'|'disarm') { const key=printerKey(); return withPrinterLock(key,async connection=>{
  const record=(await rows<RecordRow>('SELECT * FROM print_records WHERE id=? FOR UPDATE',[id],connection))[0]; if(!record||record.printer_key!==key||record.reservation_status!=='BOOKED') fail(404,'NOT_FOUND','예약을 찾을 수 없습니다.');
  if(principal.role!=='ADMIN'&&String(record.user_id)!==principal.id) fail(404,'NOT_FOUND','예약을 찾을 수 없습니다.');
  if (action==='edit'||action==='cancel') { if(record.print_status!=='NOT_STARTED') fail(409,'PRINT_LINKED','출력에 연결된 예약은 변경할 수 없습니다.'); if(Number(body.version)!==record.version) fail(409,'VERSION_CONFLICT','예약이 변경되었습니다.'); }
  if(action==='edit') {const {start,end}=interval(body.startAt,body.endAt);const title=String(body.title||'').trim();if(!title||title.length>255) fail(400,'BAD_INPUT','예약 이름이 올바르지 않습니다.');await overlap(connection,key,start,end,id);await execute('UPDATE print_records SET title=?,reservation_start=?,reservation_end=?,version=version+1 WHERE id=?',[title,start,end,id],connection);}
  if(action==='cancel') await execute("UPDATE print_records SET reservation_status='CANCELLED',armed_at=NULL,armed_until=NULL,version=version+1 WHERE id=?",[id],connection);
  if(action==='arm') {const now=Date.now(),start=Date.parse(iso(record.reservation_start)!),end=Date.parse(iso(record.reservation_end)!);if(now<start||now>=end||record.print_status!=='NOT_STARTED') fail(409,'NOT_ARMABLE','지금 연결 대기할 수 없습니다.');const active=await rows<RowDataPacket>("SELECT id FROM print_records WHERE printer_key=? AND armed_until>UTC_TIMESTAMP(3) AND id<>? LIMIT 1",[key,id],connection);if(active.length) fail(409,'ARM_CONFLICT','다른 연결 대기가 있습니다.');const until=sqlDate(new Date(Math.min(end,now+env.linkMinutes*60000)));await execute('UPDATE print_records SET armed_at=UTC_TIMESTAMP(3),armed_until=?,version=version+1 WHERE id=?',[until,id],connection);}
  if(action==='disarm') await execute('UPDATE print_records SET armed_at=NULL,armed_until=NULL,version=version+1 WHERE id=?',[id],connection);
  return (await rows<RecordRow>('SELECT * FROM print_records WHERE id=?',[id],connection))[0];
}); }
