/* Compound (part-by-part) Select, DropdownMenu, Popover and Sheet.
   Part names and props follow the shadcn/Base UI wrappers a host app already has (SelectTrigger, SelectContent, DropdownMenuItem
   `variant`/`inset`, SheetContent `side`/`showCloseButton`, ...), so an app adapter is a re-export. The root of each is `XRoot`
   because `Select`, `DropdownMenu`, `Popover` and `Sheet` are the older one-shot components. */
import * as React from 'react';
import {Select as Se} from '@base-ui/react/select';
import {Menu as M} from '@base-ui/react/menu';
import {Popover as P} from '@base-ui/react/popover';
import {Dialog as D} from '@base-ui/react/dialog';
import {Check,ChevronDown,ChevronRight,ChevronUp,X} from 'lucide-react';
import {cn} from '../../lib/utils';
import {useDensityProps} from './density';

type Side=Se.Positioner.Props['side'];
type Align=Se.Positioner.Props['align'];
interface PlaceProps{side?:Side;sideOffset?:number;align?:Align;alignOffset?:number}
const merge=(a:React.CSSProperties|undefined,b:React.CSSProperties|undefined)=>a||b?{...a,...b}:undefined;

// ── Select ──────────────────────────────────────────────────────────────────
export const SelectRoot=Se.Root;
export function SelectGroup({className,...p}:Se.Group.Props){return <Se.Group data-slot="select-group" className={cn('nb-menu-group',className)} {...p}/>}
export function SelectValue({className,...p}:Se.Value.Props){return <Se.Value data-slot="select-value" className={cn('nb-select-value',className)} {...p}/>}
export function SelectTrigger({className,size='default',children,...p}:Se.Trigger.Props&{size?:'sm'|'default'}){return <Se.Trigger data-slot="select-trigger" data-size={size} className={cn('nb-select',size==='sm'&&'nb-select-sm',className)} {...p}>{children}<Se.Icon className="nb-select-icon"><ChevronDown size={14}/></Se.Icon></Se.Trigger>}
export function SelectContent({className,children,side='bottom',sideOffset=4,align='center',alignOffset=0,alignItemWithTrigger=true,style,...p}:Se.Popup.Props&Pick<Se.Positioner.Props,'align'|'alignOffset'|'side'|'sideOffset'|'alignItemWithTrigger'>){
 const d=useDensityProps();
 return <Se.Portal><Se.Positioner positionMethod="fixed" side={side} sideOffset={sideOffset} align={align} alignOffset={alignOffset} alignItemWithTrigger={alignItemWithTrigger} className="popup-positioner">
  <Se.Popup data-slot="select-content" {...d} style={merge(d.style,style as React.CSSProperties)} className={cn('nb-popup nb-select-popup',className)} {...p}><SelectScrollUpButton/><Se.List>{children}</Se.List><SelectScrollDownButton/></Se.Popup>
 </Se.Positioner></Se.Portal>}
export function SelectLabel({className,...p}:Se.GroupLabel.Props){return <Se.GroupLabel data-slot="select-label" className={cn('nb-menu-label',className)} {...p}/>}
export function SelectItem({className,children,...p}:Se.Item.Props){return <Se.Item data-slot="select-item" className={cn('nb-menu-item',className)} {...p}><Se.ItemText className="nb-menu-item-text">{children}</Se.ItemText><Se.ItemIndicator className="nb-menu-indicator"><Check size={14}/></Se.ItemIndicator></Se.Item>}
export function SelectSeparator({className,...p}:Se.Separator.Props){return <Se.Separator data-slot="select-separator" className={cn('nb-menu-separator',className)} {...p}/>}
export function SelectScrollUpButton({className,...p}:Se.ScrollUpArrow.Props){return <Se.ScrollUpArrow data-slot="select-scroll-up-button" className={cn('nb-select-scroll',className)} {...p}><ChevronUp size={14}/></Se.ScrollUpArrow>}
export function SelectScrollDownButton({className,...p}:Se.ScrollDownArrow.Props){return <Se.ScrollDownArrow data-slot="select-scroll-down-button" className={cn('nb-select-scroll',className)} {...p}><ChevronDown size={14}/></Se.ScrollDownArrow>}

