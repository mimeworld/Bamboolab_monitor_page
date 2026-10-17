import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { demoPrints } from '../data/demo';
import { PrintRow } from './PrintRow';
import { card, muted, SectionTitle } from './ui';

export function RecentPrintsCard({ onHistory }: { onHistory: () => void }) {
  return <article className={`${card} min-w-0 p-4`}><SectionTitle eyebrow="RECENT ACTIVITY" title="지금까지 출력 기록" action={<button onClick={onHistory} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-dark">전체 보기 <ArrowRight size={14}/></button>}/>
    <div className="my-5 grid grid-cols-3 rounded-lg border border-[#e7eee8] bg-[#f8faf8] p-3 dark:border-[#35463b] dark:bg-[#2b4032]"><div><small className={muted}>오늘 출력</small><b className="mt-1 block text-lg">3 <small className="text-xs">건</small></b></div><div><small className={muted}>이번 주 사용량</small><b className="mt-1 block text-lg">428 <small className="text-xs">g</small></b></div><div><small className={muted}>지난주보다</small><b className="mt-1 flex items-center text-xs text-brand-dark"><ArrowUpRight size={14}/> 12.8%</b></div></div>
    <div className="overflow-x-auto"><div className={`grid min-w-[540px] grid-cols-[minmax(155px,1.8fr)_minmax(100px,1fr)_90px_62px_68px] gap-2 border-b border-[#e7eee8] pb-2 text-[10px] ${muted}`}><span>출력물</span><span>사용자</span><span>소요 시간</span><span>필라멘트</span><span>상태</span></div>{demoPrints.map(print => <PrintRow print={print} key={print.name}/>)}</div>
    <button onClick={onHistory} className={`mt-3 flex w-full items-center justify-center gap-1 py-1 text-xs ${muted}`}>모든 출력 기록 보기 <ArrowRight size={14}/></button><div className={`flex justify-between border-t border-[#e7eee8] pt-3 text-[10px] ${muted}`}><span>● 데모 데이터</span><span>API 미연결</span></div>
  </article>;
}
