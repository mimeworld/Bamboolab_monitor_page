import { Download } from 'lucide-react';
import { grams } from '../api/format';
import type { PrintRecord, Usage, User } from '../api/types';
import { PrintRow } from '../components/PrintRow';
import { card, muted, softButton } from '../components/ui';

export function HistoryPage({ user, prints, usage, notify }: { user: User | null; prints: PrintRecord[]; usage: Usage | null; notify: (message: string) => void }) {
  const count = Number(usage?.printCount || 0), completed = Number(usage?.completedCount || 0);
  const exportCsv = () => {
    if (!prints.length) { notify('내보낼 출력 기록이 없습니다.'); return; }
    const escape = (value: unknown) => { const text = String(value ?? ''); return `"${(/^[=+@-]/.test(text) ? `'${text}` : text).replace(/"/g, '""')}"`; };
    const rows = [['ID', '제목', '상태', '시작', '종료', '실제 사용량(g)', '예상 사용량(g)'], ...prints.map(print => [print.id, print.title, print.status, print.startedAt, print.finishedAt, print.actualFilamentG, print.estimatedFilamentG])];
    const blob = new Blob(['\uFEFF', rows.map(row => row.map(escape).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'my-prints.csv'; link.click(); URL.revokeObjectURL(url);
  };
  return <section className={`${card} p-4 sm:p-6`}><div className="flex items-center justify-between"><div><small className="font-bold tracking-widest text-brand-dark">PERSONAL OVERVIEW</small><h2 className="mt-2 text-xl font-bold">나의 출력 기록</h2><p className={`mt-1 text-xs ${muted}`}>최근 30일 출력과 재료 사용량입니다.</p></div><button className={softButton} onClick={exportCsv}><Download size={15}/> CSV 내보내기</button></div>
    <div className="my-7 grid grid-cols-2 gap-3 lg:grid-cols-4">{[['총 출력 횟수', count, '건', '최근 30일'], ['실제 필라멘트 사용량', grams(usage?.actualFilamentG), '', `미확인 ${usage?.unconfirmedCount ?? 0}건`], ['완료', completed, '건', `실패 ${usage?.failedCount ?? 0}건`], ['예상 사용량 합계', grams(usage?.estimatedFilamentG), '', '실제 사용량과 구분']].map(([label, value, unit, detail]) => <div className="rounded-lg border border-[#e7eee8] bg-[#f8faf8] p-4 dark:border-[#35463b] dark:bg-[#2b4032]" key={label}><span className={`text-xs ${muted}`}>{label}</span><b className="my-2 block text-2xl">{value}<small className="ml-1 text-xs">{unit}</small></b><em className="text-[10px] not-italic text-brand-dark">{detail}</em></div>)}</div>
    <div className="border-t border-[#e7eee8] pt-5 dark:border-[#35463b]"><small className="font-bold tracking-widest text-brand-dark">PRINT HISTORY</small><h2 className="mt-1 text-sm font-semibold">출력 목록</h2></div>
    <div className="mt-4 overflow-x-auto"><div className={`grid min-w-[540px] grid-cols-[minmax(155px,1.8fr)_minmax(100px,1fr)_90px_90px_68px] gap-2 border-b border-[#e7eee8] pb-2 text-[10px] ${muted}`}><span>출력물</span><span>날짜</span><span>소요 시간</span><span>필라멘트</span><span>상태</span></div>{prints.length ? prints.map(print => <PrintRow print={print} user={user} personal key={print.id}/>) : <p className={`py-8 text-center text-xs ${muted}`}>최근 30일 내 출력 기록이 없습니다.</p>}</div>
  </section>;
}
