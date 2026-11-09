import * as React from 'react';
import {AnimatePresence,motion} from 'motion/react';
import {Command} from 'cmdk';
import {CheckCircle2,X,ChevronRight,ChevronDown,Info,AlertTriangle,XCircle,Loader2} from 'lucide-react';
import {Button,Dialog} from './primitives';
import {cn} from '../../lib/utils';

// ── Toast store ─────────────────────────────────────────────────────────────
// One module store, so `toast()` works from anywhere (stores, effects, non-React code) and a <ToastHost/> renders it.
export type ToastKind='info'|'success'|'warning'|'error'|'running';
export interface ToastAction{label:string;onClick:()=>void}
export interface ToastItem{id:string;kind:ToastKind;title:string;message?:string;
 /** Longer detail behind an expand chevron. Keep `message` the one-line version. */
 description?:string;action?:ToastAction;actions?:ToastAction[];
 /** 0..1: a slim progress bar under the message. Patch it with `toast.update` as work advances. */
 progress?:number;
 /** Auto-dismiss after N ms; 0 = sticky. Defaults per kind (error 8000, warning 7000, info 5000, success 4000, running 0). */
 timeout?:number;createdAt:number}
export type ToastInput=Omit<ToastItem,'id'|'createdAt'|'kind'>&{
 /** Push twice with the same id and the second REPLACES the first in place instead of stacking. */
 id?:string;kind?:ToastKind};
export const TOAST_DEFAULT_TIMEOUT:Record<ToastKind,number>={error:8000,warning:7000,info:5000,success:4000,running:0};
let items:ToastItem[]=[];const listeners=new Set<()=>void>();const timers=new Map<string,ReturnType<typeof setTimeout>>();let counter=0;
const emit=()=>listeners.forEach(l=>l());
const arm=(item:ToastItem)=>{const old=timers.get(item.id);if(old)clearTimeout(old);timers.delete(item.id);if(item.timeout&&item.timeout>0)timers.set(item.id,setTimeout(()=>dismissToast(item.id),item.timeout))};
function pushToast(input:ToastInput):string{const id=input.id||`t_${Date.now()}_${++counter}`;const kind=input.kind??'info';const item:ToastItem={timeout:TOAST_DEFAULT_TIMEOUT[kind],...input,kind,id,createdAt:Date.now()};const at=items.findIndex(i=>i.id===id);items=at<0?[...items,item]:items.map((i,n)=>n===at?{...item,createdAt:i.createdAt}:i);arm(item);emit();return id}
function updateToast(id:string,patch:Partial<Omit<ToastItem,'id'|'createdAt'>>){const at=items.findIndex(i=>i.id===id);if(at<0)return;const next={...items[at],...patch};items=items.map((i,n)=>n===at?next:i);if('timeout' in patch)arm(next);emit()}
function dismissToast(id:string){const t=timers.get(id);if(t)clearTimeout(t);timers.delete(id);if(!items.some(i=>i.id===id))return;items=items.filter(i=>i.id!==id);emit()}
function dismissAllToasts(){timers.forEach(clearTimeout);timers.clear();items=[];emit()}
type Sugar=(message:string,title?:string,opts?:Partial<ToastInput>)=>string;
export interface ToastFn{
 /** Push a toast and get its id. The legacy `(title, description)` form still works. */
 (input:ToastInput|string,description?:string):string;
 /** Patch in place (running -> success, progress). Re-arms the timer when `timeout` is in the patch. */
 update:typeof updateToast;dismiss:typeof dismissToast;dismissAll:typeof dismissAllToasts;
 error:Sugar;success:Sugar;info:Sugar;warning:Sugar}
const sugar=(kind:ToastKind,defaultTitle:string):Sugar=>(message,title=defaultTitle,opts={})=>pushToast({kind,title,message,...opts});
export const toast:ToastFn=Object.assign((input:ToastInput|string,description?:string)=>pushToast(typeof input==='string'?{title:input,message:description,kind:'success'}:input),{update:updateToast,dismiss:dismissToast,dismissAll:dismissAllToasts,error:sugar('error','Error'),success:sugar('success','Done'),info:sugar('info','Info'),warning:sugar('warning','Warning')});
const subscribe=(l:()=>void)=>{listeners.add(l);return()=>{listeners.delete(l)}};
/** The live toast list (for a custom host). */
export function useToasts():ToastItem[]{return React.useSyncExternalStore(subscribe,()=>items,()=>items)}
const icons:Record<ToastKind,React.ReactNode>={info:<Info size={18}/>,success:<CheckCircle2 size={18}/>,warning:<AlertTriangle size={18}/>,error:<XCircle size={18}/>,running:<Loader2 size={18} className="spin"/>};
function ToastCard({item}:{item:ToastItem}){
 const [open,setOpen]=React.useState(false);const all=[...(item.action?[item.action]:[]),...(item.actions??[])];
 return <motion.div layout role={item.kind==='error'?'alert':'status'} className={cn('nb-toast nb-glass','nb-toast-'+item.kind)} data-kind={item.kind} data-toast-id={item.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,x:20}}>
  {icons[item.kind]}
  <div><strong>{item.title}</strong>{item.message&&<p>{item.message}</p>}
   {item.description&&<><button type="button" className="nb-toast-more" aria-expanded={open} onClick={()=>setOpen(o=>!o)}><ChevronDown size={12} style={{transform:open?'rotate(180deg)':undefined}}/>{open?'Less':'Details'}</button>{open&&<p className="nb-toast-description">{item.description}</p>}</>}
   {typeof item.progress==='number'&&<div className="nb-toast-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.max(0,Math.min(1,item.progress))*100)} aria-label={item.title}><i style={{width:`${Math.max(0,Math.min(1,item.progress))*100}%`}}/></div>}
   {all.length>0&&<div className="nb-toast-actions">{all.map((a,n)=><Button key={a.label+n} size="xs" variant={n===0?'primary':'secondary'} onClick={()=>{a.onClick();dismissToast(item.id)}}>{a.label}</Button>)}</div>}
  </div>
  <Button size="icon" variant="ghost" aria-label="Dismiss notification" onClick={()=>dismissToast(item.id)}><X size={15}/></Button>
 </motion.div>;
}
/** Renders the toast store. `max` caps what is visible (the newest stay). */
export function ToastHost({max=5}:{max?:number}){const list=useToasts();const shown=list.slice(-max);return <div className="toast-stack" aria-live="polite"><AnimatePresence>{shown.map(i=><ToastCard key={i.id} item={i}/>)}</AnimatePresence></div>}
export function ToastProvider({children,max}:{children:React.ReactNode;max?:number}){return <>{children}<ToastHost max={max}/></>}
/** Same store as `toast`; kept for the older hook-based call sites. */
export function useToast():ToastFn{return toast}
export function Sheet(props:React.ComponentProps<typeof Dialog>){return <Dialog {...props} sheet/>}
export function CommandPalette({open,onOpenChange,items}:{open:boolean;onOpenChange:(open:boolean)=>void;items:{id:string;label:string;icon?:React.ReactNode;onSelect:()=>void}[]}){return <Dialog open={open} onOpenChange={onOpenChange} title="Command palette" description="Type to search, use arrows to navigate, and Enter to select."><Command className="nb-command" label="Command palette"><Command.Input placeholder="Search commands…"/><Command.List><Command.Empty>No matching commands.</Command.Empty>{items.map(i=><Command.Item key={i.id} value={i.label} onSelect={()=>{i.onSelect();onOpenChange(false)}}>{i.icon}{i.label}<ChevronRight size={14}/></Command.Item>)}</Command.List></Command></Dialog>}
