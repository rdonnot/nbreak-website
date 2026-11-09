import * as React from 'react';
import {cn} from '../../lib/utils';
import {buttonVariants,sizeClass,useControlDensity,type ControlSize} from './primitives';
import {Upload} from 'lucide-react';

// ─── Native-element drop-ins ──────────────────────────────────────────────
// Real <select>/<input> elements wearing the library's tokens. Props are the
// element's own (ref, data-*, aria-*, id, name, native onChange, ...), so
// `<select onChange={e=>set(e.target.value)}>` becomes `<NativeSelect ...>` with no other edit.

function setRef<T>(ref:React.ForwardedRef<T>,value:T|null){if(typeof ref==='function')ref(value);else if(ref)(ref as React.MutableRefObject<T|null>).current=value}

export interface NativeSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>,'size'>{
 /** Control height: `xs` 24 px, `sm` 32 px, `md` (default) follows the density. */
 size?:ControlSize;
 /** The native `size` attribute (visible rows of a list box). */
 htmlSize?:number}
/** A styled native `<select>` with a custom chevron. Children are plain `<option>` / `<optgroup>`. */
export const NativeSelect=React.forwardRef<HTMLSelectElement,NativeSelectProps>(({className,size,htmlSize,style,...p},ref)=>{const d=useControlDensity(style);return <select ref={ref} size={htmlSize} {...d} className={cn('nb-input nb-native-select',sizeClass(size),className)} {...p}/>});NativeSelect.displayName='NativeSelect';

type NativeInputProps=Omit<React.InputHTMLAttributes<HTMLInputElement>,'type'|'size'>;
interface LabelProp{/** Optional text next to the control (wraps both in a `<label>`). */label?:React.ReactNode}
function withLabel(control:React.ReactElement,label:React.ReactNode,disabled?:boolean){return label===undefined||label===null?control:<label className="check-label" data-disabled={disabled||undefined}>{control}<span>{label}</span></label>}

export interface CheckInputProps extends NativeInputProps,LabelProp{
 /** Mixed state: sets the DOM `indeterminate` property and `aria-checked="mixed"`. Cleared by the user's next click, like the native one. */
 indeterminate?:boolean}
/** A styled native `<input type="checkbox">`: `checked`/`defaultChecked`, native `onChange(e)`, forms, refs. Use `Checkbox` for the Base UI one with `onCheckedChange`. */
export const CheckInput=React.forwardRef<HTMLInputElement,CheckInputProps>(({className,indeterminate,label,style,disabled,...p},ref)=>{
 const inner=React.useRef<HTMLInputElement|null>(null);const d=useControlDensity(style);
 React.useLayoutEffect(()=>{if(inner.current)inner.current.indeterminate=!!indeterminate});
 return withLabel(<input ref={el=>{inner.current=el;setRef(ref,el)}} type="checkbox" {...d} disabled={disabled} aria-checked={indeterminate?'mixed':undefined} className={cn('nb-check-input',className)} {...p}/>,label,disabled)});CheckInput.displayName='CheckInput';

export interface SwitchInputProps extends NativeInputProps,LabelProp{}
/** A styled native checkbox drawn as a switch (`role="switch"`), native `onChange(e)`. */
export const SwitchInput=React.forwardRef<HTMLInputElement,SwitchInputProps>(({className,label,style,disabled,...p},ref)=>{const d=useControlDensity(style);return withLabel(<input ref={ref} type="checkbox" role="switch" {...d} disabled={disabled} className={cn('nb-check-input nb-switch-input',className)} {...p}/>,label,disabled)});SwitchInput.displayName='SwitchInput';

export interface RadioProps extends NativeInputProps,LabelProp{}
/** A single styled native `<input type="radio">`. Group by sharing `name`; use it with `label`, or beside your own `<label>`. */
export const Radio=React.forwardRef<HTMLInputElement,RadioProps>(({className,label,style,disabled,...p},ref)=>{const d=useControlDensity(style);return withLabel(<input ref={ref} type="radio" {...d} disabled={disabled} className={cn('nb-check-input nb-radio',className)} {...p}/>,label,disabled)});Radio.displayName='Radio';

