import { CalendarDays, ChevronDown, FilePenLine, History, Layers3, Moon, Printer, Settings2, Sun, Users, Wifi, WifiOff } from 'lucide-react';
import type { PrinterStatus, User } from '../api/types';
import { printerStage } from '../api/format';
import { IconButton } from './ui';

type Props = { dark: boolean; user: User | null; status: PrinterStatus | null; onTheme: () => void; onAccount: () => void; onSettings: () => void; onAdminUsers: () => void; onAdminPrints: () => void; onHome: () => void; onReservations: () => void; onHistory: () => void; onUsage: () => void };

export function Header({ dark, user, status, onTheme, onAccount, onSettings, onAdminUsers, onAdminPrints, onHome, onReservations, onHistory, onUsage }: Props) {
  const connected = !!status?.connected && !status.stale;
  return <header className="border-b border-[#e4ebe5] bg-white dark:border-[#555d65] dark:bg-[#343a40]">
    <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8">
      <button className="flex items-center gap-2 text-left" onClick={onHome}><span className="grid size-8 place-items-center rounded-md bg-brand text-white"><Printer size={17}/></span><span className="text-sm font-extrabold tracking-tight">BAMBU<span className="font-normal">LAB</span></span><span className="ml-2 hidden border-l border-[#dce6df] pl-3 text-xs font-medium text-[#708177] sm:inline-flex">Printroom <ChevronDown size={14}/></span></button>
      <div className="hidden items-center gap-2 text-xs text-[#708177] md:flex"><span className={`size-2 rounded-full ${connected ? 'bg-brand' : 'bg-amber-500'}`}/> {printerStage(status)}</div>
      <div className="flex items-center gap-1 sm:gap-2"><span className={`mr-2 hidden items-center gap-1 text-xs sm:inline-flex ${connected ? 'text-brand-dark' : 'text-amber-700'}`}>{connected ? <Wifi size={14}/> : <WifiOff size={14}/>} {connected ? '연결됨' : '미연결'}</span><IconButton label={dark ? '라이트 모드' : '다크 모드'} onClick={onTheme}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</IconButton>{user && !user.mustChangePassword && <><IconButton label="프린터 예약" onClick={onReservations}><CalendarDays size={18}/></IconButton><IconButton label="내 기록 보기" onClick={onHistory}><History size={18}/></IconButton><IconButton label="내 사용량 보기" onClick={onUsage}><Layers3 size={18}/></IconButton></>}{user?.role === 'ADMIN' && !user.mustChangePassword && <><IconButton label="사용자 관리" onClick={onAdminUsers}><Users size={18}/></IconButton><IconButton label="출력 보정" onClick={onAdminPrints}><FilePenLine size={18}/></IconButton><IconButton label="프린터 설정" onClick={onSettings}><Settings2 size={18}/></IconButton></>}<button className="flex items-center gap-2 rounded-md border border-[#e4ebe5] px-2 py-1.5 text-xs dark:border-[#555d65]" onClick={onAccount}><span className="grid size-6 place-items-center rounded-full bg-[#ddf3e6] text-brand-dark">{user?.displayName.slice(0, 1) || '게'}</span>{user?.displayName || '로그인'}<ChevronDown size={13}/></button></div>
    </div>
  </header>;
}
