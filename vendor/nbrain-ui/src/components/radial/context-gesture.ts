import * as React from 'react';
export interface ContextGestureOptions {longPressDelay?:number;movementTolerance?:number;longPress?:boolean}
/** Does not capture/prevent touch-down: native scrolling and pinch remain available. */
export function useContextGesture(onOpen:(point:{x:number;y:number})=>void,{longPressDelay=500,movementTolerance=10,longPress=true}:ContextGestureOptions={}){
 const callback=React.useRef(onOpen);callback.current=onOpen;
 const timer=React.useRef<ReturnType<typeof setTimeout>|null>(null),start=React.useRef<{id:number;x:number;y:number}|null>(null),pointers=React.useRef(new Set<number>()),lastTouch=React.useRef(0),firedAt=React.useRef(0);
 const cancel=React.useCallback(()=>{if(timer.current!==null)clearTimeout(timer.current);timer.current=null;start.current=null},[]);
 React.useEffect(()=>{const interrupt=()=>{cancel();pointers.current.clear()};const visibility=()=>{if(document.hidden)cancel()};window.addEventListener('scroll',interrupt,true);window.addEventListener('blur',interrupt);document.addEventListener('visibilitychange',visibility);return()=>{cancel();window.removeEventListener('scroll',interrupt,true);window.removeEventListener('blur',interrupt);document.removeEventListener('visibilitychange',visibility)}},[cancel]);
 const ignored=(target:EventTarget|null)=>target instanceof Element&&!!target.closest('input,textarea,select,[contenteditable="true"],[data-radial-ignore]');
 return {
  onContextMenu:(e:React.MouseEvent<HTMLElement>)=>{if(ignored(e.target))return;e.preventDefault();cancel();if(Date.now()-lastTouch.current<1400)return;callback.current({x:e.clientX,y:e.clientY})},
  onPointerDown:(e:React.PointerEvent<HTMLElement>)=>{if(e.pointerType!=='touch'){lastTouch.current=0;return}lastTouch.current=Date.now();pointers.current.add(e.pointerId);cancel();if(!longPress||pointers.current.size!==1||ignored(e.target))return;start.current={id:e.pointerId,x:e.clientX,y:e.clientY};timer.current=setTimeout(()=>{const point=start.current;if(!point)return;firedAt.current=Date.now();timer.current=null;start.current=null;callback.current({x:point.x,y:point.y})},Math.max(200,longPressDelay))},
  onPointerMove:(e:React.PointerEvent<HTMLElement>)=>{const s=start.current;if(s?.id===e.pointerId&&Math.hypot(e.clientX-s.x,e.clientY-s.y)>movementTolerance)cancel()},
  onPointerUp:(e:React.PointerEvent<HTMLElement>)=>{pointers.current.delete(e.pointerId);cancel()},
  onPointerCancel:(e:React.PointerEvent<HTMLElement>)=>{pointers.current.delete(e.pointerId);cancel()},
  onPointerLeave:()=>cancel(),
  onClickCapture:(e:React.MouseEvent<HTMLElement>)=>{if(Date.now()-firedAt.current<900){e.preventDefault();e.stopPropagation()}},
  onKeyDown:(e:React.KeyboardEvent<HTMLElement>)=>{if(e.target!==e.currentTarget)return;if(e.key==='ContextMenu'||(e.shiftKey&&e.key==='F10')){e.preventDefault();const r=e.currentTarget.getBoundingClientRect();callback.current({x:r.left+r.width/2,y:r.top+r.height/2})}},
 };
}
