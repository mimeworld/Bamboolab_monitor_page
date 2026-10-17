import { ExternalLink, Film, Play } from 'lucide-react';
import { card, IconButton, muted, SectionTitle } from './ui';

export function CameraCard({ notify }: { notify: (message: string) => void }) {
  return <article className={`${card} p-4`}><SectionTitle eyebrow="LIVE VIEW" title="프린터 카메라" action={<IconButton label="전체 화면" onClick={() => notify('카메라는 백엔드 연동 후 사용할 수 있어요.')}><ExternalLink size={16}/></IconButton>}/>
    <div className="relative mt-4 flex aspect-[1.65] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[#18291f] via-[#30483a] to-[#132219] text-white">
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(#d7f4e422_1px,transparent_1px),linear-gradient(90deg,#d7f4e422_1px,transparent_1px)] [background-size:28px_28px]"/>
      <div className="relative grid h-[68%] w-[36%] place-items-center rounded-t-lg border-[10px] border-[#809489] bg-[#14261d] shadow-2xl"><div className="h-1/3 w-1/3 bg-[#d1ceb1] [clip-path:polygon(0_100%,0_40%,30%_40%,30%_0,70%_0,70%_40%,100%_40%,100%_100%)]"/></div>
      <span className="absolute left-3 top-3 rounded bg-black/50 px-2 py-1 text-[10px] font-bold tracking-widest"><span className="mr-1 inline-block size-1.5 rounded-full bg-red-400"/> DEMO</span>
      <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-md border border-white/10 bg-black/55 p-2 backdrop-blur-sm"><Film size={17}/><span className="flex-1"><b className="block text-xs">챔버 라이브 뷰</b><small className="text-[10px] text-[#c3d4c8]">카메라 연결을 기다리는 중</small></span><button aria-label="재생" onClick={() => notify('카메라 연결 정보를 관리자 설정에서 확인해 주세요.')}><Play size={17}/></button></div>
    </div><div className={`mt-3 flex justify-between text-[10px] ${muted}`}><span>● 스트림 대기 중</span><span>미리보기 화면</span></div>
  </article>;
}