// ── DropdownMenu ────────────────────────────────────────────────────────────
export const DropdownMenuRoot=M.Root;
export function DropdownMenuPortal(p:M.Portal.Props){return <M.Portal data-slot="dropdown-menu-portal" {...p}/>}
export function DropdownMenuTrigger(p:M.Trigger.Props){return <M.Trigger data-slot="dropdown-menu-trigger" {...p}/>}
export function DropdownMenuContent({align='start',alignOffset=0,side='bottom',sideOffset=4,className,style,...p}:M.Popup.Props&Pick<M.Positioner.Props,'align'|'alignOffset'|'side'|'sideOffset'>){
 const d=useDensityProps();
 return <M.Portal><M.Positioner positionMethod="fixed" className="popup-positioner" align={align} alignOffset={alignOffset} side={side} sideOffset={sideOffset}><M.Popup data-slot="dropdown-menu-content" {...d} style={merge(d.style,style as React.CSSProperties)} className={cn('nb-popup',className)} {...p}/></M.Positioner></M.Portal>}
export function DropdownMenuGroup(p:M.Group.Props){return <M.Group data-slot="dropdown-menu-group" {...p}/>}
export function DropdownMenuLabel({className,inset,...p}:M.GroupLabel.Props&{inset?:boolean}){return <M.GroupLabel data-slot="dropdown-menu-label" data-inset={inset} className={cn('nb-menu-label',className)} {...p}/>}
export function DropdownMenuItem({className,inset,variant='default',...p}:M.Item.Props&{inset?:boolean;variant?:'default'|'destructive'}){return <M.Item data-slot="dropdown-menu-item" data-inset={inset} data-variant={variant} className={cn('nb-menu-item',variant==='destructive'&&'danger-text',className)} {...p}/>}
export function DropdownMenuSub(p:M.SubmenuRoot.Props){return <M.SubmenuRoot data-slot="dropdown-menu-sub" {...p}/>}
export function DropdownMenuSubTrigger({className,inset,children,...p}:M.SubmenuTrigger.Props&{inset?:boolean}){return <M.SubmenuTrigger data-slot="dropdown-menu-sub-trigger" data-inset={inset} className={cn('nb-menu-item',className)} {...p}>{children}<ChevronRight size={14} className="nb-menu-chevron"/></M.SubmenuTrigger>}
export function DropdownMenuSubContent({align='start',alignOffset=-3,side='right',sideOffset=0,className,style,...p}:M.Popup.Props&Pick<M.Positioner.Props,'align'|'alignOffset'|'side'|'sideOffset'>){return <DropdownMenuContent data-slot="dropdown-menu-sub-content" className={className} style={style} align={align} alignOffset={alignOffset} side={side} sideOffset={sideOffset} {...p}/>}
export function DropdownMenuCheckboxItem({className,children,checked,inset,...p}:M.CheckboxItem.Props&{inset?:boolean}){return <M.CheckboxItem data-slot="dropdown-menu-checkbox-item" data-inset={inset} className={cn('nb-menu-item',className)} checked={checked} {...p}>{children}<M.CheckboxItemIndicator className="nb-menu-indicator"><Check size={14}/></M.CheckboxItemIndicator></M.CheckboxItem>}
export function DropdownMenuRadioGroup(p:M.RadioGroup.Props){return <M.RadioGroup data-slot="dropdown-menu-radio-group" {...p}/>}
export function DropdownMenuRadioItem({className,children,inset,...p}:M.RadioItem.Props&{inset?:boolean}){return <M.RadioItem data-slot="dropdown-menu-radio-item" data-inset={inset} className={cn('nb-menu-item',className)} {...p}>{children}<M.RadioItemIndicator className="nb-menu-indicator"><Check size={14}/></M.RadioItemIndicator></M.RadioItem>}
export function DropdownMenuSeparator({className,...p}:M.Separator.Props){return <M.Separator data-slot="dropdown-menu-separator" className={cn('nb-menu-separator',className)} {...p}/>}
export function DropdownMenuShortcut({className,...p}:React.ComponentProps<'span'>){return <span data-slot="dropdown-menu-shortcut" className={cn('nb-menu-shortcut',className)} {...p}/>}

