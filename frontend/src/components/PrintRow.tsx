import { Layers3 } from 'lucide-react';
import type { PrintRecord } from '../data/demo';
import { muted } from './ui';

export function PrintRow({ print, personal = false }: { print: PrintRecord; personal?: boolean }) {
  const statusColor = print.status === '완료' ? 'bg-[#e6f6ec] text-[#16845b]' : print.status === '실패' ? 'bg-[#fff0ee] text-[#ba5b55]' : 'bg-[#fff4e4] text-[#ad7736]';
  return <div className="grid min-w-[540px] grid-cols-[minmax(155px,1.8fr)_minmax(100px,1fr)_90px_62px_68px] items-center gap-2 border-b border-[#edf1ed] py-3 text-xs dark:border-[#35463b]">
    <div className="flex min-w-0 items-center gap-2"><span className="grid size-9 shrink-0 place-items-center rounded-md text-white" style={{ background: print.color }}><Layers3 size={16}/></span><span className="min-w-0"><b className="block truncate font-semibold">{print.name}</b><small className={`block truncate text-[10px] ${muted}`}>{personal ? 'PLA Basic · Jade White' : print.date}</small></span></div>
    <span className="truncate">{personal ? print.date : print.user}</span><span className={muted}>{print.duration}</span><span className="font-semibold">{print.grams}<small className={muted}> g</small></span><span className={`justify-self-end rounded px-1.5 py-1 text-[10px] font-semibold ${statusColor}`}>{print.status}</span>
  </div>;
}
