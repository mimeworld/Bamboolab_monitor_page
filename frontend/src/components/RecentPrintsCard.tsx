import { ArrowRight } from 'lucide-react';
import { dayKey, grams } from '../api/format';
import type { PrintRecord, User } from '../api/types';
import { PrintRow } from './PrintRow';
import { card, muted, SectionTitle } from './ui';

export function RecentPrintsCard({ prints, user, onHistory }: { prints: PrintRecord[]; user: User | null; onHistory: () => void }) {
  const today = dayKey(new Date());
  const own = prints.filter(print => print.userId === user?.id);
  const todayCount = prints.filter(print => print.startedAt && dayKey(print.startedAt) === today).length;
  const actualTotal = own.reduce((sum, print) => sum + Number(print.actualFilamentG || 0), 0);
  return <article className={`${card} min-w-0 p-4`}><SectionTitle eyebrow="RECENT ACTIVITY" title="최근 출력 기록" action={user ? <button onClick={onHistory} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-dark">내 기록 <ArrowRight size={14}/></button> : undefined}/>
    <div className="my-5 grid grid-cols-2 rounded-lg border border-[#e7eee8] bg-[#f8faf8] p-3 dark:border-[#35463b] dark:bg-[#2b4032]"><div><small className={muted}>오늘 조회된 출력</small><b className="mt-1 block text-lg">{todayCount} <small className="text-xs">건</small></b></div><div><small className={muted}>내 실제 사용량 · 최근 목록</small><b className="mt-1 block text-lg">{user ? grams(actualTotal) : '로그인 필요'}</b></div></div>
    <div className="overflow-x-auto"><div className={`grid min-w-[540px] grid-cols-[minmax(155px,1.8fr)_minmax(100px,1fr)_90px_90px_68px] gap-2 border-b border-[#e7eee8] pb-2 text-[10px] ${muted}`}><span>출력물</span><span>사용자</span><span>소요 시간</span><span>필라멘트</span><span>상태</span></div>{prints.length ? prints.slice(0, 5).map(print => <PrintRow print={print} user={user} key={print.id}/>) : <p className={`py-8 text-center text-xs ${muted}`}>최근 30일 출력 기록이 없습니다.</p>}</div>
    <div className={`mt-3 border-t border-[#e7eee8] pt-3 text-[10px] ${muted}`}>최근 30일 · 최대 20건</div>
  </article>;
}
