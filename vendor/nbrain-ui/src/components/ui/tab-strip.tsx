import * as React from 'react';
import {cn} from '../../lib/utils';

export interface TabStripItem {
 value:string;
 label:string;
 /** Leading icon (a Lucide element). With `iconOnly` it is the whole tab and `label` becomes its accessible name. */
 icon?:React.ReactNode;
 /** A count (string / number: drawn as an accent pill) or any element (drawn as given) after the label. */
 badge?:React.ReactNode;
 /** A status dot in this CSS colour, before the label. */
 dot?:string;
 /** Native tooltip; defaults to `label`. */
 title?:string;
 /** Quieter colours: present, not competing. */
 muted?:boolean;
 disabled?:boolean;
 /** Draw a thin divider before this tab. */
 separatorBefore?:boolean;
 /** Never draw the active underline / pill on this tab (a "home" entry that sits beside the tabs). */
 noIndicator?:boolean;
 /** Makes the tab closable: renders a close button, and Delete / Backspace on the focused tab calls it. */
 onClose?:()=>void;
 /** Extra `data-*` attributes on the tab button, keys without the `data-` prefix. */
 data?:Record<string,string|number|boolean|undefined>;
}

export interface TabStripProps extends Omit<React.HTMLAttributes<HTMLDivElement>,'onChange'|'children'> {
 items:TabStripItem[];
 /** The selected tab, or null / an unknown value for "none". */
 value:string|null;
 onValueChange:(value:string)=>void;
 /** `underline` (a sliding line under the tab) or `pill` (a filled chip). */
 variant?:'underline'|'pill';
 /** Show only the icons (the strip is too narrow for words). */
 iconOnly?:boolean;
 /** Tabs share the width equally and shrink; otherwise they keep their size and the strip scrolls inside itself. */
 fill?:boolean;
 orientation?:'horizontal'|'vertical';
 closeLabel?:(item:TabStripItem)=>string;
}

/**
 * A row (or column) of tabs: underline or pill, with icons, badges, status dots, dividers and optional close buttons.
 * Roles `tablist` / `tab`, roving tabindex, ArrowLeft/Right (Up/Down when vertical), Home and End with automatic
 * activation. A strip that does not fit scrolls inside itself (never the page) and keeps the active tab in view; tabs
 * are at least 40 px tall on touch screens. Colours and type come from tokens: `--nb-tabstrip-fg`, `-fg-muted`,
 * `-accent`, `-font`, `-line`.
 */
