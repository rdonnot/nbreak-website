import * as React from 'react';
import {cn} from '../../lib/utils';

export interface ChoiceCardProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>,'title'> {
 /** Leading icon (a Lucide element, an Avatar, anything). */
 icon?:React.ReactNode;
 title:React.ReactNode;
 description?:React.ReactNode;
 /** Pressed state: the card is a toggle (a choice among several). Omit for a plain action row. */
 selected?:boolean;
 /** Dashed outline: "not a thing yet" (a new item, a parked idea). */
 dashed?:boolean;
 /** Highlight the icon with the accent (the primary action of a list). */
 accent?:boolean;
 /** Trailing content (an arrow, a status, a hint). */
 trailing?:React.ReactNode;
}

/**
 * A full-width selectable row/card: icon, title, description, trailing slot. Used for choices ("what are we making?"),
 * lists of things to open (projects) and "new …" actions. A real button, so keyboard and screen readers work; `selected`
 * makes it a toggle (`aria-pressed`).
 */
export const ChoiceCard=React.forwardRef<HTMLButtonElement,ChoiceCardProps>(({icon,title,description,selected,dashed,accent,trailing,className,...p},ref)=>
 <button ref={ref} type="button" aria-pressed={selected===undefined?undefined:selected}
  className={cn('nb-choice',selected&&'nb-choice-selected',dashed&&'nb-choice-dashed',className)} {...p}>
  {icon!==undefined&&<span className={cn('nb-choice-icon',accent&&'nb-choice-icon-accent')} aria-hidden="true">{icon}</span>}
  <span className="nb-choice-body"><span className="nb-choice-title">{title}</span>{description&&<span className="nb-choice-desc">{description}</span>}</span>
  {trailing!==undefined&&<span className="nb-choice-trailing">{trailing}</span>}
 </button>);
ChoiceCard.displayName='ChoiceCard';
