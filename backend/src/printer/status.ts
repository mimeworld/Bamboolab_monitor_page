import { EventEmitter } from 'node:events';
import { env } from '../config/env.js';
export type PrinterState={connected:boolean;lastReceivedAt:string|null;stage:string|null;progress:number|null;remainingMinutes:number|null;nozzleTemperatures:number[]|null;bedTemperature:number|null;error:string|null;jobId:string|null;fileName:string|null};
const emitter=new EventEmitter();
let state:PrinterState={connected:false,lastReceivedAt:null,stage:null,progress:null,remainingMinutes:null,nozzleTemperatures:null,bedTemperature:null,error:null,jobId:null,fileName:null};
export function snapshot(){return {...state,stale:!state.lastReceivedAt||Date.now()-Date.parse(state.lastReceivedAt)>env.staleSeconds*1000};}
export function publicSnapshot(){const {jobId,fileName,...rest}=snapshot();return rest;}
export function updateState(patch:Partial<PrinterState>){state={...state,...patch,lastReceivedAt:new Date().toISOString()};emitter.emit('status');}
export function disconnected(){state={...state,connected:false};emitter.emit('status');}
export function onChange(listener:()=>void){emitter.on('status',listener);return()=>emitter.off('status',listener);}
