import { ArrowRight, ArrowUpRight, Layers3, UserRound } from 'lucide-react';
import { CameraCard } from '../components/CameraCard';
import { CurrentPrintCard } from '../components/CurrentPrintCard';
import { RecentPrintsCard } from '../components/RecentPrintsCard';
import { ReservationCard } from '../components/ReservationCard';
import { card, muted } from '../components/ui';

export function DashboardPage({ logged, notify, onHistory }: { logged: boolean; notify: (message: string) => void; onHistory: () => void }) {
  return <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(270px,1fr)_minmax(390px,1.28fr)] xl:grid-cols-[minmax(270px,1fr)_minmax(390px,1.3fr)_minmax(270px,.88fr)]">
    <div className="grid gap-4"><CameraCard notify={notify}/><CurrentPrintCard/></div>
    <RecentPrintsCard onHistory={onHistory}/>
    <aside className="grid gap-4 lg:col-span-2 lg:grid-cols-[1.4fr_1fr] xl:col-span-1 xl:grid-cols-1"><ReservationCard logged={logged} notify={notify}/><div className="grid gap-4"><article className={`${card} flex items-center gap-3 p-3`}><span className="grid size-9 place-items-center rounded-md bg-[#eaf7ee] text-brand-dark"><UserRound size={18}/></span><div className="flex-1"><b className="text-xs">내 사용 기록</b><p className={`text-[10px] ${muted}`}>출력 이력과 사용량을 확인하세요</p></div><button aria-label="내 사용 기록 보기" onClick={onHistory}><ArrowRight size={18}/></button></article><article className="rounded-xl border border-[#dceee0] bg-[#eaf7ee] p-4 text-[#446b52] dark:border-[#416448] dark:bg-[#2c4b36] dark:text-[#c9e9d0]"><div className="flex justify-between text-xs"><b>이번 달 내 사용량</b><button onClick={onHistory} className="flex items-center gap-1">자세히 <ArrowUpRight size={14}/></button></div><div className="my-3 text-3xl font-bold">— <small className="text-sm">g</small></div><div className="flex justify-between border-t border-[#d1e7d6] pt-3 text-[10px] dark:border-[#416448]"><span>로그인 후 개인 통계를 볼 수 있어요</span><Layers3 size={16}/></div></article></div></aside>
  </div>;
}
