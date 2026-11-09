import * as React from 'react';
import {cn} from '../../lib/utils';
import {Button,Tooltip,type ButtonProps} from './primitives';
export interface IconButtonProps extends Omit<ButtonProps,'size'|'children'|'aria-label'>{
 /** Required: an icon button has no visible text, so this is its accessible name (and its tooltip unless `tooltip` says otherwise). */
 'aria-label':string;
 icon:React.ReactNode;
 size?:'xs'|'sm'|'md';
 /** Tooltip text. Defaults to `aria-label`; `false` turns the tooltip off. */
 tooltip?:string|false;
 /** Toggle state, rendered with aria-pressed. */
 pressed?:boolean}
/** Icon-only button with a built-in tooltip. `aria-label` is a required prop. */
export const IconButton=React.forwardRef<HTMLButtonElement,IconButtonProps>(({icon,size='md',tooltip,pressed,variant='ghost',className,type='button',...props},ref)=>{
 const button=<Button ref={ref} type={type} variant={variant} size={size==='xs'?'icon-xs':'icon'} className={cn('nb-icon-button',size==='sm'&&'nb-icon-button-sm',pressed&&'nb-pressed',className)} aria-pressed={pressed} {...props}>{icon}</Button>;
 const text=tooltip===undefined?props['aria-label']:tooltip;
 return text?<Tooltip text={text}>{button}</Tooltip>:button;
});
IconButton.displayName='IconButton';
export interface SegmentedItem{value:string;
 /** Visible text, or with `iconOnly` the accessible name. */
 label:string;icon?:React.ReactNode;
 /** Tooltip; defaults to `label` on icon-only items and to nothing on text items. */
 tooltip?:string;disabled?:boolean}
export interface SegmentedControlProps{items:SegmentedItem[];value:string;onValueChange:(value:string)=>void;
 /** Accessible name of the whole group. */
 label:string;
 /** Show only the icons (the label becomes the aria-label and tooltip). Items without an icon still show their text. */
 iconOnly?:boolean;size?:'xs'|'sm'|'md';className?:string}
/** Single-choice segmented control (radio semantics, roving arrow keys) with icon items and tooltips. */
export function SegmentedControl({items,value,onValueChange,label,iconOnly=false,size='md',className}:SegmentedControlProps){
 const refs=React.useRef<(HTMLButtonElement|null)[]>([]);
 const enabled=items.map((i,n)=>i.disabled?-1:n).filter(n=>n>=0);
 const move=(from:number,dir:1|-1)=>{const at=enabled.indexOf(from);const next=enabled[(at+dir+enabled.length)%enabled.length];if(next===undefined)return;onValueChange(items[next].value);refs.current[next]?.focus()};
 const active=items.findIndex(i=>i.value===value);
 return <div role="radiogroup" aria-label={label} className={cn('nb-segmented','nb-segmented-'+size,className)}>{items.map((item,n)=>{
  const iconic=iconOnly&&!!item.icon;const selected=item.value===value;const tip=item.tooltip??(iconic?item.label:undefined);
  const el=<button key={item.value} ref={e=>{refs.current[n]=e}} type="button" role="radio" aria-checked={selected} aria-label={iconic?item.label:undefined} disabled={item.disabled} tabIndex={selected||(active<0&&n===enabled[0])?0:-1} data-selected={selected||undefined} className={cn('nb-segmented-item',iconic&&'nb-segmented-icon-only')} onClick={()=>onValueChange(item.value)} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();move(n,1)}else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();move(n,-1)}}}>{item.icon&&<span className="nb-segmented-glyph" aria-hidden="true">{item.icon}</span>}{!iconic&&<span>{item.label}</span>}</button>;
  return tip?<Tooltip key={item.value} text={tip}>{el}</Tooltip>:el;
 })}</div>;
}
