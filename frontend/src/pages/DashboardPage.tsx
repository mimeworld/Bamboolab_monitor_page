import { ArrowUpRight } from 'lucide-react';
import { CameraCard } from '../components/CameraCard';
import { CurrentPrintCard } from '../components/CurrentPrintCard';
import { RecentPrintsCard } from '../components/RecentPrintsCard';
import { ReservationCard } from '../components/ReservationCard';
import { card, muted } from '../components/ui';
import { grams } from '../api/format';
import type { PrintRecord, PrinterStatus, Reservation, Usage, User } from '../api/types';

export function DashboardPage({ user, status, prints, reservations, usage, notify, onHistory, onLogin, onReservationChange }: { user: User | null; status: PrinterStatus | null; prints: PrintRecord[]; reservations: Reservation[]; usage: Usage | null; notify: (message: string) => void; onHistory: () => void; onLogin: () => void; onReservationChange: () => Promise<void> }) {
  return <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(270px,1fr)_minmax(390px,1.28fr)] xl:grid-cols-[minmax(270px,1fr)_minmax(390px,1.3fr)_minmax(270px,.88fr)] xl:items-stretch">
    <div className="grid gap-4 xl:h-full xl:grid-rows-2"><CameraCard user={user} onLogin={onLogin}/><CurrentPrintCard status={status}/></div>
    <RecentPrintsCard prints={prints} user={user} onHistory={onHistory}/>
    <aside className={`grid gap-4 lg:col-span-2 xl:col-span-1 xl:h-full ${user ? 'lg:grid-cols-[1.4fr_1fr] xl:grid-cols-1' : ''}`}>
      <ReservationCard user={user} reservations={reservations} notify={notify} onChange={onReservationChange}/>
      {user && <div className="grid content-start gap-4"><article className={`${card} flex items-center gap-3 p-3`}><div className="flex-1"><b className="text-xs">내 사용 기록</b><p className={`text-[10px] ${muted}`}>출력 이력과 사용량을 확인하세요</p></div><button aria-label="내 사용 기록 보기" onClick={onHistory}><ArrowUpRight size={18}/></button></article><article className="rounded-xl border border-[#dceee0] bg-[#eaf7ee] p-4 text-[#446b52] dark:border-[#555d65] dark:bg-[#2b3035] dark:text-[#e1e5e9]"><div className="flex justify-between text-xs"><b>최근 30일 실제 사용량</b><button onClick={onHistory} className="flex items-center gap-1">자세히 <ArrowUpRight size={14}/></button></div><div className="my-3 text-3xl font-bold">{usage ? grams(usage.actualFilamentG) : '—'}</div><div className="flex justify-between border-t border-[#d1e7d6] pt-3 text-[10px] dark:border-[#555d65]"><span>실제 사용량 미확인 {usage?.unconfirmedCount ?? 0}건</span></div></article></div>}
    </aside>
  </div>;
}
