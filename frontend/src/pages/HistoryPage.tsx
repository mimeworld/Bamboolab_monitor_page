import { ArrowUpRight, CalendarDays, Download } from 'lucide-react';
import { PrintRow } from '../components/PrintRow';
import { card, muted, softButton } from '../components/ui';
import { demoPrints } from '../data/demo';

export function HistoryPage({ notify }: { notify: (message: string) => void }) {
  const prints = demoPrints.filter(print => print.user === '민지 김' || print.user === '지금 출력 중');
  return <section className={`${card} p-4 sm:p-6`}><div className="flex items-center justify-between"><div><small className="font-bold tracking-widest text-brand-dark">PERSONAL OVERVIEW</small><h2 className="mt-2 text-xl font-bold">나의 출력 기록</h2><p className={`mt-1 text-xs ${muted}`}>출력 활동과 재료 사용량을 모아봤어요.</p></div><button className={softButton} onClick={() => notify('CSV 다운로드는 백엔드 연동 후 사용할 수 있어요.')}><Download size={15}/> 내보내기</button></div>
    <div className="my-7 grid grid-cols-2 gap-3 lg:grid-cols-4">{[['총 출력 횟수', '12', '회', '이번 달 4회'], ['필라멘트 사용량', '386', 'g', '실제 측정 기준'], ['성공률', '92', '%', '완료 11 · 실패 1'], ['평균 출력 시간', '2.4', '시간', '최근 30일']].map(([label, value, unit, detail]) => <div className="rounded-lg border border-[#e7eee8] bg-[#f8faf8] p-4 dark:border-[#35463b] dark:bg-[#2b4032]" key={label}><span className={`text-xs ${muted}`}>{label}</span><b className="my-2 block text-2xl">{value}<small className="ml-1 text-xs">{unit}</small></b><em className="flex items-center gap-1 text-[10px] not-italic text-brand-dark"><ArrowUpRight size={13}/>{detail}</em></div>)}</div>
    <div className="flex items-center justify-between border-t border-[#e7eee8] pt-5 dark:border-[#35463b]"><div><small className="font-bold tracking-widest text-brand-dark">PRINT HISTORY</small><h2 className="mt-1 text-sm font-semibold">출력 목록</h2></div><button className={softButton} onClick={() => notify('기간 필터는 API 연동 후 사용할 수 있어요.')}><CalendarDays size={15}/> 최근 30일</button></div>
    <div className="mt-4 overflow-x-auto"><div className={`grid min-w-[540px] grid-cols-[minmax(155px,1.8fr)_minmax(100px,1fr)_90px_62px_68px] gap-2 border-b border-[#e7eee8] pb-2 text-[10px] ${muted}`}><span>출력물</span><span>날짜</span><span>소요 시간</span><span>필라멘트</span><span>상태</span></div>{prints.map(print => <PrintRow print={print} personal key={print.name}/>)}</div>
  </section>;
}
