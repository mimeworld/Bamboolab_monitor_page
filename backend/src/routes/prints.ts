import { Router } from 'express';
import { rows } from '../repositories/db.js';
import { fail } from '../middleware/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { type PrintRow, usage, visiblePrint } from '../services/prints.js';
const router=Router();
export function range(query:any){const from=query.from?new Date(String(query.from)):new Date(Date.now()-30*86400000),to=query.to?new Date(String(query.to)):new Date();if(!Number.isFinite(from.valueOf())||!Number.isFinite(to.valueOf())||to<=from||to.valueOf()-from.valueOf()>366*86400000) fail(400,'BAD_RANGE','조회 기간이 올바르지 않습니다.');return {from,to};}
router.get('/prints',async(req,res)=>{const {from,to}=range(req.query),page=Math.max(1,Math.min(1000,Number(req.query.page)||1)),limit=20;const items=await rows<PrintRow>('SELECT * FROM print_records WHERE started_at>=? AND started_at<? ORDER BY started_at DESC LIMIT ? OFFSET ?',[from,to,limit,(page-1)*limit]);res.json({items:items.map(r=>visiblePrint(r,req.principal)),page});});
router.get('/prints/:id',requireAuth,async(req,res)=>{const row=(await rows<PrintRow>('SELECT * FROM print_records WHERE id=? AND started_at IS NOT NULL',[req.params.id]))[0];if(!row||req.principal!.role!=='ADMIN'&&String(row.user_id)!==req.principal!.id) fail(404,'NOT_FOUND','출력 기록을 찾을 수 없습니다.');res.json(visiblePrint(row,req.principal,true));});
router.get('/users/me/prints',requireAuth,async(req,res)=>{const {from,to}=range(req.query);const items=await rows<PrintRow>('SELECT * FROM print_records WHERE user_id=? AND started_at>=? AND started_at<? ORDER BY started_at DESC LIMIT 100',[req.principal!.id,from,to]);res.json({items:items.map(r=>visiblePrint(r,req.principal))});});
router.get('/users/me/usage',requireAuth,async(req,res)=>{const {from,to}=range(req.query);res.json(await usage(req.principal!.id,from,to));});
export default router;
