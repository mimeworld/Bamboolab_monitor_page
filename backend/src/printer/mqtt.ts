import mqtt, { type MqttClient } from 'mqtt';
import { readFileSync } from 'node:fs';
import { isIP } from 'node:net';
import { checkServerIdentity, type PeerCertificate } from 'node:tls';
import { currentSettings } from '../config/settings.js';
import { updateState, disconnected } from './status.js';
import { ingestJob } from '../services/jobs.js';
let client:MqttClient|undefined;
function numeric(value:unknown):number|null { const n=Number(value);return value===undefined||value===null||!Number.isFinite(n)?null:n; }
function temperatures(value:unknown):number[]|null {if(Array.isArray(value))return value.map(numeric).filter((n):n is number=>n!==null);const n=numeric(value);return n===null?null:[n];}
function stage(value:unknown):string {const raw=String(value).toUpperCase();return ({RUNNING:'PRINTING',PAUSE:'PAUSED',FINISH:'FINISHED'} as Record<string,string>)[raw]||raw;}
// The X2D field names below were observed in a live report message.
export function normalize(payload:any) { const print=payload?.print||payload; if(!print||typeof print!=='object') return {}; const progress=print.progress??print.mc_percent??print.percent,rawStage=print.stage??print.gcode_state,remaining=print.remaining_minutes??print.mc_remaining_time,nozzle=print.nozzle_temperatures??print.nozzle_temper,bed=print.bed_temperature??print.bed_temper;return {
  ...(progress!==undefined?{progress:numeric(progress)}:{}),
  ...(rawStage!==undefined?{stage:stage(rawStage)}:{}),
  ...(remaining!==undefined?{remainingMinutes:numeric(remaining)}:{}),
  ...(nozzle!==undefined?{nozzleTemperatures:temperatures(nozzle)}:{}),
  ...(bed!==undefined?{bedTemperature:numeric(bed)}:{}),
  ...(print.error!==undefined?{error:String(print.error)}:{}),
  ...(print.job_id!==undefined?{jobId:String(print.job_id)}:{}),
  ...(print.file_name!==undefined?{fileName:String(print.file_name)}:{})
}; }
export function stopMqtt(){const previous=client;client=undefined;previous?.end(true);disconnected();}
export function startMqtt(){stopMqtt();const settings=currentSettings();if(!settings.host||!settings.mqttPort||!settings.mqttTopic)return;const port=Number(settings.mqttPort);if(!Number.isInteger(port)||port<1||port>65535)return;
  const ca=settings.mqttCaPath?readFileSync(settings.mqttCaPath):undefined;
  const tlsOptions={
    allowPartialTrustChain:!!ca,
    checkServerIdentity:(host:string,cert:PeerCertificate)=>{
      const error=checkServerIdentity(host,cert);
      if(!error)return undefined;
      // Bambu device certificates use the printer serial as CN and omit an IP SAN.
      if((error as NodeJS.ErrnoException).code==='ERR_TLS_CERT_ALTNAME_INVALID'&&isIP(host)===4&&settings.serial&&cert.subject?.CN===settings.serial)return undefined;
      return error;
    }
  };
  const connection=mqtt.connect(`mqtts://${settings.host}:${port}`,{
    username:settings.mqttUsername||undefined,password:settings.accessCode||undefined,ca,
    // Some printers supply the device CA but not its parent CA.
    ...tlsOptions,
    rejectUnauthorized:true,
    reconnectPeriod:3000,connectTimeout:5000
  });
  client=connection;
  connection.on('connect',()=>{if(client!==connection)return;connection.subscribe(settings.mqttTopic,error=>{if(error)console.error('MQTT subscribe error:',error.message);});updateState({connected:true});});
  connection.on('close',()=>{if(client===connection)disconnected();});
  connection.on('error',error=>{if(client!==connection)return;console.error('MQTT connection error:',error.message);disconnected();});
  connection.on('message',(_topic,data)=>{if(client!==connection)return;try{const raw=JSON.parse(data.toString());const patch=normalize(raw);updateState({connected:true,...patch});void ingestJob(raw).catch(error=>console.error('Job ingestion failed',error));}catch(error){console.error('Invalid MQTT message',error);}});
}
