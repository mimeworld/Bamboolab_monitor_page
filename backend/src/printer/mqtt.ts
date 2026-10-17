import mqtt, { type MqttClient } from 'mqtt';
import { readFileSync } from 'node:fs';
import { currentSettings } from '../config/settings.js';
import { updateState, disconnected } from './status.js';
import { ingestJob } from '../services/jobs.js';
let client:MqttClient|undefined;
function numeric(value:unknown):number|null { const n=Number(value);return value===undefined||value===null||!Number.isFinite(n)?null:n; }
// Field mapping must be verified against captured X2D messages before live use.
export function normalize(payload:any) { const print=payload?.print||payload; if(!print||typeof print!=='object') return {}; return {
  ...(print.progress!==undefined?{progress:numeric(print.progress)}:{}),
  ...(print.stage!==undefined?{stage:String(print.stage)}:{}),
  ...(print.remaining_minutes!==undefined?{remainingMinutes:numeric(print.remaining_minutes)}:{}),
  ...(print.nozzle_temperatures!==undefined?{nozzleTemperatures:Array.isArray(print.nozzle_temperatures)?print.nozzle_temperatures.map(numeric).filter((n:number|null):n is number=>n!==null):null}:{}),
  ...(print.bed_temperature!==undefined?{bedTemperature:numeric(print.bed_temperature)}:{}),
  ...(print.error!==undefined?{error:String(print.error)}:{}),
  ...(print.job_id!==undefined?{jobId:String(print.job_id)}:{}),
  ...(print.file_name!==undefined?{fileName:String(print.file_name)}:{})
}; }
export function stopMqtt(){client?.end(true);client=undefined;disconnected();}
export function startMqtt(){stopMqtt();const settings=currentSettings();if(!settings.host||!settings.mqttPort||!settings.mqttTopic)return;const port=Number(settings.mqttPort);if(!Number.isInteger(port)||port<1||port>65535)return;
  client=mqtt.connect(`mqtts://${settings.host}:${port}`,{username:settings.mqttUsername||undefined,password:settings.accessCode||undefined,ca:settings.mqttCaPath?readFileSync(settings.mqttCaPath):undefined,rejectUnauthorized:true,reconnectPeriod:0,connectTimeout:5000});
  let delay=1000;const reconnect=()=>{if(!client)return;disconnected();setTimeout(()=>{if(client){client.reconnect();delay=Math.min(delay*2,60000);}},delay).unref();};
  client.on('connect',()=>{delay=1000;client?.subscribe(settings.mqttTopic);updateState({connected:true});});client.on('close',reconnect);client.on('error',()=>disconnected());
  client.on('message',(_topic,data)=>{try{const raw=JSON.parse(data.toString());const patch=normalize(raw);updateState({connected:true,...patch});void ingestJob(raw).catch(error=>console.error('Job ingestion failed',error));}catch(error){console.error('Invalid MQTT message',error);}});
}
