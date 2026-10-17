import { expireReservations } from '../services/reservations.js';
export function startExpiryJob(){const timer=setInterval(()=>void expireReservations().catch(error=>console.error('Reservation expiry failed',error)),60000);timer.unref();return()=>clearInterval(timer);}
