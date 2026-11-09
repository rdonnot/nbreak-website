import * as React from 'react';
import {cn} from '../../lib/utils';

/** Where a panel is. The host persists it (localStorage, a layout file, a sync channel); the panel only reports changes. */
export interface PanelPlacement {x:number;y:number;w?:number;collapsed:boolean}

export interface GlassPanelProps {
 /** Stable identity: used for aria and test hooks. */
 id:string;
 title:React.ReactNode;
 icon?:React.ReactNode;
 /** CSS colour for the icon (a host accent). */
 accent?:string;
 /** The element the panel floats in and is clamped to. Must be `position:relative` (or otherwise positioned). */
 boundsRef:React.RefObject<HTMLElement>;
 /** Controlled placement. */
 placement:PanelPlacement;
 onPlacementChange:(next:PanelPlacement)=>void;
 /** Called on any pointer-down inside the panel, so the host can raise it above its siblings. */
 onRaise?:()=>void;
 zIndex?:number;
 /** Default 264. */
 width?:number;
 /** Default 200. */
 minWidth?:number;
 resizable?:boolean;
 onClose?:()=>void;
 /** Extra controls in the title bar, before the collapse button. */
 headerExtra?:React.ReactNode;
 /** Title bar height in px (default 32, token `--nb-panel-bar-h`). */
 titleBarHeight?:number;
 /** Glass opacity 0..1 (default .78, token `--nb-panel-glass`). */
 glass?:number;
 /** Backdrop blur in px (default 12, token `--nb-panel-blur`). */
 blur?:number;
 /** Max body height as any CSS length (default 70vh). */
 bodyMaxHeight?:string;
 /** Replace the body wrapper's class (for content that owns its own scrolling). */
 bodyClassName?:string;
 /** Distance from a container edge at which the panel magnetises (default 14). */
 snap?:number;
 /** Gap kept to a container edge once snapped (default 8). */
 inset?:number;
 children:React.ReactNode;
}

type Drag={kind:'move'|'size';sx:number;sy:number;ox:number;oy:number;ow:number}|null;

/**
 * The compact floating parameter panel: a slim title bar, a translucent blurred body, drag with edge snapping,
 * collapse to the title bar, optional width resize, clamped to its container. Dragging moves a CSS transform inside
 * requestAnimationFrame and reports the placement ONCE on release, so a panel full of controls does not re-render
 * while it is dragged. Look is tokenised: `--nb-panel-bar-h`, `--nb-panel-glass`, `--nb-panel-blur`,
 * `--nb-panel-radius`, or the matching props.
 */
