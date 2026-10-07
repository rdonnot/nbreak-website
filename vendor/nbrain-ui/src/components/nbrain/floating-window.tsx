import * as React from 'react';
import {motion,useDragControls,useMotionValue} from 'motion/react';
import {Minus,X,Grip,Maximize2,Minimize2} from 'lucide-react';
import {Button} from '../ui/primitives';
import {cn} from '../../lib/utils';

export interface FloatingWindowProps {
 id:string;title:string;subtitle?:string;children:React.ReactNode;
 boundsRef:React.RefObject<HTMLDivElement>;initialPosition?:{x:number;y:number};
 width?:number;height?:number;active?:boolean;zIndex?:number;
 onFocus:()=>void;onClose?:()=>void;onMinimize?:()=>void;
}
/** Non-modal production window. The parent owns focus order and lifecycle. */
export function FloatingWindow({id,title,subtitle,children,boundsRef,initialPosition={x:24,y:24},width=340,height=320,active=false,zIndex=1,onFocus,onClose,onMinimize}:FloatingWindowProps){
 const controls=useDragControls(),x=useMotionValue(initialPosition.x),y=useMotionValue(initialPosition.y);
 const [size,setSize]=React.useState({width,height}),[maximized,setMaximized]=React.useState(false);
 const previous=React.useRef({x:initialPosition.x,y:initialPosition.y,...size});
 const clean=React.useRef<(()=>void)|null>(null);
 React.useEffect(()=>()=>clean.current?.(),[]);
 React.useEffect(()=>{const container=boundsRef.current;if(!container)return;const fit=()=>{if(container.clientWidth<760)return;x.set(Math.max(8,Math.min(x.get(),container.clientWidth-size.width-8)));y.set(Math.max(8,Math.min(y.get(),container.clientHeight-size.height-8)))};fit();const observer=new ResizeObserver(fit);observer.observe(container);return()=>observer.disconnect()},[boundsRef,size.width,size.height,x,y]);
 const toggleMaximize=()=>{const bounds=boundsRef.current;if(!bounds)return;if(maximized){x.set(previous.current.x);y.set(previous.current.y);setSize({width:previous.current.width,height:previous.current.height})}else{previous.current={x:x.get(),y:y.get(),...size};x.set(12);y.set(12);setSize({width:Math.max(240,bounds.clientWidth-24),height:Math.max(200,bounds.clientHeight-24)})}setMaximized(!maximized);onFocus()};
 const resize=(event:React.PointerEvent<HTMLButtonElement>)=>{event.preventDefault();event.stopPropagation();onFocus();const sx=event.clientX,sy=event.clientY,sw=size.width,sh=size.height;const bounds=boundsRef.current;const move=(e:PointerEvent)=>setSize({width:Math.max(260,Math.min(sw+e.clientX-sx,(bounds?.clientWidth||1000)-Math.max(x.get(),0)-12)),height:Math.max(220,Math.min(sh+e.clientY-sy,(bounds?.clientHeight||900)-Math.max(y.get(),0)-12))});const end=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',end);clean.current=null};clean.current?.();window.addEventListener('pointermove',move);window.addEventListener('pointerup',end,{once:true});window.addEventListener('pointercancel',end,{once:true});clean.current=end};
 const moveByKey=(event:React.KeyboardEvent<HTMLDivElement>)=>{if(event.target!==event.currentTarget)return;if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();onFocus();const bounds=boundsRef.current;const step=event.shiftKey?24:8;x.set(Math.max(8,Math.min(x.get()+(event.key==='ArrowRight'?step:event.key==='ArrowLeft'?-step:0),(bounds?.clientWidth||1000)-size.width-8)));y.set(Math.max(8,Math.min(y.get()+(event.key==='ArrowDown'?step:event.key==='ArrowUp'?-step:0),(bounds?.clientHeight||900)-size.height-8)))};
 return <motion.section role="dialog" aria-modal="false" aria-labelledby={id+'-title'} className={cn('nb-floating-window nb-floating-frame nb-glass',active&&'window-active')} style={{x,y,width:size.width,height:size.height,zIndex}} drag={!maximized} dragListener={false} dragControls={controls} dragConstraints={boundsRef} dragElastic={0} dragMomentum={false} onPointerDownCapture={onFocus} onFocusCapture={onFocus} initial={{opacity:0,scale:.97}} animate={{opacity:1,scale:1}} transition={{duration:.25}}>
  <div className="window-titlebar" tabIndex={0} aria-label={`Move ${title} window with arrow keys`} onKeyDown={moveByKey} onPointerDown={e=>{if(!maximized&&!window.matchMedia('(max-width:760px)').matches&&!((e.target as HTMLElement).closest('button')))controls.start(e)}} onDoubleClick={e=>{if(!(e.target as HTMLElement).closest('button'))toggleMaximize()}}>
   <span className="window-grip"><Grip size={14}/></span><div className="window-title"><h3 id={id+'-title'}>{title}</h3>{subtitle&&<span>{subtitle}</span>}</div><span className="window-state-light"/>
   <div className="window-actions">{onMinimize&&<Button size="icon" variant="ghost" aria-label={'Minimize '+title} onClick={onMinimize}><Minus size={13}/></Button>}<Button size="icon" variant="ghost" aria-label={(maximized?'Restore ':'Maximize ')+title} onClick={toggleMaximize}>{maximized?<Minimize2 size={12}/>:<Maximize2 size={12}/>}</Button>{onClose&&<Button size="icon" variant="ghost" aria-label={'Close '+title} onClick={onClose}><X size={13}/></Button>}</div>
  </div><div className="window-content">{children}</div><div className="window-statusbar"><span className="mono">NB / {id.toUpperCase()}</span><span>{active?'ACTIVE':'BACKGROUND'}</span></div><button className="window-resize" aria-label={'Resize '+title} onPointerDown={resize} onKeyDown={e=>{if(e.key.startsWith('Arrow')){e.preventDefault();setSize(s=>({width:Math.max(260,s.width+(e.key==='ArrowRight'?16:e.key==='ArrowLeft'?-16:0)),height:Math.max(220,s.height+(e.key==='ArrowDown'?16:e.key==='ArrowUp'?-16:0))}))}}}/>
 </motion.section>
}
export function WindowCanvas({children,canvasRef,className}:{children:React.ReactNode;canvasRef:React.RefObject<HTMLDivElement>;className?:string}){return <div ref={canvasRef} className={cn('nb-window-canvas',className)}>{children}</div>}
