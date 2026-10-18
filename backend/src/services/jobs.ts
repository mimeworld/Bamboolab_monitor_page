import type { RowDataPacket } from 'mysql2';
import { currentSettings } from '../config/settings.js';
import { env } from '../config/env.js';
import { execute, rows, withPrinterLock } from '../repositories/db.js';
import { printerKey } from './reservations.js';
// Only explicit, verified job IDs produce persistent print rows.
export async function ingestJob(raw:any){const print=raw?.print||raw;const id=print?.job_id, reported=String(print?.status||print?.gcode_state||'').toUpperCase();const status=({RUNNING:'PRINTING',PAUSE:'PAUSED',FINISH:'COMPLETED'} as Record<string,string>)[reported]||reported;if(typeof id!=='string'||!id||!['PRINTING','PAUSED','COMPLETED','FAILED','CANCELLED'].includes(status))return;
  const key=printerKey(),jobKey=`${key}:${id}`.slice(0,255),file=[print.file_name,print.gcode_file,print.subtask_name].find((value):value is string=>typeof value==='string'&&!!value)||null;
  await withPrinterLock(key,async connection=>{
    const existing=(await rows<RowDataPacket>('SELECT * FROM print_records WHERE job_key=? FOR UPDATE',[jobKey],connection))[0];
    if(existing){if(['COMPLETED','FAILED','CANCELLED'].includes(existing.print_status))return;await execute('UPDATE print_records SET print_status=?,finished_at=IF(? IN (\'COMPLETED\',\'FAILED\',\'CANCELLED\'),UTC_TIMESTAMP(3),finished_at),version=version+1 WHERE id=?',[status,status,existing.id],connection);return;}
    if(!['PRINTING','PAUSED'].includes(status))return;
    const armed=(await rows<RowDataPacket>("SELECT * FROM print_records WHERE printer_key=? AND reservation_status='BOOKED' AND armed_until>UTC_TIMESTAMP(3) AND print_status='NOT_STARTED' ORDER BY armed_at LIMIT 1 FOR UPDATE",[key],connection))[0];
    if(armed){await execute("UPDATE print_records SET job_key=?,external_job_id=?,file_name=?,print_status=?,started_at=UTC_TIMESTAMP(3),armed_at=NULL,armed_until=NULL,version=version+1 WHERE id=?",[jobKey,id,file,status,armed.id],connection);return;}
    await execute("INSERT INTO print_records(printer_key,title,file_name,print_status,started_at,external_job_id,job_key,metadata) VALUES(?,?,?,?,UTC_TIMESTAMP(3),?,?,?)",[key,file||'미지정 출력',file,status,id,jobKey,JSON.stringify({source:'MQTT',processId:env.processId})],connection);
  });
}
