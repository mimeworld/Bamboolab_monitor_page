import { ChevronDown, Moon, Printer, Settings2, Sun, Wifi } from 'lucide-react';
import { IconButton } from './ui';

type Props = { dark: boolean; logged: boolean; admin: boolean; onTheme: () => void; onLogin: () => void; onSettings: () => void; onHome: () => void };

export function Header({ dark, logged, admin, onTheme, onLogin, onSettings, onHome }: Props) {
  return <header className="border-b border-[#e4ebe5] bg-white dark:border-[#35463b] dark:bg-[#25362b]">
    <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-8">
      <button className="flex items-center gap-2 text-left" onClick={onHome}><span className="grid size-8 place-items-center rounded-md bg-brand text-white"><Printer size={17}/></span><span className="text-sm font-extrabold tracking-tight">BAMBU<span className="font-normal">LAB</span></span><span className="ml-2 hidden border-l border-[#dce6df] pl-3 text-xs font-medium text-[#708177] sm:inline-flex">Printroom <ChevronDown size={14}/></span></button>
      <div className="hidden items-center gap-2 text-xs text-[#708177] md:flex"><span className="size-2 rounded-full bg-brand"/> Studio X2D <span className="text-[#adb9b0]">·</span> 내부 네트워크</div>
      <div className="flex items-center gap-1 sm:gap-2"><span className="mr-2 hidden items-center gap-1 text-xs text-brand-dark sm:inline-flex"><Wifi size={14}/> 화면 미리보기</span><IconButton label={dark ? '라이트 모드' : '다크 모드'} onClick={onTheme}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</IconButton>{admin && <IconButton label="프린터 설정" onClick={onSettings}><Settings2 size={18}/></IconButton>}<button className="flex items-center gap-2 rounded-md border border-[#e4ebe5] px-2 py-1.5 text-xs dark:border-[#45604d]" onClick={onLogin}><span className="grid size-6 place-items-center rounded-full bg-[#ddf3e6] text-brand-dark">{logged ? '민' : '게'}</span>{logged ? '민지 김' : '게스트'}<ChevronDown size={13}/></button></div>
    </div>
  </header>;
}
