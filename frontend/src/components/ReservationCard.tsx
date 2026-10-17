import { useState } from 'react';
import { CalendarDays, Check, Plus, ShieldCheck } from 'lucide-react';
import { card, muted, SectionTitle, primaryButton } from './ui';

const week = [{ day: '월', date: 12 }, { day: '화', date: 13 }, { day: '수', date: 14 }, { day: '목', date: 15 }, { day: '금', date: 16 }, { day: '토', date: 17 }, { day: '일', date: 18 }];
const field = 'mt-1 h-9 w-full rounded-md border border-[#dce6df] bg-white px-2 text-xs outline-none focus:border-brand dark:border-[#45604d] dark:bg-[#304436]';

export function ReservationCard({ logged, notify }: { logged: boolean; notify: (message: string) => void }) {
  const [day, setDay] = useState(17);
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('13:00');
  const [end, setEnd] = useState('15:00');
  const reserve = () => notify(!logged ? '예약하려면 먼저 로그인해 주세요.' : !title.trim() ? '예약 이름을 입력해 주세요.' : '현재 화면은 미리보기입니다. 예약은 API 연동 후 사용할 수 있어요.');
  return <article className={`${card} p-4`}><SectionTitle eyebrow="RESERVATION" title="프린터 예약" action={<CalendarDays size={18} className={muted}/>}/>
    <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#eaf7ee] p-3 dark:bg-[#31523d]"><span className="grid size-7 place-items-center rounded bg-white text-brand"><Check size={17}/></span><span className="flex-1"><b className="block text-xs">현재 예약 없음</b><small className={`text-[10px] ${muted}`}>지금은 프린터가 비어 있어요</small></span><span className="text-[10px] font-bold text-brand-dark">예약 가능</span></div>
    <div className="mt-3 grid grid-cols-7 gap-1">{week.map(item => <button key={item.date} onClick={() => setDay(item.date)} className={`flex h-11 flex-col items-center justify-center rounded-md text-xs ${day === item.date ? 'bg-brand text-white' : 'hover:bg-[#eaf7ee]'}`}><small>{item.day}</small><b>{item.date}</b></button>)}</div>
    <div className="mt-3 text-xs font-semibold">10월 {day}일 <span className={muted}>· 미리보기 일정</span></div><div className="mt-2 grid grid-cols-4 border-y border-[#e7eee8] py-3 text-center text-[10px] dark:border-[#35463b]">{['09:00', '12:00', '15:00', '18:00'].map(time => <span key={time}>{time}</span>)}</div><div className="flex gap-2 border-b border-[#e7eee8] py-2 text-[10px] dark:border-[#35463b]"><span className="rounded bg-[#edf0ed] px-2 py-1 text-[#708177]">09:30–11:00 예약됨</span><span className="rounded bg-[#edf0ed] px-2 py-1 text-[#708177]">16:00–17:30 예약됨</span></div>
    <div className="mt-4"><label className={`text-[10px] font-semibold ${muted}`}>예약 이름<input className={field} value={title} onChange={event => setTitle(event.target.value)} placeholder="예: 시제품 케이스"/></label><div className="mt-3 grid grid-cols-2 gap-2">{[['시작 시간', start, setStart, ['11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']], ['종료 시간', end, setEnd, ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00']]].map(([label, value, setter, options]) => <label key={label as string} className={`text-[10px] font-semibold ${muted}`}>{label as string}<select className={field} value={value as string} onChange={event => (setter as (value: string) => void)(event.target.value)}>{(options as string[]).map(time => <option key={time}>{time}</option>)}</select></label>)}</div><button className={`${primaryButton} mt-3 w-full`} onClick={reserve}><Plus size={16}/> 예약하기</button><p className={`mt-2 flex items-center justify-center gap-1 text-[10px] ${muted}`}><ShieldCheck size={13}/> 예약하려면 로그인이 필요해요</p></div>
  </article>;
}
