import { useCallback, useEffect, useState } from 'react';
import { Activity, ArrowRight, Check, Printer, UserRound, X } from 'lucide-react';
import { api, ApiError } from './api/client';
import { dayKey } from './api/format';
import type { PrintRecord, PrinterStatus, Reservation, Usage, User } from './api/types';
import { Header } from './components/Header';
import { LoginDialog, PasswordDialog } from './components/AuthDialogs';
import { SettingsDialog } from './components/SettingsDialog';
import { muted, primaryButton, softButton } from './components/ui';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminPrintsPage } from './pages/AdminPrintsPage';

export default function App() {
  const [dark, setDark] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<PrinterStatus | null>(null);
  const [prints, setPrints] = useState<PrintRecord[]>([]);
  const [myPrints, setMyPrints] = useState<PrintRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [page, setPage] = useState<'home' | 'history' | 'admin-users' | 'admin-prints'>('home');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [publicReady, setPublicReady] = useState(false);
  const [privateReady, setPrivateReady] = useState(false);
  const notify = (message: string) => setNotice(message);

  const refreshPublic = useCallback(async () => {
    const now = new Date();
    const from = `${dayKey(now)}T00:00:00+09:00`;
    const to = new Date(now.getTime() + 30 * 86400000).toISOString();
    try {
      const [nextStatus, nextPrints, nextReservations] = await Promise.all([api.status(), api.prints(), api.reservations(from, to)]);
      setStatus(nextStatus); setPrints(nextPrints.items); setReservations(nextReservations.items); setPublicReady(true); setError('');
    } catch (cause) {
      setStatus(null); setPrints([]); setReservations([]); setPublicReady(false);
      throw cause;
    }
  }, []);
  const refreshPrivate = useCallback(async () => {
    try {
      const [nextPrints, nextUsage] = await Promise.all([api.myPrints(), api.usage()]);
      setMyPrints(nextPrints.items); setUsage(nextUsage); setPrivateReady(true);
    } catch (cause) {
      setMyPrints([]); setUsage(null); setPrivateReady(false);
      throw cause;
    }
  }, []);
  const refresh = useCallback(async () => {
    try { await refreshPublic(); if (user && !user.mustChangePassword) await refreshPrivate(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '데이터를 불러오지 못했습니다.'); }
  }, [refreshPrivate, refreshPublic, user]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([api.me(), refreshPublic()]).then(async ([auth, publicResult]) => {
      if (!active) return;
      if (auth.status === 'fulfilled') setUser(auth.value.user);
      else if (!(auth.reason instanceof ApiError && auth.reason.status === 401)) setError(auth.reason instanceof Error ? auth.reason.message : '로그인 상태를 확인하지 못했습니다.');
      if (publicResult.status === 'rejected') setError(publicResult.reason instanceof Error ? publicResult.reason.message : '데이터를 불러오지 못했습니다.');
      setLoading(false);
    });
    return () => { active = false; };
  }, [refreshPublic]);
  useEffect(() => { if (user && !user.mustChangePassword) { setPrivateReady(false); void refreshPrivate().catch(cause => { if (cause instanceof ApiError && cause.status === 401) setUser(null); else setError(cause instanceof Error ? cause.message : '개인 데이터를 불러오지 못했습니다.'); }); } else { setMyPrints([]); setUsage(null); setPrivateReady(false); } }, [user, refreshPrivate]);
  useEffect(() => { if (page.startsWith('admin-') && user?.role !== 'ADMIN') setPage('home'); }, [page, user]);
  useEffect(() => { const events = new EventSource('/api/v1/events'); events.addEventListener('status', event => { try { setStatus(JSON.parse((event as MessageEvent).data) as PrinterStatus); } catch { /* malformed event; next refresh recovers */ } }); return () => events.close(); }, []);
  useEffect(() => { const timer = window.setInterval(() => { void refresh(); }, 30000); return () => window.clearInterval(timer); }, [refresh]);
  useEffect(() => { if (!notice) return; const timeout = window.setTimeout(() => setNotice(''), 3500); return () => window.clearTimeout(timeout); }, [notice]);

  const login = async (loginId: string, password: string) => { const result = await api.login(loginId, password); setUser(result.user); setError(''); notify(`${result.user.displayName}님, 로그인했습니다.`); void refreshPublic().catch(cause => setError(cause instanceof Error ? cause.message : '데이터를 불러오지 못했습니다.')); };
  const logout = async () => { try { await api.logout(); setUser(null); setAccountOpen(false); setPasswordOpen(false); setSettingsOpen(false); setPage('home'); notify('로그아웃했습니다.'); await refreshPublic(); } catch (cause) { notify(cause instanceof Error ? cause.message : '로그아웃에 실패했습니다.'); } };
  const changePassword = async (current: string, next: string) => { await api.changePassword(current, next); setUser(null); setPasswordOpen(false); setAccountOpen(false); notify('비밀번호가 변경되었습니다. 새 비밀번호로 다시 로그인해 주세요.'); setLoginOpen(true); };
  const updateAfterReservation = async () => { await refreshPublic(); notify('예약 정보가 갱신되었습니다.'); };
  const updateAfterCorrection = async () => { await Promise.all([refreshPublic(), refreshPrivate()]); notify('출력 기록을 보정했습니다.'); };
  const today = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase();
  const title = { home: '프린트룸', history: '나의 활동', 'admin-users': '사용자 관리', 'admin-prints': '출력 보정' }[page];
  const description = { home: '프린터 상태와 예약을 확인하세요.', history: '내 출력 기록과 필라멘트 사용량을 확인하세요.', 'admin-users': '계정 발급과 권한·활성 상태를 관리하세요.', 'admin-prints': '출력 소유자와 실제 사용량을 보정하세요.' }[page];

  return <div className={`min-h-screen ${dark ? 'dark bg-[#1a2a20] text-[#e7f0e9]' : ''}`}>
    <Header dark={dark} user={user} status={status} onTheme={() => setDark(value => !value)} onAccount={() => user ? setAccountOpen(value => !value) : setLoginOpen(true)} onSettings={() => setSettingsOpen(true)} onAdminUsers={() => setPage('admin-users')} onAdminPrints={() => setPage('admin-prints')} onHome={() => setPage('home')}/>
    {accountOpen && user && <div className="absolute right-4 top-16 z-10 w-48 rounded-lg border border-[#e4ebe5] bg-white p-2 text-xs shadow-lg dark:border-[#45604d] dark:bg-[#25362b]"><div className="border-b border-[#e4ebe5] px-2 py-2 font-semibold dark:border-[#45604d]">{user.displayName} · {user.role === 'ADMIN' ? '관리자' : '사용자'}</div>{user.role === 'ADMIN' && !user.mustChangePassword && <><button className="block w-full rounded px-2 py-2 text-left hover:bg-[#eaf7ee] dark:hover:bg-[#354b3c]" onClick={() => { setPage('admin-users'); setAccountOpen(false); }}>사용자 관리</button><button className="block w-full rounded px-2 py-2 text-left hover:bg-[#eaf7ee] dark:hover:bg-[#354b3c]" onClick={() => { setPage('admin-prints'); setAccountOpen(false); }}>출력 보정</button></>}<button className="block w-full rounded px-2 py-2 text-left hover:bg-[#eaf7ee] dark:hover:bg-[#354b3c]" onClick={() => { setPasswordOpen(true); setAccountOpen(false); }}>비밀번호 변경</button><button className="block w-full rounded px-2 py-2 text-left hover:bg-[#eaf7ee] dark:hover:bg-[#354b3c]" onClick={() => void logout()}>로그아웃</button></div>}
    <main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-8 sm:py-10"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><div className="text-[10px] font-bold tracking-[.16em] text-brand-dark dark:text-[#78d7a8]">{today}</div><h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1><p className={`mt-1 text-xs ${muted}`}>{description}</p></div><div className="flex gap-2"><button className={softButton} onClick={() => void refresh()}><Activity size={16}/> 상태 새로고침</button><button className={primaryButton} onClick={() => user ? setPage(page === 'home' ? 'history' : 'home') : setLoginOpen(true)}>{page === 'home' ? <UserRound size={16}/> : <Printer size={16}/>} {page === 'home' ? '내 기록 보기' : '대시보드'} <ArrowRight size={15}/></button></div></div>
      {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error} <button className="ml-2 underline" onClick={() => void refresh()}>다시 시도</button></div>}
      {loading ? <p className={`py-20 text-center text-sm ${muted}`}>데이터를 불러오는 중...</p> : page === 'home' ? publicReady ? <DashboardPage user={user} status={status} prints={prints} reservations={reservations} usage={usage} notify={notify} onHistory={() => user ? setPage('history') : setLoginOpen(true)} onLogin={() => setLoginOpen(true)} onReservationChange={updateAfterReservation}/> : <p className={`py-20 text-center text-sm ${muted}`}>서버 데이터를 불러오지 못했습니다. 다시 시도해 주세요.</p> : page === 'history' ? user && !user.mustChangePassword && privateReady ? <HistoryPage user={user} prints={myPrints} usage={usage} notify={notify}/> : <p className={`py-20 text-center text-sm ${muted}`}>{user ? '개인 데이터를 불러오는 중이거나 사용할 수 없습니다.' : '로그인 후 출력 기록을 확인할 수 있습니다.'}</p> : user?.role === 'ADMIN' && !user.mustChangePassword && page === 'admin-users' ? <AdminUsersPage currentUser={user} onCurrentUserChanged={setUser} notify={notify}/> : user?.role === 'ADMIN' && !user.mustChangePassword && page === 'admin-prints' ? <AdminPrintsPage onCorrected={updateAfterCorrection}/> : null}
      <footer className={`mt-8 flex items-center justify-between text-[10px] ${muted}`}><span>© 2026 Printroom · X2D STUDIO</span><span>{status?.lastReceivedAt ? `상태 수신: ${new Date(status.lastReceivedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}` : '상태 수신 대기 중'}</span></footer>
    </main>
    {notice && <div role="status" className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-md bg-[#26392c] px-4 py-3 text-xs text-white shadow-xl"><Check size={16} className="text-[#63d39a]"/>{notice}<button aria-label="알림 닫기" onClick={() => setNotice('')}><X size={14}/></button></div>}
    {loginOpen && <LoginDialog close={() => setLoginOpen(false)} submit={login}/>}
    {user && (user.mustChangePassword || passwordOpen) && <PasswordDialog required={user.mustChangePassword} submit={changePassword} logout={logout}/>}
    {settingsOpen && user?.role === 'ADMIN' && !user.mustChangePassword && <SettingsDialog close={() => setSettingsOpen(false)} notify={notify}/>}
  </div>;
}
