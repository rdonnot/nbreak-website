import {widgetDefinitions,type WidgetId} from './catalog-data';
export {widgetDefinitions};export type {WidgetId};
export type WidgetPresentation='control'|'parameter'|'tree'|'table'|'queue'|'chat'|'editor'|'graph'|'board'|'engine'|'signal'|'report'|'schedule'|'agent';
const groups:Record<WidgetPresentation,readonly WidgetId[]>={
 control:['button','slider','fader','toggle','number','label','bezier','colorpicker','colorpalette','gel','joystick','modulator','textinput','multiline','filepicker'],
 parameter:['detail','transform','colorgrade','viewportcontrols','camera_switcher'],
 tree:['browser','wiki','list','lore_client'],table:['shotlist','prop_breakdown','compliance','chronometry','production'],
 queue:['renderqueue','actionlog','assimilatelog','version_history','lore_vcs'],chat:['chat','rooms','research'],
 editor:['screenplay','markdown_viewer','charactersheet','locationsheet','elementsheet','visualbible'],
 graph:['pipeline','minipipeline','knowledge_graph','graph'],board:['assetviewer','storyimage','moodwall','corkboard','pitch'],
 engine:['image','three','pascal','supersplat','stage_plan','drawing_canvas','plates','streamdiffusion','timeline','playercontrol','review'],
 signal:['scope','audioanalysis','vumeter'],report:['report','story_report','dashboard'],schedule:['shoot_schedule'],agent:['supervisor','suggestions','gatesheet','h3_composer']
};
export function getWidgetPresentation(id:WidgetId):WidgetPresentation{for(const [kind,ids]of Object.entries(groups))if(ids.includes(id))return kind as WidgetPresentation;throw new Error('Unmapped widget: '+id)}
export const widgetCatalog=widgetDefinitions.map(d=>({...d,presentation:getWidgetPresentation(d.id),implementation:getWidgetPresentation(d.id)==='engine'?'engine-slot' as const:getWidgetPresentation(d.id)==='control'?'control' as const:'composition' as const}));
export function getWidgetDefinition(id:WidgetId){return widgetCatalog.find(d=>d.id===id)!}