const num=(v:unknown,fallback:number)=>{const n=typeof v==='number'?v:parseFloat(String(Array.isArray(v)?v[0]:v));return Number.isFinite(n)?n:fallback};
const toPct=(v:number,min:number,max:number)=>max>min?Math.min(100,Math.max(0,(v-min)/(max-min)*100)):0;
export interface RangeInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>,'type'|'size'>{size?:ControlSize}
/** A styled native `<input type="range">`. The filled part is the CSS variable `--nb-range-pct` (0-100 %), kept in step with the value, controlled or not. */
export const RangeInput=React.forwardRef<HTMLInputElement,RangeInputProps>(({className,size,style,value,defaultValue,min,max,onChange,onInput,...p},ref)=>{
 const inner=React.useRef<HTMLInputElement|null>(null);const lo=num(min,0),hi=num(max,100);const d=useControlDensity(style);
 const [own,setOwn]=React.useState(()=>toPct(num(defaultValue,lo+(hi-lo)/2),lo,hi));
 const sync=(el:HTMLInputElement)=>setOwn(toPct(num(el.value,lo),num(el.min===''?undefined:el.min,0),num(el.max===''?undefined:el.max,100)));
 // Uncontrolled: read the real value once mounted (the browser clamps and snaps it) and whenever the bounds change.
 React.useLayoutEffect(()=>{if(inner.current&&value===undefined)sync(inner.current)},[value,lo,hi]);
 const pct=value!==undefined?toPct(num(value,lo),lo,hi):own;
 return <input ref={el=>{inner.current=el;setRef(ref,el)}} type="range" min={min} max={max} value={value} defaultValue={defaultValue}
  onChange={e=>{if(value===undefined)sync(e.currentTarget);onChange?.(e)}} onInput={e=>{if(value===undefined)sync(e.currentTarget);onInput?.(e)}}
  {...d} className={cn('nb-range',sizeClass(size),className)} {...p} style={{...d.style,'--nb-range-pct':pct+'%'} as React.CSSProperties}/>});RangeInput.displayName='RangeInput';

export interface ColorInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>,'type'|'size'>{
 /** Swatch edge: `xs` 20 px, `sm` 28 px, `md` (default) 36 px. */
 size?:ControlSize}
/** A styled native `<input type="color">`: a rounded, bordered swatch without the default chrome. */
export const ColorInput=React.forwardRef<HTMLInputElement,ColorInputProps>(({className,size,...p},ref)=><input ref={ref} type="color" className={cn('nb-swatch-input',size&&size!=='md'&&'nb-swatch-'+size,className)} {...p}/>);ColorInput.displayName='ColorInput';

export interface FileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>,'type'|'size'|'value'|'defaultValue'|'className'|'style'>{
 /** Text of the trigger button. Default `Choose file`. */
 buttonLabel?:React.ReactNode;
 /** Shown while nothing is chosen. Default `No file chosen`. */
 placeholder?:string;
 /** Trigger/row height: `xs` 24 px, `sm` 32 px, `md` (default) follows the density. */
 size?:ControlSize;
 /** Goes on the wrapper; every other prop goes to the real `<input type="file">`. */
 className?:string;style?:React.CSSProperties}
/** A styled native `<input type="file">`: the input stays in the DOM (forms, `required`, `ref.click()`, native `onChange`), a Button-looking trigger and the chosen file name(s) are drawn over it. `className`/`style` style the wrapper, the rest goes to the input. */
export const FileInput=React.forwardRef<HTMLInputElement,FileInputProps>(({className,style,buttonLabel='Choose file',placeholder='No file chosen',size,onChange,disabled,...p},ref)=>{
 const [names,setNames]=React.useState('');const d=useControlDensity(style);
 const text=names||placeholder;
 return <label {...d} className={cn('nb-file-input',names&&'has-file',className)} data-disabled={disabled||undefined}>
  <input ref={ref} type="file" className="nb-file-input-native" disabled={disabled} onChange={e=>{const f=e.currentTarget.files;setNames(!f||!f.length?'':f.length===1?f[0].name:f.length+' files');onChange?.(e)}} {...p}/>
  <span className={cn(buttonVariants({variant:'secondary',size:size==='xs'?'xs':size==='sm'?'sm':'md'}),'nb-file-input-button')}><Upload size={size==='xs'?11:13} aria-hidden="true"/>{buttonLabel}</span>
  <span className="nb-file-input-name" title={names||undefined}>{text}</span></label>});FileInput.displayName='FileInput';
