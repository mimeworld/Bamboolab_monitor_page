import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Film } from 'lucide-react';
import type { User } from '../api/types';
import { card, IconButton, muted, SectionTitle } from './ui';

const stream = '/api/v1/camera/stream.m3u8';
export function CameraCard({ user, onLogin }: { user: User | null; onLogin: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!user || user.mustChangePassword || !video.current) return;
    const element = video.current;
    let disposed = false;
    let hls: import('hls.js').default | undefined;
    if (element.canPlayType('application/vnd.apple.mpegurl')) element.src = stream;
    else void import('hls.js').then(({ default: Hls }) => { if (disposed) return; if (!Hls.isSupported()) { setError('이 브라우저는 HLS 재생을 지원하지 않습니다.'); return; } hls = new Hls({ enableWorker: true, liveSyncDurationCount: 3 }); hls.loadSource(stream); hls.attachMedia(element); hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) setError('카메라 영상을 불러올 수 없습니다.'); }); });
    return () => { disposed = true; hls?.destroy(); element.removeAttribute('src'); element.load(); };
  }, [user]);
  return <article className={`${card} p-4`}><SectionTitle eyebrow="LIVE VIEW" title="프린터 카메라" action={<IconButton label="전체 화면" onClick={() => void video.current?.requestFullscreen()}><ExternalLink size={16}/></IconButton>}/>
    <div className="relative mt-4 flex aspect-[1.65] items-center justify-center overflow-hidden rounded-lg bg-[#e9ecef] text-[#495057] dark:bg-[#343a40] dark:text-[#dee2e6]">
      {user && !user.mustChangePassword ? <video ref={video} controls playsInline className="h-full w-full object-contain" onError={() => setError('카메라 영상을 불러올 수 없습니다.')}/> : <button className="flex flex-col items-center gap-2 text-xs" onClick={onLogin}><Film size={28}/>{user ? '비밀번호 변경 후 카메라를 볼 수 있습니다.' : '로그인 후 카메라를 볼 수 있습니다.'}</button>}
    </div><div className={`mt-3 text-[10px] ${error ? 'text-amber-700' : muted}`}>{error || (user ? '카메라 영상은 장비 설정에 따라 지연될 수 있습니다.' : '인증된 사용자에게만 영상이 제공됩니다.')}</div>
  </article>;
}
