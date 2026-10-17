import type { ButtonHTMLAttributes, ReactNode } from 'react';

export const card = 'rounded-xl border border-[#e4ebe5] bg-white shadow-[0_2px_14px_#203d2710] dark:border-[#35463b] dark:bg-[#25362b]';
export const muted = 'text-[#829188] dark:text-[#a9b9ad]';
export const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-dark';
export const softButton = 'inline-flex items-center justify-center gap-2 rounded-md border border-[#e0e9e2] bg-white px-3 py-2 text-xs font-semibold text-[#63776a] hover:border-brand dark:border-[#45604d] dark:bg-[#304436] dark:text-[#c9d9ce]';

export function IconButton({ children, label, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; label: string }) {
  return <button type="button" aria-label={label} title={label} className="grid size-9 place-items-center rounded-md text-[#75867a] hover:bg-[#eaf5ee] hover:text-brand-dark dark:text-[#c0d1c4] dark:hover:bg-[#354b3c]" {...props}>{children}</button>;
}

export function SectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return <div className="flex items-center justify-between gap-3"><div><div className="text-[10px] font-bold tracking-[.16em] text-brand-dark dark:text-[#78d7a8]">{eyebrow}</div><h2 className="mt-1 text-sm font-semibold">{title}</h2></div>{action}</div>;
}
