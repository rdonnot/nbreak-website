import * as React from 'react';
import {Film,Check,Plus,Play,Pause,FileText,GitBranch,ArrowUpRight,Volume2} from 'lucide-react';
import {Button,Input,Textarea,Switch,Slider,Badge,Progress,FileUpload} from '../components/nbrain';
import {ParameterRow,NumericScrub} from '../components/system/controls';
import {AgentCore} from '../components/nbrain/production';
import {getWidgetDefinition,type WidgetId} from './catalog';
import * as W from './views';
export interface WidgetValue {scalar:number;text:string;enabled:boolean;color:string;point:{x:number;y:number};transform:{x:number;y:number;z:number};playing:boolean;selectedId?:string}
export const defaultWidgetValue:WidgetValue={scalar:62,text:'',enabled:true,color:'#4167e9',point:{x:0,y:0},transform:{x:0,y:0,z:0},playing:false};
export interface WidgetViewProps {widgetId:WidgetId;value:WidgetValue;onValueChange:(value:WidgetValue)=>void;items?:readonly W.WidgetItem[];messages?:readonly W.WidgetMessage[];samples?:readonly number[];onAction?:(action:string,id?:string)=>void;children?:React.ReactNode;description?:string}
/** Controlled presentation layer. The host retains data, execution and specialized engines. */
export function WidgetView({widgetId:id,value:v,onValueChange,items=[],messages=[],samples=[],onAction,children,description}:WidgetViewProps){const d=getWidgetDefinition(id);const set=<K extends keyof WidgetValue>(key:K,value:WidgetValue[K])=>onValueChange({...v,[key]:value});const scalar={value:v.scalar,onValueChange:(n:number)=>set('scalar',n)};
 switch(id){
 case 'button':return <W.ButtonWidget label={v.text||d.label} onExecute={()=>onAction?.('execute')}/>;
 case 'toggle':return <W.ToggleWidget value={v.enabled} onValueChange={b=>set('enabled',b)}/>;
 case 'slider':return <W.SliderWidget {...scalar}/>;
 case 'fader':return <W.FaderWidget {...scalar}/>;
 case 'number':return <W.NumericWidget {...scalar} label="Value"/>;
 case 'label':return <div className="nb-control-instrument"><span className="nb-instrument-value nb-label-display">{v.text||'—'}</span><span className="nb-instrument-caption">{description}</span></div>;
 case 'bezier':return <W.CurveWidget {...scalar}/>;
 case 'joystick':return <W.JoystickWidget value={v.point} onValueChange={p=>set('point',p)}/>;
 case 'textinput':case 'multiline':return <W.TextWidget value={v.text} onValueChange={s=>set('text',s)} multiline={id==='multiline'} label={d.label}/>;
 case 'colorpicker':case 'colorpalette':case 'gel':return <W.ColorWidget value={v.color} onValueChange={c=>set('color',c)} palette={items.map(i=>i.color!).filter(Boolean)}/>;
 case 'filepicker':return <FileUpload label="Choose a local file" onFile={f=>{set('text',f.name);onAction?.('files-selected')}}/>;
 case 'modulator':return <div className="nb-widget-stack"><W.ScopeWidget samples={samples} label="LFO / Sine"/><W.SliderWidget {...scalar} label="Frequency"/></div>;
 case 'transform':return <W.TransformWidget value={v.transform} onValueChange={t=>set('transform',t)}/>;
 case 'scope':case 'graph':case 'audioanalysis':return <W.ScopeWidget samples={samples} label={id==='audioanalysis'?'Spectral envelope':d.label}/>;
 case 'vumeter':return <W.MeterWidget {...scalar}/>;
 }
 switch(d.presentation){
 case 'parameter':return <div className="nb-widget-stack"><ParameterRow label={id==='camera_switcher'?'Active camera':'Exposure'} hint={id==='colorgrade'?'Scene referred':'Local override'} changed={v.scalar!==50} onReset={()=>set('scalar',50)}><NumericScrub label="Value" {...scalar} step={.1}/></ParameterRow><Slider label={id==='colorgrade'?'Contrast':'Intensity'} {...scalar}/><Switch label={id==='camera_switcher'?'Follow preview':'Auto update'} checked={v.enabled} onCheckedChange={b=>set('enabled',b)}/>{items.map(x=><Button key={x.id} variant={v.selectedId===x.id?'primary':'secondary'} aria-pressed={v.selectedId===x.id} onClick={()=>set('selectedId',x.id)}>{x.label}</Button>)}</div>;
 case 'tree':return <div className="nb-widget-stack"><Input aria-label={'Search '+d.label} placeholder="Filter…" value={v.text} onChange={e=>set('text',e.target.value)}/><W.TreeWidget items={items.filter(i=>!v.text||i.label.toLowerCase().includes(v.text.toLowerCase())||i.children?.some(c=>c.label.toLowerCase().includes(v.text.toLowerCase())))} selectedId={v.selectedId} onSelect={s=>set('selectedId',s)}/></div>;
 case 'table':return <div className="nb-widget-table-wrap"><table className="nb-widget-table"><thead><tr><th>Name</th><th>Details</th><th>Status</th></tr></thead><tbody>{items.map(x=><tr key={x.id} onClick={()=>set('selectedId',x.id)} aria-selected={v.selectedId===x.id}><td><button onClick={()=>set('selectedId',x.id)}>{x.label}</button></td><td>{x.detail}</td><td><Badge tone={x.status==='blocked'?'warning':x.status==='ready'?'success':'neutral'}>{x.status||'draft'}</Badge></td></tr>)}</tbody></table></div>;
 case 'queue':return <W.QueueWidget items={items} onAction={onAction}/>;
 case 'chat':return <W.ChatWidget messages={messages} onSend={text=>onAction?.('send-message',text)}/>;
 case 'editor':return <div className="nb-widget-editor"><div className="nb-editor-toolbar"><Badge>LOCAL DRAFT</Badge><Button size="sm" variant="ghost" onClick={()=>onAction?.('save')}>Save draft</Button></div><Textarea aria-label={d.label} value={v.text} onChange={e=>set('text',e.target.value)}/>{description&&<p>{description}</p>}</div>;
 case 'board':return <W.AssetGridWidget items={items} selectedId={v.selectedId} onSelect={s=>set('selectedId',s)}/>;
 case 'graph':return <div className="nb-node-graph"><svg viewBox="0 0 500 140" aria-hidden="true"><path d="M100 70H400"/></svg>{items.map((x,i)=><button key={x.id} onClick={()=>{set('selectedId',x.id);onAction?.('inspect',x.id)}} className={v.selectedId===x.id?'selected':''}><GitBranch size={18}/><strong>{x.label}</strong><span>{x.detail}</span><i>{String(i+1).padStart(2,'0')}</i></button>)}</div>;
 case 'engine':return <W.EngineViewport label={d.label} toolbar={<><Badge>LOCAL</Badge><span className="nb-viewport-label">{d.label}</span><Button variant="ghost" size="sm" onClick={()=>onAction?.('fit')}>Fit</Button></>} footer={<><Button variant="ghost" size="icon" aria-label={v.playing?'Pause':'Play'} onClick={()=>set('playing',!v.playing)}>{v.playing?<Pause size={14}/>:<Play size={14}/>}</Button><span>00:00:{String(Math.round(v.scalar)).padStart(2,'0')}</span><input type="range" aria-label="Position" value={v.scalar} onChange={e=>set('scalar',+e.target.value)}/><Volume2 size={13}/></>}>{children}</W.EngineViewport>;
 case 'schedule':return <div className="nb-schedule"><div className="nb-schedule-ruler"><span>08:00</span><span>10:00</span><span>12:00</span><span>14:00</span></div>{items.map((x,i)=><div className="nb-schedule-row" key={x.id}><span>{x.label}</span><button style={{marginLeft:`${i*7}%`,width:`${35+i*4}%`}} onClick={()=>onAction?.('inspect',x.id)}>{x.detail}</button></div>)}</div>;
 case 'report':return <div className="nb-report-widget"><div className="nb-report-metrics">{items.slice(0,3).map(x=><div key={x.id}><span>{x.label}</span><strong>{x.detail}</strong></div>)}</div><W.ScopeWidget samples={samples} label="Project activity"/><Button size="sm" onClick={()=>onAction?.('export')}>Export report</Button></div>;
 case 'agent':return <div className="nb-agent-run"><div className="nb-agent-run-header"><AgentCore size="sm"/><div><strong>{d.label}</strong><span>{description||'Human decisions remain in your control.'}</span></div></div><W.QueueWidget items={items} onAction={onAction}/><div className="nb-agent-decision"><Badge tone="warning">Human approval</Badge><p>Review the proposed next step before execution.</p><Button variant="primary" onClick={()=>onAction?.('approve')}>Approve next stage</Button><Button onClick={()=>onAction?.('revise')}>Request changes</Button></div></div>;
 default:return <div className="nb-widget-stack">{items.map(x=><div key={x.id}>{x.label}</div>)}</div>;
 }
}
