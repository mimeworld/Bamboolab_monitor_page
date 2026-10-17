import { useEffect, useState } from 'react';
import { Activity, ArrowRight, Check, Printer, UserRound, X } from 'lucide-react';
import { Header } from './components/Header';
import { SettingsDialog } from './components/SettingsDialog';
import { muted, primaryButton, softButton } from './components/ui';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';

export default function App() {
  const [dark, setDark] = useState(false);
  const [logged, setLogged] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [settings, setSettings] = useState(false);
  const [page, setPage] = useState<'home' | 'history'>('home');
  const [notice, setNotice] = useState('');
  const notify = (message: string) => setNotice(message);
  useEffect(() => { if (!notice) return; const timeout = window.setTimeout(() => setNotice(''), 2800); return () => window.clearTimeout(timeout); }, [notice]);
  return <div className={`min-h-screen ${dark ? 'dark bg-[#1a2a20] text-[#e7f0e9]' : ''}`}>
    <Header dark={dark} logged={logged} admin={admin} onTheme={() => setDark(value => !value)} onLogin={() => { setLogged(value => !value); notify(logged ? '로그아웃했어요.' : '민지 김으로 로그인했어요. (화면 미리보기)'); }} onSettings={() => setSettings(true)} onHome={() => setPage('home')}/>
    <main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-8 sm:py-10"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><div className="text-[10px] font-bold tracking-[.16em] text-brand-dark dark:text-[#78d7a8]">SATURDAY, OCTOBER 17</div><h1 className="mt-2 text-3xl font-bold tracking-tight">{page === 'home' ? '프린트룸' : '나의 활동'}</h1><p className={`mt-1 text-xs ${muted}`}>{page === 'home' ? '오늘의 프린터와 작업을 한눈에 확인하세요.' : '내 출력 기록과 필라멘트 사용량을 확인하세요.'}</p></div><div className="flex gap-2"><button className={softButton} onClick={() => notify('현재 화면은 데모 데이터입니다.')}><Activity size={16}/> 상태 새로고침</button><button className={primaryButton} onClick={() => setPage(page === 'home' ? 'history' : 'home')}>{page === 'home' ? <UserRound size={16}/> : <Printer size={16}/>} {page === 'home' ? '내 기록 보기' : '대시보드'} <ArrowRight size={15}/></button></div></div>
      {page === 'home' ? <DashboardPage logged={logged} notify={notify} onHistory={() => setPage('history')}/> : <HistoryPage notify={notify}/>}
      <footer className={`mt-8 flex items-center justify-between text-[10px] ${muted}`}><span>© 2026 Printroom · X2D STUDIO</span><span className="hidden sm:inline">● UI 미리보기</span><button onClick={() => setAdmin(value => !value)}>관리자 데모</button></footer>
    </main>
    {notice && <div role="status" className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-md bg-[#26392c] px-4 py-3 text-xs text-white shadow-xl"><Check size={16} className="text-[#63d39a]"/>{notice}<button aria-label="알림 닫기" onClick={() => setNotice('')}><X size={14}/></button></div>}
    {settings && <SettingsDialog close={() => setSettings(false)} notify={notify}/>}
  </div>;
}
