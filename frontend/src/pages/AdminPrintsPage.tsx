import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Save, Search } from 'lucide-react';
import { api } from '../api/client';
import { addDays, dateTime, dayKey, grams, printStatus } from '../api/format';
import type { PrintRecord, User } from '../api/types';
import { card, muted, primaryButton, softButton } from '../components/ui';

const field = 'mt-1 h-9 w-full rounded-md border border-[#dce6df] bg-white px-2 text-xs outline-none focus:border-brand dark:border-[#45604d] dark:bg-[#304436]';

function CorrectionForm({ record, users, onSaved }: { record: PrintRecord; users: User[]; onSaved: () => Promise<void> }) {
  const [userId, setUserId] = useState(record.userId || '');
  const [actualGrams, setActualGrams] = useState(record.actualFilamentG == null ? '' : String(record.actualFilamentG));
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const unchanged = userId === (record.userId || '') && actualGrams === (record.actualFilamentG == null ? '' : String(record.actualFilamentG));
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reason.trim()) { setError('보정 사유를 입력해 주세요.'); return; }
    if (actualGrams && (!Number.isFinite(Number(actualGrams)) || Number(actualGrams) < 0)) { setError('실제 사용량은 0 이상의 숫자로 입력해 주세요.'); return; }
    if (record.version === undefined) { setError('출력 기록의 버전 정보가 없습니다. 목록을 다시 조회해 주세요.'); return; }
    setBusy(true); setError(''); setSuccess('');
    try {
      await api.correctPrint(record.id, { version: record.version, reason: reason.trim(), userId: userId || null, actualFilamentG: actualGrams === '' ? null : Number(actualGrams) });
      await onSaved();
      setSuccess('출력 기록을 보정했습니다.'); setReason('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : '출력 기록을 보정하지 못했습니다.'); }
    finally { setBusy(false); }
  };
  return <form className={`${card} self-start p-5`} onSubmit={event => void save(event)}>
    <h2 className="text-sm font-bold">출력 기록 보정</h2><p className={`mt-1 text-[11px] ${muted}`}>#{record.id} · {record.title}</p>
    <div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><span className={muted}>시작</span><b className="mt-1 block">{dateTime(record.startedAt)}</b></div><div><span className={muted}>상태</span><b className="mt-1 block">{printStatus(record.status)}</b></div><div><span className={muted}>기존 소유자</span><b className="mt-1 block">{record.userId ? users.find(user => user.id === record.userId)?.displayName || `#${record.userId}` : '미지정'}</b></div><div><span className={muted}>기존 실제 사용량</span><b className="mt-1 block">{grams(record.actualFilamentG)}</b></div></div>
    <label className={`mt-5 block text-[10px] font-semibold ${muted}`}>출력 소유자<select className={field} value={userId} onChange={event => setUserId(event.target.value)}><option value="">미지정</option>{record.userId && !users.some(user => user.id === record.userId) && <option value={record.userId}>사용자 #{record.userId}</option>}{users.map(user => <option key={user.id} value={user.id}>{user.displayName} · {user.loginId}{user.isActive ? '' : ' (비활성)'}</option>)}</select></label>
    <label className={`mt-3 block text-[10px] font-semibold ${muted}`}>실제 필라멘트 사용량 (g)<input className={field} type="number" min="0" step="0.001" value={actualGrams} onChange={event => setActualGrams(event.target.value)} placeholder="비워두면 미확인"/></label>
    <label className={`mt-3 block text-[10px] font-semibold ${muted}`}>보정 사유<textarea className="mt-1 h-20 w-full rounded-md border border-[#dce6df] bg-white p-2 text-xs outline-none focus:border-brand dark:border-[#45604d] dark:bg-[#304436]" maxLength={500} required value={reason} onChange={event => setReason(event.target.value)} placeholder="소유자 또는 사용량을 변경하는 근거"/></label>
    <p className={`mt-2 text-[10px] ${muted}`}>서버가 이전 값·수정자·시각·사유를 기록합니다.</p>{error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}{success && <p role="status" className="mt-2 text-xs text-brand-dark">{success}</p>}
    <button className={`${primaryButton} mt-4 w-full`} disabled={busy || unchanged || !reason.trim()}><Save size={15}/>{busy ? '저장 중...' : '보정 저장'}</button>
  </form>;
}

export function AdminPrintsPage({ onCorrected }: { onCorrected: () => Promise<void> }) {
  const [users, setUsers] = useState<User[]>([]);
  const [records, setRecords] = useState<PrintRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [from, setFrom] = useState(dayKey(addDays(new Date(), -30)));
  const [to, setTo] = useState(dayKey(new Date()));
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const selected = records.find(record => record.id === selectedId) || null;
  const load = useCallback(async (nextPage: number, nextRange: { from: string; to: string } | null) => {
    const result = await api.prints(nextPage, nextRange || undefined);
    setRecords(result.items); setPage(nextPage); setSelectedId(current => result.items.some(record => record.id === current) ? current : null); setError('');
  }, []);
  useEffect(() => {
    let active = true;
    Promise.all([api.adminUsers(), api.prints()]).then(([userResult, printResult]) => { if (!active) return; setUsers(userResult.items); setRecords(printResult.items); })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : '관리자 데이터를 불러오지 못했습니다.'); });
    return () => { active = false; };
  }, []);
  const search = async (event: React.FormEvent) => {
    event.preventDefault();
    const start = new Date(`${from}T00:00:00+09:00`), end = new Date(new Date(`${to}T00:00:00+09:00`).getTime() + 86400000);
    if (!Number.isFinite(start.valueOf()) || !Number.isFinite(end.valueOf()) || end <= start || end.valueOf() - start.valueOf() > 366 * 86400000) { setError('조회 기간은 1일 이상, 최대 366일이어야 합니다.'); return; }
    const nextRange = { from: start.toISOString(), to: end.toISOString() };
    setBusy(true);
    try { await load(1, nextRange); setRange(nextRange); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '출력 목록을 불러오지 못했습니다.'); }
    finally { setBusy(false); }
  };
  const changePage = async (nextPage: number) => { setBusy(true); try { await load(nextPage, range); } catch (cause) { setError(cause instanceof Error ? cause.message : '출력 목록을 불러오지 못했습니다.'); } finally { setBusy(false); } };
  const corrected = async () => { await Promise.all([load(page, range), onCorrected()]); };
  return <div className="grid gap-5 xl:grid-cols-[minmax(470px,1.5fr)_minmax(300px,.8fr)]">
    <section className={`${card} min-w-0 p-5`}><div className="flex items-center justify-between"><div><small className="font-bold tracking-widest text-brand-dark">PRINT CORRECTION</small><h2 className="mt-1 text-sm font-bold">출력 기록 선택</h2></div><span className={`text-[10px] ${muted}`}>페이지 {page}</span></div>
      <form className="mt-4 flex flex-wrap items-end gap-2" onSubmit={event => void search(event)}><label className={`text-[10px] font-semibold ${muted}`}>시작 날짜<input className={field} type="date" value={from} onChange={event => setFrom(event.target.value)} required/></label><label className={`text-[10px] font-semibold ${muted}`}>종료 날짜<input className={field} type="date" value={to} onChange={event => setTo(event.target.value)} required/></label><button className={softButton} disabled={busy}><Search size={14}/> 조회</button></form>
      {error && <p role="alert" className="mt-3 text-xs text-red-600">{error}</p>}
      <div className="mt-4 max-h-[620px] space-y-2 overflow-y-auto">{records.length ? records.map(record => <button key={record.id} onClick={() => setSelectedId(record.id)} className={`w-full rounded-lg border p-3 text-left text-xs ${selectedId === record.id ? 'border-brand bg-[#eef9f0] dark:bg-[#31523d]' : 'border-[#e7eee8] hover:border-brand dark:border-[#45604d]'}`}><div className="flex justify-between gap-3"><b className="truncate">{record.title}</b><span className={muted}>{printStatus(record.status)}</span></div><div className={`mt-1 flex flex-wrap gap-x-3 text-[10px] ${muted}`}><span>#{record.id}</span><span>{dateTime(record.startedAt)}</span><span>소유자 {record.userId ? users.find(user => user.id === record.userId)?.displayName || `#${record.userId}` : '미지정'}</span><span>실제 {grams(record.actualFilamentG)}</span></div></button>) : <p className={`py-8 text-center text-xs ${muted}`}>조회 기간에 출력 기록이 없습니다.</p>}</div>
      <div className="mt-4 flex justify-between"><button className={softButton} disabled={busy || page <= 1} onClick={() => void changePage(page - 1)}><ChevronLeft size={14}/> 이전</button><button className={softButton} disabled={busy || records.length < 20} onClick={() => void changePage(page + 1)}>다음 <ChevronRight size={14}/></button></div>
    </section>
    {selected ? <CorrectionForm key={`${selected.id}-${selected.version}`} record={selected} users={users} onSaved={corrected}/> : <div className={`${card} self-start p-5 text-xs ${muted}`}>왼쪽에서 보정할 출력 기록을 선택하세요.</div>}
  </div>;
}
