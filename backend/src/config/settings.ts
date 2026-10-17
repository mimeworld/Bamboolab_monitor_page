import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import { env } from './env.js';
export type PrinterSettings=typeof env.printer;
let settings:PrinterSettings={...env.printer};
export function currentSettings(){return {...settings};}
export function safeSettings(){const {accessCode,cameraSourceUrl,...rest}=settings;return {...rest,accessCodeConfigured:!!accessCode,cameraConfigured:!!cameraSourceUrl};}
export async function loadSettings(){try{const blob=JSON.parse(await fs.readFile(env.settingsPath,'utf8'));const decipher=createDecipheriv('aes-256-gcm',env.encryptionKey,Buffer.from(blob.iv,'base64'));decipher.setAuthTag(Buffer.from(blob.tag,'base64'));settings={...settings,...JSON.parse(Buffer.concat([decipher.update(Buffer.from(blob.data,'base64')),decipher.final()]).toString('utf8'))};}catch(error:any){if(error.code!=='ENOENT') throw error;}}
export async function saveSettings(input:Partial<PrinterSettings>){const next={...settings,...input};const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',env.encryptionKey,iv),data=Buffer.concat([cipher.update(JSON.stringify(next)),cipher.final()]);const blob=JSON.stringify({iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:data.toString('base64')});await fs.mkdir(dirname(env.settingsPath),{recursive:true});const temp=`${env.settingsPath}.${process.pid}.tmp`;await fs.writeFile(temp,blob,{mode:0o600});await fs.rename(temp,env.settingsPath);settings=next;}
