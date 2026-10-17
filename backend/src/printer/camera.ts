import { spawn, type ChildProcess } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { isIP } from 'node:net';
import { currentSettings } from '../config/settings.js';
const directory='/app/hls';
let process:ChildProcess|undefined;
let errorMessage='영상 소스가 설정되지 않았습니다.';
function privateHost(host:string){if(isIP(host)!==4)return false;const [a,b]=host.split('.').map(Number);return a===10||a===172&&b>=16&&b<=31||a===192&&b===168;}
export function validateSource(value:string){let url:URL;try{url=new URL(value);}catch{return false;}return ['rtsp:','rtsps:','http:','https:'].includes(url.protocol)&&privateHost(url.hostname);}
export function cameraStatus(){return {configured:!!currentSettings().cameraSourceUrl,running:!!process?.pid,error:errorMessage};}
export function stopCamera(){process?.kill('SIGTERM');process=undefined;}
export async function startCamera(){stopCamera();await fs.mkdir(directory,{recursive:true});for(const name of await fs.readdir(directory))if(/^(stream\.m3u8|segment\d+\.ts)$/.test(name))await fs.rm(join(directory,name));const source=currentSettings().cameraSourceUrl;if(!source){errorMessage='영상 소스가 설정되지 않았습니다.';return;}if(!validateSource(source)){errorMessage='사설 IPv4 영상 소스만 허용됩니다.';return;}
  errorMessage='영상 연결 중';const args=['-hide_banner','-loglevel','error','-nostdin','-i',source,'-an','-c:v','libx264','-preset','ultrafast','-tune','zerolatency','-f','hls','-hls_time','2','-hls_list_size','5','-hls_flags','delete_segments+omit_endlist','-hls_base_url','segments/','-hls_segment_filename',join(directory,'segment%d.ts'),join(directory,'stream.m3u8')];
  const child=spawn('ffmpeg',args,{stdio:['ignore','ignore','pipe']});process=child;child.stderr?.on('data',()=>{errorMessage='영상 소스를 읽을 수 없습니다.';});child.on('error',()=>{if(process===child){process=undefined;errorMessage='FFmpeg 실행 실패';}});child.on('exit',()=>{if(process===child){process=undefined;errorMessage='영상 연결이 종료되었습니다.';}});
}
export async function cameraFile(name:string){if(!/^(stream\.m3u8|segment\d+\.ts)$/.test(name))return null;try{await fs.access(join(directory,name));return join(directory,name);}catch{return null;}}
