import { Layers3 } from 'lucide-react';
import { dateTime, duration, printGrams, printStatus } from '../api/format';
import type { PrintRecord, User } from '../api/types';
import { muted } from './ui';

export function PrintRow({ print, user, personal = false }: { print: PrintRecord; user: User | null; personal?: boolean }) {
  const statusColor = print.status === 'COMPLETED' ? 'bg-[#e6f6ec] text-[#16845b]' : print.status === 'FAILED' ? 'bg-[#fff0ee] text-[#ba5b55]' : 'bg-[#fff4e4] text-[#ad7736]';
  const owner = print.userId === user?.id ? '나' : print.userId ? `사용자 #${print.userId}` : '미지정';
  return <div className="grid min-w-[540px] grid-cols-[minmax(155px,1.8fr)_minmax(100px,1fr)_90px_90px_68px] items-center gap-2 border-b border-[#edf1ed] py-3 text-xs dark:border-[#35463b]">
    <div className="flex min-w-0 items-center gap-2"><span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#83bba1] text-white"><Layers3 size={16}/></span><span className="min-w-0"><b className="block truncate font-semibold">{print.title}</b><small className={`block truncate text-[10px] ${muted}`}>{print.fileName || dateTime(print.startedAt)}</small></span></div>
    <span className="truncate">{personal ? dateTime(print.startedAt) : print.title === '비공개 출력' ? '비공개' : owner}</span><span className={muted}>{duration(print.startedAt, print.finishedAt)}</span><span className="font-semibold">{printGrams(print)}</span><span className={`justify-self-end rounded px-1.5 py-1 text-[10px] font-semibold ${statusColor}`}>{printStatus(print.status)}</span>
  </div>;
}
