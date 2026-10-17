import { useCallback, useEffect, useState } from 'react';
import { KeyRound, Plus, Save, Users, X } from 'lucide-react';
import { api } from '../api/client';
import type { User } from '../api/types';
import { card, muted, primaryButton, softButton } from '../components/ui';

const input = 'mt-1 h-9 w-full rounded-md border border-[#dce6df] bg-white px-2 text-xs outline-none focus:border-brand dark:border-[#45604d] dark:bg-[#304436]';

function UserEditor({ target, currentUserId, onSaved, onCurrentUserChanged, notify }: { target: User; currentUserId: string; onSaved: () => Promise<void>; onCurrentUserChanged: (user: User) => void; notify: (message: string) => void }) {
  const [displayName, setDisplayName] = useState(target.displayName);
  const [role, setRole] = useState<User['role']>(target.role);
  const [isActive, setIsActive] = useState(target.isActive);
  const [resetOpen, setResetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const own = target.id === currentUserId;
  const changed = displayName.trim() !== target.displayName || role !== target.role || isActive !== target.isActive;
  const save = async () => {
    if (!displayName.trim()) { setError('표시 이름을 입력해 주세요.'); return; }
    setBusy(true); setError('');
    try { const result = await api.updateUser(target.id, { displayName: displayName.trim(), role, isActive }); if (own) onCurrentUserChanged(result.user); await onSaved(); notify('사용자 정보를 저장했습니다.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '사용자 정보를 저장하지 못했습니다.'); }
    finally { setBusy(false); }
  };
  const reset = async () => {
    if (newPassword.length < 12) { setError('임시 비밀번호는 12자 이상이어야 합니다.'); return; }
    setBusy(true); setError('');
    try { await api.resetUserPassword(target.id, newPassword); setNewPassword(''); setResetOpen(false); await onSaved(); notify(`${target.displayName}님의 비밀번호를 재설정했습니다. 다음 로그인 때 변경이 필요합니다.`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '비밀번호 재설정에 실패했습니다.'); }
    finally { setBusy(false); }
  };
  return <article className={`${card} p-4`}>
    <div className="flex items-center justify-between gap-2"><div><b className="text-sm">{target.displayName}</b><span className={`ml-2 text-[10px] ${muted}`}>#{target.id} · {target.loginId}</span></div><span className={`rounded px-2 py-1 text-[10px] ${target.isActive ? 'bg-[#e6f6ec] text-[#16845b]' : 'bg-[#f2f3f2] text-[#818c83]'}`}>{target.isActive ? '활성' : '비활성'}</span></div>
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px_auto]"><label className={`text-[10px] font-semibold ${muted}`}>표시 이름<input className={input} value={displayName} maxLength={100} onChange={event => setDisplayName(event.target.value)}/></label><label className={`text-[10px] font-semibold ${muted}`}>권한<select className={input} value={role} disabled={own} onChange={event => setRole(event.target.value as User['role'])}><option value="USER">일반 사용자</option><option value="ADMIN">관리자</option></select></label><label className={`flex items-end gap-2 pb-2 text-xs ${muted}`}><input type="checkbox" checked={isActive} disabled={own} onChange={event => setIsActive(event.target.checked)}/> 계정 활성</label></div>
    {target.mustChangePassword && <p className="mt-2 text-[10px] text-amber-700">다음 로그인 때 비밀번호 변경 필요</p>}
    {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
    <div className="mt-3 flex flex-wrap gap-2"><button className={primaryButton} disabled={busy || !changed} onClick={() => void save()}><Save size={14}/> 변경 저장</button>{!own && <button className={softButton} disabled={busy} onClick={() => { setResetOpen(value => !value); setError(''); }}><KeyRound size={14}/> 비밀번호 재설정</button>}</div>
    {resetOpen && <div className="mt-3 flex flex-wrap items-end gap-2 rounded-lg bg-[#f7faf7] p-3 dark:bg-[#304436]"><label className={`min-w-[200px] flex-1 text-[10px] font-semibold ${muted}`}>새 임시 비밀번호<input className={input} type="password" autoComplete="new-password" minLength={12} value={newPassword} onChange={event => setNewPassword(event.target.value)} placeholder="12자 이상"/></label><button className={primaryButton} disabled={busy || newPassword.length < 12} onClick={() => void reset()}>재설정</button><button className={softButton} onClick={() => { setResetOpen(false); setNewPassword(''); }} aria-label="비밀번호 재설정 닫기"><X size={14}/></button></div>}
  </article>;
}

export function AdminUsersPage({ currentUser, onCurrentUserChanged, notify }: { currentUser: User; onCurrentUserChanged: (user: User) => void; notify: (message: string) => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loginId, setLoginId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => { const result = await api.adminUsers(); setUsers(result.items); setError(''); }, []);
  useEffect(() => { let active = true; api.adminUsers().then(result => { if (active) setUsers(result.items); }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : '사용자 목록을 불러오지 못했습니다.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^[a-z0-9._-]{3,100}$/.test(loginId) || !displayName.trim() || password.length < 12) { setError('ID는 영문 소문자·숫자·._-로 3자 이상, 비밀번호는 12자 이상이어야 합니다.'); return; }
    setBusy(true); setError('');
    try { await api.createUser(loginId, displayName.trim(), password); setLoginId(''); setDisplayName(''); setPassword(''); await refresh(); notify('일반 사용자 계정을 생성했습니다.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '계정을 생성하지 못했습니다.'); }
    finally { setBusy(false); }
  };
  return <div className="grid gap-5 xl:grid-cols-[minmax(270px,.8fr)_minmax(500px,1.6fr)]">
    <form className={`${card} self-start p-5`} onSubmit={event => void create(event)}><div className="flex items-center gap-2"><Plus size={18} className="text-brand-dark"/><h2 className="text-sm font-bold">사용자 계정 발급</h2></div><p className={`mt-2 text-[11px] ${muted}`}>새 계정은 일반 사용자로 생성됩니다. 첫 로그인 때 비밀번호 변경이 필요합니다.</p><label className={`mt-5 block text-[10px] font-semibold ${muted}`}>로그인 ID<input className={input} value={loginId} onChange={event => setLoginId(event.target.value.toLowerCase())} autoComplete="off" placeholder="영문 소문자·숫자·._-" maxLength={100} required/></label><label className={`mt-3 block text-[10px] font-semibold ${muted}`}>표시 이름<input className={input} value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={100} required/></label><label className={`mt-3 block text-[10px] font-semibold ${muted}`}>초기 비밀번호<input className={input} type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" minLength={12} required/></label>{error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}<button className={`${primaryButton} mt-4 w-full`} disabled={busy}>{busy ? '생성 중...' : '계정 생성'}</button></form>
    <section><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><Users size={18} className="text-brand-dark"/><h2 className="text-sm font-bold">사용자 목록</h2><span className={`text-xs ${muted}`}>({users.length})</span></div><button className={softButton} onClick={() => void refresh().catch(cause => setError(cause instanceof Error ? cause.message : '새로고침에 실패했습니다.'))}>새로고침</button></div>{loading ? <p className={`py-8 text-xs ${muted}`}>사용자를 불러오는 중...</p> : users.length ? <div className="grid gap-3">{users.map(target => <UserEditor key={`${target.id}-${target.displayName}-${target.role}-${target.isActive}-${target.mustChangePassword}`} target={target} currentUserId={currentUser.id} onSaved={refresh} onCurrentUserChanged={onCurrentUserChanged} notify={notify}/>)}</div> : <p className={`${card} p-5 text-xs ${muted}`}>사용자가 없습니다.</p>}</section>
  </div>;
}
