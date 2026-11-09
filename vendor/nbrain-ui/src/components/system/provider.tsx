import * as React from 'react';
import {MotionConfig} from 'motion/react';
import {TooltipProvider} from '../ui/primitives';
export interface NBrainProviderProps {children:React.ReactNode;theme?:'dark'|'light';density?:'comfortable'|'compact';glow?:number;motion?:boolean;
 /** Host app mode: set tokens and providers but render NO wrapper element, so the app keeps its own typography and layout. */
 bare?:boolean}
/** One provider per application. Theme flags also cover headless portals. */
export function NBrainProvider({children,theme='dark',density='comfortable',glow=.85,motion=true,bare=false}:NBrainProviderProps){
 React.useEffect(()=>{const root=document.documentElement;const names=['data-nbrain-ui','data-nbrain-theme','data-nbrain-density','data-nbrain-motion'];const previous=names.map(n=>root.getAttribute(n));const oldGlow=root.style.getPropertyValue('--nb-glow-strength');root.setAttribute('data-nbrain-ui','');root.setAttribute('data-nbrain-theme',theme);root.setAttribute('data-nbrain-density',density);root.setAttribute('data-nbrain-motion',motion?'on':'off');root.style.setProperty('--nb-glow-strength',String(Math.max(0,Math.min(1,glow))));return()=>{names.forEach((n,i)=>previous[i]===null?root.removeAttribute(n):root.setAttribute(n,previous[i]!));oldGlow?root.style.setProperty('--nb-glow-strength',oldGlow):root.style.removeProperty('--nb-glow-strength')}},[theme,density,glow,motion]);
 return <MotionConfig reducedMotion={motion?'user':'always'}><TooltipProvider>{bare?children:<div className="nb-root">{children}</div>}</TooltipProvider></MotionConfig>;
}
