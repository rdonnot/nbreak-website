import * as React from 'react';
import {cn} from '../../lib/utils';
export type Density='comfortable'|'compact';
interface DensityState{density:Density;fontScale:number}
const DensityContext=React.createContext<DensityState|null>(null);
/** Props that carry the surrounding DensityScope into a portal (menus, selects, popovers render outside their trigger's DOM subtree). Empty outside a scope. */
export function useDensityProps():{'data-nbrain-density'?:Density;style?:React.CSSProperties}{const s=React.useContext(DensityContext);if(!s)return {};return {'data-nbrain-density':s.density,style:s.fontScale!==1?({'--nb-font-scale':s.fontScale} as React.CSSProperties):undefined}}
export function useDensity():Density{return React.useContext(DensityContext)?.density??'comfortable'}
export interface DensityScopeProps extends React.HTMLAttributes<HTMLDivElement>{
 /** `compact`: xs-sized controls, 24 px inputs, 11-12 px text. Same as putting `data-nbrain-density="compact"` on any ancestor. */
 density?:Density;
 /** Multiplier on the compact text sizes (the host's per-widget font scale). Sets `--nb-font-scale`. */
 fontScale?:number;
 /** Render no wrapper: only set the context (the attribute is then yours to place). */
 asContext?:boolean}
/** A subtree with its own density. Popups opened from inside it inherit the density through context. */
export function DensityScope({density='compact',fontScale=1,asContext=false,className,style,children,...props}:DensityScopeProps){
 const state=React.useMemo(()=>({density,fontScale}),[density,fontScale]);
 const body=<DensityContext.Provider value={state}>{children}</DensityContext.Provider>;
 if(asContext)return body;
 return <div {...props} data-nbrain-density={density} className={cn('nb-density-scope',className)} style={{...style,...(fontScale!==1?({'--nb-font-scale':fontScale} as React.CSSProperties):null)}}>{body}</div>;
}
