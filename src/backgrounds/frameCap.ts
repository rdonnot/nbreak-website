export const LANDING_MAX_FPS=60;
export function runCappedLoop(step:(now:number)=>void){let id=0,last=0,stopped=false;const tick=(now:number)=>{if(stopped)return;if(!document.hidden&&now-last>=1000/LANDING_MAX_FPS-.5){last=now;step(now)}id=requestAnimationFrame(tick)};id=requestAnimationFrame(tick);return()=>{stopped=true;cancelAnimationFrame(id)}}
