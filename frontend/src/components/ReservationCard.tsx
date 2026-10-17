import { useState } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import { api } from '../api/client';
import { addDays, dateTime, dayKey, time } from '../api/format';
import type { Reservation, User } from '../api/types';
import { card, muted, SectionTitle, primaryButton, softButton } from './ui';

const field = 'mt-1 h-9 w-full rounded-md border border-[#dce6df] bg-white px-2 text-xs outline-none focus:border-brand dark:border-[#45604d] dark:bg-[#304436]';
const slots = Array.from({ length: 48 }, (_, index) => `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`);

export function ReservationCard({ user, reservations, notify, onLogin, onChange }: { user: User | null; reservations: Reservation[]; notify: (message: string) => void; onLogin: () => void; onChange: () => Promise<void> }) {
  const [day, setDay] = useState(dayKey(new Date()));
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('13:00');
  const [end, setEnd] = useState('15:00');
  const [busy, setBusy] = useState(false);
  const today = dayKey(new Date());
  const maxDay = dayKey(addDays(new Date(), 29));
  const selected = reservations.filter(item => dayKey(item.startAt) === day);
  const active = reservations.some(item => Date.parse(item.startAt) <= Date.now() && Date.parse(item.endAt) > Date.now());
  const create = async () => {
    if (!user) { onLogin(); return; }
    if (!title.trim()) { notify('예약 이름을 입력해 주세요.'); return; }
    setBusy(true);
    try { await api.createReservation(title.trim(), new Date(`${day}T${start}:00+09:00`).toISOString(), new Date(`${day}T${end}:00+09:00`).toISOString()); setTitle(''); await onChange(); notify('예약이 등록되었습니다.'); }
    catch (cause) { notify(cause instanceof Error ? cause.message : '예약에 실패했습니다.'); }
    finally { setBusy(false); }
  };
  const action = async (item: Reservation, kind: 'cancel' | 'arm' | 'disarm') => {
    setBusy(true);
    try { if (kind === 'cancel') await api.cancelReservation(item.id, item.version!); else if (kind === 'arm') await api.armReservation(item.id); else await api.disarmReservation(item.id); await onChange(); notify(kind === 'cancel' ? '예약을 취소했습니다.' : kind === 'arm' ? '다음 출력을 이 예약에 연결 대기합니다.' : '연결 대기를 해제했습니다.'); }
    catch (cause) { notify(cause instanceof Error ? cause.message : '요청에 실패했습니다.'); }
    finally { setBusy(false); }
  };
  return <article className={`${card} p-4`}><SectionTitle eyebrow="RESERVATION" title="프린터 예약" action={<CalendarDays size={18} className={muted}/>}/>
    <div className={`mt-4 rounded-lg p-3 text-xs ${active ? 'bg-[#fff4e4] text-[#9a6a2d]' : 'bg-[#eaf7ee] text-brand-dark dark:bg-[#31523d]'}`}><b>{active ? '현재 예약 중' : '현재 예약 없음'}</b><small className="mt-1 block">{active ? '예약 시간과 실제 출력 상태는 별개입니다.' : '선택한 날짜의 점유 시간을 아래에서 확인하세요.'}</small></div>
    <label className={`mt-4 block text-[10px] font-semibold ${muted}`}>예약 날짜<input type="date" className={field} min={today} max={maxDay} value={day} onChange={event => setDay(event.target.value)}/></label>
    <div className="mt-4 text-xs font-semibold">{day} 예약 현황</div><div className="mt-2 max-h-44 space-y-2 overflow-auto">{selected.length ? selected.map(item => { const own = !!user && (item.userId === user.id || user.role === 'ADMIN'); const armable = Date.now() >= Date.parse(item.startAt) && Date.now() < Date.parse(item.endAt) && item.printStatus === 'NOT_STARTED'; return <div key={item.id} className="rounded-md border border-[#e7eee8] p-2 text-[10px] dark:border-[#45604d]"><div className="flex justify-between gap-2"><b>{time(item.startAt)}–{time(item.endAt)}</b><span className={muted}>{own ? item.title || '예약' : '예약됨'}</span></div>{own && <div className="mt-2 flex flex-wrap gap-1">{armable && <button className={softButton} disabled={busy} onClick={() => void action(item, item.armedUntil ? 'disarm' : 'arm')}>{item.armedUntil ? '연결 대기 해제' : '다음 출력 연결'}</button>}{item.printStatus === 'NOT_STARTED' && <button className={softButton} disabled={busy} onClick={() => void action(item, 'cancel')}>예약 취소</button>}</div>}</div>; }) : <p className={`py-3 text-[10px] ${muted}`}>선택한 날짜에 예약이 없습니다.</p>}</div>
    <div className="mt-4 border-t border-[#e7eee8] pt-4 dark:border-[#45604d]"><label className={`text-[10px] font-semibold ${muted}`}>예약 이름<input className={field} value={title} onChange={event => setTitle(event.target.value)} placeholder="예: 시제품 케이스" maxLength={255}/></label><div className="mt-3 grid grid-cols-2 gap-2"><label className={`text-[10px] font-semibold ${muted}`}>시작 시간<select className={field} value={start} onChange={event => setStart(event.target.value)}>{slots.map(slot => <option key={slot}>{slot}</option>)}</select></label><label className={`text-[10px] font-semibold ${muted}`}>종료 시간<select className={field} value={end} onChange={event => setEnd(event.target.value)}>{slots.map(slot => <option key={slot}>{slot}</option>)}</select></label></div><button className={`${primaryButton} mt-3 w-full`} disabled={busy} onClick={() => void create()}><Plus size={16}/>{busy ? '처리 중...' : '예약하기'}</button><p className={`mt-2 text-center text-[10px] ${muted}`}>{user ? `${user.displayName} 계정으로 예약합니다.` : '예약하려면 로그인이 필요합니다.'}</p></div>
    <div className={`mt-3 text-[10px] ${muted}`}>예약 시간은 한국 시간 기준이며 출력 시작 명령을 보내지 않습니다. {selected[0] && `다음 예약: ${dateTime(selected[0].startAt)}`}</div>
  </article>;
}
