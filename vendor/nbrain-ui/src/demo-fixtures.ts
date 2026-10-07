import {getWidgetDefinition,type WidgetId} from './widgets/catalog';
import {defaultWidgetValue,type WidgetValue} from './widgets/widget-view';
import type {WidgetItem,WidgetMessage} from './widgets/views';
const records:Partial<Record<WidgetId,readonly [string,string][]>>={
 renderqueue:[['Exterior / Dawn','GPU 01 · 128 frames'],['Close-up / Mira','GPU 02 · 64 frames'],['Driving plate / North','Waiting for approval']],
 shotlist:[['SH_010','Wide / Exterior / 35mm'],['SH_020','Medium / Interior / 50mm'],['SH_030','Close-up / Mira / 85mm']],
 compliance:[['Source licenses','3 assets verified'],['Talent consent','Review required'],['Delivery standards','24 fps / UHD']],
 production:[['Storyboard','12 scenes'],['Previs','24 shots'],['Final deliverable','4K / 24 fps']],
 chronometry:[['Scene 01','00:01:28'],['Scene 02','00:02:16'],['Sequence total','00:06:42']],
 prop_breakdown:[['Silver key','Scene 01 / Hero prop'],['Raincoat','Scene 03 / Wardrobe'],['Console','Scene 04 / Set dressing']],
 shoot_schedule:[['Unit A','Exterior / Dawn'],['Unit B','Interior / Studio'],['Volume','Driving plates / LED']],
 pipeline:[['Script','Approved'],['Storyboard','Human gate'],['Deliver','Render / Review']],minipipeline:[['Source','Local'],['Transform','Agent guided'],['Output','Ready']],
 knowledge_graph:[['Mira','Character'],['Harbor','Location'],['Sequence 03','Story connection']],
 dashboard:[['Shots ready','24'],['Active agents','3'],['GPU load','68%']],report:[['Scenes','12'],['Duration','06:42'],['Approved','87%']],story_report:[['Characters','8'],['Locations','5'],['Gates passed','3/4']],
 charactersheet:[['Mira','Protagonist']],locationsheet:[['The Harbor','Blue hour / coastal']],
 visualbible:[['World','Industrial coast'],['Light','Silver / deep blue'],['Camera','Measured / intimate']],
 gatesheet:[['Script gate','Approved by director'],['Visual gate','Awaiting human review']],supervisor:[['Writing agent','Script approved'],['Visual agent','68% · Local GPU'],['Delivery agent','Waiting for cut']],
 suggestions:[['Alternative angle','Preserve scene continuity'],['Shorten intro','Estimated −12 seconds']],
 h3_composer:[['Narrative','Sequence 03'],['Spatial','Harbor stage'],['Temporal','00:03:12']],
 version_history:[['v12 / Approved cut','Today · Director'],['v11 / Color pass','Yesterday · Colorist'],['v10 / First assembly','Yesterday · Hermes']],lore_vcs:[['main','Script / approved'],['visual-pass','3 changes'],['review-notes','2 changes']],
 actionlog:[['Human approval','Director approved stage 2'],['Agent handoff','Hermes → Visuals'],['Render completed','GPU 01 / SH_010']],assimilatelog:[['Job accepted','Local backend / 14:21:03'],['Frame completed','128/128 / 14:21:08'],['Artifact stored','project/output / 14:21:09']],
 moodwall:[['Silver light','Material reference'],['Ink blue','Color reference'],['Harbor','Location'],['Geometry','Shape reference']],corkboard:[['Opening','Mira arrives'],['Discovery','The key'],['Decision','Cross the harbor'],['Resolution','First light']],
 pitch:[['One-line pitch','A story of memory'],['Visual world','Industrial elegance'],['Audience','Independent film']],storyimage:[['Scene 01','Approved frame'],['Scene 02','Composition study'],['Scene 03','Lighting pass']],
 assetviewer:[['Harbor.fbx','3D / Environment'],['Mira.exr','Image / Character'],['Score.wav','Audio / Music'],['Cut.mp4','Video / Review']],
 camera_switcher:[['CAM A','Wide / 35mm'],['CAM B','Medium / 50mm'],['CAM C','Detail / 85mm']],viewportcontrols:[['Perspective','Camera mode'],['Grid','Scene overlay']],
 browser:[['Scenes','3'],['Assets','4'],['Deliverables','2']],wiki:[['World bible','Updated today'],['Characters','8 entries'],['Locations','5 entries']],list:[['Script','Approved'],['Storyboard','In review'],['Deliverables','Draft']],lore_client:[['Project / Harbor','Local repository'],['Changes','3 uncommitted']],research:[['Sources','3 verified references']],
};
export function makeFixture(id:WidgetId){const d=getWidgetDefinition(id);const list=records[id]||[[d.label+' / 01','Local project'],[d.label+' / 02','Shared workspace'],[d.label+' / 03','Ready for review']];let items:WidgetItem[]=list.map(([label,detail],i)=>({id:id+'-'+i,label,detail,status:i===0?'ready':i===1?'running':'queued',progress:i===1?68:100}));
 if(d.presentation==='tree')items=items.map((x,i)=>({...x,children:[{id:x.id+'-child',label:i===0?'Sequence 01':'Reference '+(i+1),detail:'Local'}]}));
 if(['colorpicker','colorpalette','gel'].includes(id))items=['#c1c7d0','#4167e9','#172c63','#2634d9','#8d929c','#e4e7ee'].map((color,i)=>({id:String(i),label:color,color}));
 const text=id==='screenplay'?'EXT. HARBOR — DAWN\n\nSilver light moves across the water. MIRA stops at the edge.\n\nMIRA\nWe start here.':id==='charactersheet'?'MIRA\n\nRole: Protagonist\nMotivation: Recover a lost memory\nArc: Isolation → connection':id==='locationsheet'?'THE HARBOR\n\nCoastal industrial district.\nLight: Blue hour, polished metal reflections.\nAccess: Unit A, morning.':id==='markdown_viewer'?'# Sequence notes\n\n- Preserve the silver lighting language\n- Review the opening camera move\n- Deliver a 24 fps master':id==='elementsheet'?'THE SILVER KEY\n\nHero prop / Scene 03\nMeaning: A connection to the past.':id==='visualbible'?'WORLD / HARBOR\n\nNeutral graphite, silver highlights, and controlled ink blue.\nCamera language: deliberate, precise, intimate.':id==='multiline'?'Review notes\n\nKeep the opening quiet. Confirm the final delivery format.':id==='label'?'LOCAL GPU / 01':id==='textinput'?'Harbor / Sequence 03':id==='button'?'Run cue':'';
 const value:WidgetValue={...defaultWidgetValue,point:{x:.15,y:-.2},transform:{x:1.2,y:0,z:-2.4},text,selectedId:items[0]?.id};
 const messages:WidgetMessage[]=[{id:'m1',role:'human',name:'Director',text:id==='research'?'Find references for the harbor light.':'Prepare the next sequence for review.'},{id:'m2',role:'agent',name:'Hermes',text:id==='research'?'Three references are ready. Review provenance before use.':'The proposed pass is ready. I need your approval before rendering.'}];
 return {value,items,messages,samples:Array.from({length:80},(_,i)=>Math.sin(i*.28)*.45+Math.sin(i*.73)*.2),description:'One workspace · Human-directed production'};
}
