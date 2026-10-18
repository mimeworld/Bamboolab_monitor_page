import { Gauge, Layers3, Thermometer } from 'lucide-react';
import { printerStage } from '../api/format';
import type { PrinterStatus } from '../api/types';
import { card, muted, SectionTitle } from './ui';

export function CurrentPrintCard({ status }: { status: PrinterStatus | null }) {
  const active = !!status?.connected && !status.stale && ['PRINTING', 'PAUSED'].includes(String(status.stage).toUpperCase());
  const progress = !active || status?.progress == null ? null : Math.max(0, Math.min(100, status.progress));
  return <article className={`${card} p-4`}><SectionTitle eyebrow="CURRENT PRINT" title="현재 출력 정보" action={<span className="rounded bg-[#fff4e4] px-2 py-1 text-[10px] font-semibold text-[#ad7736]">{printerStage(status)}</span>}/>
    <div className="my-5 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-lg bg-[#edf4ee] text-[#7a9380]"><Layers3 size={22}/></span><div><b className="text-xs">{status?.connected && !status.stale ? status.stage || '상태 확인 중' : '프린터 연결 대기 중'}</b><p className={`text-[10px] ${muted}`}>{status?.error || (status?.lastReceivedAt ? '프린터에서 받은 최신 상태' : '수신된 상태가 없습니다.')}</p></div></div>
    <div className="flex justify-between text-xs"><span className={muted}>진행률</span><b className="text-brand-dark">{progress == null ? '—' : `${progress}%`}</b></div><div className="my-2 h-1.5 overflow-hidden rounded-full bg-[#e9f0ea]"><div className="h-full rounded-full bg-brand" style={{ width: `${progress || 0}%` }}/></div><div className={`text-[10px] ${muted}`}>남은 시간 <b className="text-[#344a3a] dark:text-white">{status?.remainingMinutes == null ? '—' : `${status.remainingMinutes}분`}</b></div>
    <div className="mt-4 grid grid-cols-3 border-t border-[#e7eee8] pt-4 text-xs dark:border-[#555d65]">{[[Thermometer, '노즐', status?.nozzleTemperatures?.length ? `${status.nozzleTemperatures[0]}°C` : '—'], [Thermometer, '베드', status?.bedTemperature == null ? '—' : `${status.bedTemperature}°C`], [Gauge, '상태', status?.stale ? '오래됨' : status?.connected ? '실시간' : '미연결']].map(([Icon, label, value], i) => <div className="flex items-center gap-2 px-1 first:pl-0" key={i}><Icon size={16} className="shrink-0 text-[#9baea0]"/><span><small className={`block text-[10px] ${muted}`}>{label as string}</small><b>{value as string}</b></span></div>)}</div>
  </article>;
}