export function GlassPanel({id,title,icon,accent,boundsRef,placement,onPlacementChange,onRaise,zIndex,width=264,minWidth=200,
 resizable=false,onClose,headerExtra,titleBarHeight,glass,blur,bodyMaxHeight,bodyClassName,snap=14,inset=8,children}:GlassPanelProps){
 const ref=React.useRef<HTMLDivElement>(null);
 const drag=React.useRef<Drag>(null);
 const raf=React.useRef(0);
 const live=React.useRef({x:placement.x,y:placement.y,w:placement.w??width});
 const clamp=React.useCallback((x:number,y:number,w:number)=>{
  const c=boundsRef.current;if(!c)return{x,y};
  const cw=c.clientWidth,ch=c.clientHeight,h=ref.current?.offsetHeight??40;
  if(x<snap+inset)x=inset;
  if(y<snap+inset)y=inset;
  if(cw-(x+w)<snap+inset)x=cw-w-inset;
  if(ch-(y+h)<snap+inset)y=ch-h-inset;
  return{x:Math.max(0,Math.min(x,Math.max(0,cw-w))),y:Math.max(0,Math.min(y,Math.max(0,ch-Math.min(h,ch))))};
 },[boundsRef,snap,inset]);
 const apply=React.useCallback(()=>{
  const el=ref.current;if(!el)return;
  el.style.transform=`translate(${live.current.x}px, ${live.current.y}px)`;
  el.style.width=`${live.current.w}px`;
 },[]);
 /* Re-clamp when the container resizes. A PASSIVE effect on purpose: a layout effect runs before the host's ref to the
    container is attached (children commit first), so the observer would never start and a panel placed with a huge
    x/y ("that edge") would stay off screen. */
 React.useEffect(()=>{
  const c=boundsRef.current;if(!c||typeof ResizeObserver==='undefined')return;
  const ro=new ResizeObserver(()=>{
   const w=placement.w??width,{x,y}=clamp(placement.x,placement.y,w);
   if(x!==placement.x||y!==placement.y)onPlacementChange({...placement,x,y});
  });
  ro.observe(c);return()=>ro.disconnect();
 },[boundsRef,clamp,placement,width,onPlacementChange]);
 React.useLayoutEffect(()=>{live.current={x:placement.x,y:placement.y,w:placement.w??width};apply()},[placement,width,apply]);
 React.useEffect(()=>()=>cancelAnimationFrame(raf.current),[]);

 const start=(kind:'move'|'size')=>(e:React.PointerEvent<HTMLElement>)=>{
  if(kind==='move'&&(e.target as HTMLElement).closest('button'))return;
  e.preventDefault();if(kind==='size')e.stopPropagation();
  onRaise?.();
  e.currentTarget.setPointerCapture(e.pointerId);
  drag.current={kind,sx:e.clientX,sy:e.clientY,ox:placement.x,oy:placement.y,ow:placement.w??width};
 };
 const move=(e:React.PointerEvent<HTMLElement>)=>{
  const d=drag.current;if(!d)return;
  const dx=e.clientX-d.sx,dy=e.clientY-d.sy;
  if(d.kind==='move'){const p=clamp(d.ox+dx,d.oy+dy,live.current.w);live.current.x=p.x;live.current.y=p.y}
  else{const cw=boundsRef.current?.clientWidth??Infinity;live.current.w=Math.max(minWidth,Math.min(d.ow+dx,cw-d.ox-inset))}
  cancelAnimationFrame(raf.current);raf.current=requestAnimationFrame(apply);
 };
 const end=()=>{
  if(!drag.current)return;drag.current=null;cancelAnimationFrame(raf.current);
  onPlacementChange({...placement,x:live.current.x,y:live.current.y,w:live.current.w});
 };
 const style:React.CSSProperties&Record<string,string|number|undefined>={zIndex};
 if(titleBarHeight!==undefined)style['--nb-panel-bar-h']=`${titleBarHeight}px`;
 if(glass!==undefined)style['--nb-panel-glass']=glass;
 if(blur!==undefined)style['--nb-panel-blur']=`${blur}px`;
 if(bodyMaxHeight)style['--nb-panel-body-max']=bodyMaxHeight;
 return <div ref={ref} role="group" aria-label={typeof title==='string'?title:id} data-panel={id} data-nodrag="1"
  className={cn('nb-panel',placement.collapsed&&'nb-panel-collapsed')} style={style}
  onPointerDown={()=>onRaise?.()} onMouseDown={e=>e.stopPropagation()}>
  <div className="nb-panel-bar" onPointerDown={start('move')} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
   {icon&&<span className="nb-panel-icon" style={accent?{color:accent}:undefined}>{icon}</span>}
   <span className="nb-panel-title">{title}</span>
   {headerExtra}
   <button type="button" className="nb-panel-btn" aria-expanded={!placement.collapsed} aria-label={placement.collapsed?'Expand panel':'Collapse to title bar'}
    title={placement.collapsed?'Expand panel':'Collapse to title bar'} onClick={()=>onPlacementChange({...placement,collapsed:!placement.collapsed})}>
    <span className="nb-panel-chevron">▾</span></button>
   {onClose&&<button type="button" className="nb-panel-btn" aria-label="Close panel" title="Close panel" onClick={onClose}>×</button>}
  </div>
  {!placement.collapsed&&<div className={bodyClassName??'nb-panel-body'} data-hotkeys-ignore>{children}</div>}
  {resizable&&!placement.collapsed&&<div className="nb-panel-grip" role="separator" aria-orientation="vertical" aria-label="Resize panel"
   onPointerDown={start('size')} onPointerMove={move} onPointerUp={end}/>}
 </div>
}
