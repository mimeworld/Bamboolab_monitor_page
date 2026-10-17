import type { PrintRecord, PrinterStatus } from './types';

const zone = 'Asia/Seoul';
export const dateTime = (value: string | null | undefined) => value ? new Intl.DateTimeFormat('ko-KR', { timeZone: zone, month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)) : '—';
export const time = (value: string | null | undefined) => value ? new Intl.DateTimeFormat('ko-KR', { timeZone: zone, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)) : '—';
export const dayKey = (value: Date | string) => new Intl.DateTimeFormat('sv-SE', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(typeof value === 'string' ? new Date(value) : value);
export const addDays = (value: Date, count: number) => new Date(value.getTime() + count * 86400000);
export const duration = (start: string | null, end: string | null) => { if (!start || !end) return '—'; const minutes = Math.max(0, Math.round((Date.parse(end) - Date.parse(start)) / 60000)); return `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`; };
export const grams = (value: number | string | null | undefined) => value == null ? '미확인' : `${Number(value).toLocaleString('ko-KR', { maximumFractionDigits: 1 })} g`;
export const printStatus = (value: string) => ({ COMPLETED: '완료', PRINTING: '출력 중', PAUSED: '일시정지', FAILED: '실패', CANCELLED: '취소', UNKNOWN: '확인 필요' }[value] || value);
export const printerStage = (status: PrinterStatus | null) => !status?.connected ? '연결 안 됨' : status.stale ? '정보 오래됨' : ({ PRINTING: '출력 중', PAUSED: '일시정지', IDLE: '대기 중', FINISHED: '완료' }[String(status.stage).toUpperCase()] || status.stage || '연결됨');
export const printGrams = (record: PrintRecord) => record.actualFilamentG == null ? record.estimatedFilamentG == null ? '미확인' : `예상 ${grams(record.estimatedFilamentG)}` : grams(record.actualFilamentG);