// ── Popover ─────────────────────────────────────────────────────────────────
export const PopoverRoot=P.Root;
export function PopoverTrigger(p:P.Trigger.Props){return <P.Trigger data-slot="popover-trigger" {...p}/>}
export function PopoverContent({className,align='center',alignOffset=0,side='bottom',sideOffset=4,style,...p}:P.Popup.Props&Pick<P.Positioner.Props,'align'|'alignOffset'|'side'|'sideOffset'>){
 const d=useDensityProps();
 return <P.Portal><P.Positioner positionMethod="fixed" align={align} alignOffset={alignOffset} side={side} sideOffset={sideOffset} className="popup-positioner"><P.Popup data-slot="popover-content" {...d} style={merge(d.style,style as React.CSSProperties)} className={cn('nb-popup popover-content',className)} {...p}/></P.Positioner></P.Portal>}
export function PopoverHeader({className,...p}:React.ComponentProps<'div'>){return <div data-slot="popover-header" className={cn('nb-popover-header',className)} {...p}/>}
export function PopoverTitle({className,...p}:P.Title.Props){return <P.Title data-slot="popover-title" className={cn('nb-popover-title',className)} {...p}/>}
export function PopoverDescription({className,...p}:P.Description.Props){return <P.Description data-slot="popover-description" className={cn('nb-popover-description muted',className)} {...p}/>}

// ── Sheet ───────────────────────────────────────────────────────────────────
export const SheetRoot=D.Root;
export function SheetTrigger(p:D.Trigger.Props){return <D.Trigger data-slot="sheet-trigger" {...p}/>}
export function SheetClose(p:D.Close.Props){return <D.Close data-slot="sheet-close" {...p}/>}
export function SheetPortal(p:D.Portal.Props){return <D.Portal data-slot="sheet-portal" {...p}/>}
export function SheetOverlay({className,...p}:D.Backdrop.Props){return <D.Backdrop data-slot="sheet-overlay" className={cn('nb-backdrop',className)} {...p}/>}
export function SheetContent({className,children,side='right',showCloseButton=true,...p}:D.Popup.Props&{side?:'top'|'right'|'bottom'|'left';showCloseButton?:boolean}){
 return <SheetPortal><SheetOverlay/><D.Popup data-slot="sheet-content" data-side={side} className={cn('nb-dialog nb-glass nb-sheet','nb-sheet-'+side,className)} {...p}>{children}{showCloseButton&&<D.Close data-slot="sheet-close" className="nb-button button-icon button-ghost nb-sheet-close" aria-label="Close"><X size={16}/></D.Close>}</D.Popup></SheetPortal>}
export function SheetHeader({className,...p}:React.ComponentProps<'div'>){return <div data-slot="sheet-header" className={cn('nb-sheet-header',className)} {...p}/>}
export function SheetFooter({className,...p}:React.ComponentProps<'div'>){return <div data-slot="sheet-footer" className={cn('nb-sheet-footer',className)} {...p}/>}
export function SheetTitle({className,...p}:D.Title.Props){return <D.Title data-slot="sheet-title" className={cn('nb-sheet-title',className)} {...p}/>}
export function SheetDescription({className,...p}:D.Description.Props){return <D.Description data-slot="sheet-description" className={cn('nb-sheet-description muted',className)} {...p}/>}
