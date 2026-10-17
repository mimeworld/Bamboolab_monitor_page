import { Gauge, Layers3, Thermometer } from 'lucide-react';
import { card, muted, SectionTitle } from './ui';

export function CurrentPrintCard() {
  return <article className={`${card} p-4`}><SectionTitle eyebrow="CURRENT PRINT" title="현재 출력 정보" action={<span className="rounded bg-[#fff4e4] px-2 py-1 text-[10px] font-semibold text-[#ad7736]">● 출력 중</span>}/>
    <div className="my-5 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-lg bg-[#edf4ee] text-[#7a9380]"><Layers3 size={22}/></span><div><b className="text-xs">카메라 마운트 v2</b><p className={`text-[10px] ${muted}`}>PLA Basic · Jade White</p></div></div>
    <div className="flex justify-between text-xs"><span className={muted}>진행률</span><b className="text-brand-dark">64%</b></div><div className="my-2 h-1.5 overflow-hidden rounded-full bg-[#e9f0ea]"><div className="h-full w-[64%] rounded-full bg-brand"/></div><div className={`flex justify-between text-[10px] ${muted}`}><span>남은 시간 <b className="text-[#344a3a] dark:text-white">1시간 32분</b></span><span>예상 완료 <b className="text-[#344a3a] dark:text-white">11:57</b></span></div>
    <div className="mt-4 grid grid-cols-3 border-t border-[#e7eee8] pt-4 text-xs dark:border-[#35463b]">{[[Thermometer, '노즐', '220°C'], [Thermometer, '베드', '55°C'], [Gauge, '사용 필라멘트', '61.8g']].map(([Icon, label, value], i) => <div className="flex items-center gap-2 px-1 first:pl-0" key={i}><Icon size={16} className="shrink-0 text-[#9baea0]"/><span><small className={`block text-[10px] ${muted}`}>{label as string}</small><b>{value as string}</b></span></div>)}</div>
  </article>;
}