export const TabStrip=React.forwardRef<HTMLDivElement,TabStripProps>(({items,value,onValueChange,variant='underline',iconOnly,fill,orientation='horizontal',closeLabel,className,onKeyDown,...p},ref)=>{
 const vertical=orientation==='vertical';
 const list=React.useRef<HTMLDivElement|null>(null);
 const [bar,setBar]=React.useState<{x:number;y:number;w:number;h:number}|null>(null);
 const setRefs=(el:HTMLDivElement|null)=>{list.current=el;if(typeof ref==='function')ref(el);else if(ref)(ref as React.MutableRefObject<HTMLDivElement|null>).current=el};
 const active=items.find(i=>i.value===value&&!i.noIndicator);
 const enabled=items.filter(i=>!i.disabled);
 const focusable=enabled.find(i=>i.value===value)?.value??enabled[0]?.value;

 const measure=React.useCallback(()=>{
  const el=list.current;if(!el||!active){setBar(null);return}
  const t=el.querySelector<HTMLElement>('[role=tab][aria-selected=true]');
  if(!t){setBar(null);return}
  // Relative to the strip, not to offsetParent: each tab sits in a position:relative item, so its
  // offsetLeft is always 0 and the bar never left the first tab.
  const r=t.getBoundingClientRect(),s=el.getBoundingClientRect();
  const n={x:r.left-s.left+el.scrollLeft-el.clientLeft,y:r.top-s.top+el.scrollTop-el.clientTop,w:t.offsetWidth,h:t.offsetHeight};
  setBar(b=>b&&b.x===n.x&&b.y===n.y&&b.w===n.w&&b.h===n.h?b:n);
 },[active]);
 React.useLayoutEffect(()=>{measure()});
 React.useEffect(()=>{
  const el=list.current;if(!el||typeof ResizeObserver==='undefined')return;
  const ro=new ResizeObserver(measure);ro.observe(el);return()=>ro.disconnect();
 },[measure]);
 React.useEffect(()=>{
  const t=list.current?.querySelector<HTMLElement>('[role=tab][aria-selected=true]');
  t?.scrollIntoView?.({block:'nearest',inline:'nearest'});
 },[value]);

 const key=(e:React.KeyboardEvent<HTMLDivElement>)=>{
  onKeyDown?.(e);if(e.defaultPrevented)return;
  const tabs=Array.from(list.current?.querySelectorAll<HTMLButtonElement>('[role=tab]:not(:disabled)')??[]);
  const at=tabs.indexOf(document.activeElement as HTMLButtonElement);
  if(at<0)return;
  const prev=vertical?'ArrowUp':'ArrowLeft',next=vertical?'ArrowDown':'ArrowRight';
  let to=-1;
  if(e.key===next)to=(at+1)%tabs.length;else if(e.key===prev)to=(at-1+tabs.length)%tabs.length;
  else if(e.key==='Home')to=0;else if(e.key==='End')to=tabs.length-1;
  else if(e.key==='Delete'||e.key==='Backspace'){const it=items.find(i=>i.value===tabs[at].dataset.nbValue);if(it?.onClose){e.preventDefault();it.onClose()}return}
  if(to<0)return;
  e.preventDefault();tabs[to].focus();onValueChange(tabs[to].dataset.nbValue!);
 };

 return <div ref={setRefs} role="tablist" aria-orientation={orientation} onKeyDown={key}
  className={cn('nb-tabstrip',`nb-tabstrip-${variant}`,vertical&&'nb-tabstrip-vertical',fill&&'nb-tabstrip-fill',iconOnly&&'nb-tabstrip-icons',className)} {...p}>
  {items.map(i=>{
   const on=i.value===value;
   const data:Record<string,string>={};
   for(const [k,v] of Object.entries(i.data??{}))if(v!==undefined&&v!==false)data['data-'+k]=v===true?'':String(v);
   return <React.Fragment key={i.value}>
    {i.separatorBefore&&<span className="nb-tabstrip-sep" aria-hidden="true"/>}
    <span className={cn('nb-tabstrip-item',i.muted&&'nb-tabstrip-muted',on&&!i.noIndicator&&'nb-tabstrip-on')}>
     <button type="button" role="tab" aria-selected={on} aria-label={i.label} title={i.title??i.label} disabled={i.disabled}
      tabIndex={i.value===focusable?0:-1} data-nb-value={i.value} data-state={on?'active':'inactive'}
      className="nb-tabstrip-tab" onClick={()=>onValueChange(i.value)} {...data}>
      {i.dot&&<span className="nb-tabstrip-dot" aria-hidden="true" style={{background:i.dot}}/>}
      {i.icon&&<span className="nb-tabstrip-icon" aria-hidden="true">{i.icon}</span>}
      {!(iconOnly&&i.icon)&&<span className="nb-tabstrip-label">{i.label}</span>}
      {(typeof i.badge==='string'||typeof i.badge==='number')?<span className="nb-tabstrip-badge">{i.badge}</span>:i.badge}
     </button>
     {i.onClose&&<button type="button" tabIndex={-1} className="nb-tabstrip-close" aria-label={closeLabel?closeLabel(i):`Close ${i.label}`} onClick={i.onClose}>
      <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
     </button>}
    </span>
   </React.Fragment>})}
  {variant==='underline'&&bar&&<span className="nb-tabstrip-bar" aria-hidden="true"
   style={vertical?{top:bar.y,height:bar.h}:{left:bar.x,width:bar.w}}/>}
 </div>});
TabStrip.displayName='TabStrip';
