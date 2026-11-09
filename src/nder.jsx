// ─── /n-der/ — the N'Der product page ─────────────────────────────────────────
// Availability, the beta button and the price line all come from src/release.js.
// Controls are N'Brain UI's (Card, Badge, Accordion, Separator, Button), like every N'Brain product.
// Every claim here is something the renderer does today (checked against nder_renderer); keep it that way.
import React from 'react';
import {createRoot} from 'react-dom/client';
import {NBrainProvider} from '../vendor/nbrain-ui/src/components/system/provider';
import {Accordion,Badge,Card} from '../vendor/nbrain-ui/src/components/ui/primitives';
import {LinkButton,Masthead,Footer,Section,Steps,useLanguage,useReducedMotion,usePageMeta,useHeroDrift} from './site';
import {NDER} from './release';
import {ContactForm} from './contact';
import '@fontsource-variable/inter';import '@fontsource-variable/oxanium';import '@fontsource/ibm-plex-mono/400.css';
import '../vendor/nbrain-ui/styles.css';import '../site.css';

const open=NDER.stage==='beta'||NDER.stage==='paid';

function StatusBadge({status,t}){
  return status==='ready'
    ?<Badge tone="success">{t('DISPONIBLE','AVAILABLE')}</Badge>
    :<Badge tone="blue">{t('BIENTÔT','COMING SOON')}</Badge>;
}

function MainAction({t}){
  if(open)return <LinkButton href={NDER.signupUrl} variant="primary">{NDER.stage==='beta'?t('Rejoindre la bêta gratuite','Join the free beta'):t('Créer un compte','Create an account')}</LinkButton>;
  return <LinkButton href="#contact" variant="primary">{t('Demander un accès anticipé','Ask for early access')}</LinkButton>;
}

function Features({items}){
  return <div className="feature-grid">{items.map(([title,body])=><div className="feature" key={title}><h3>{title}</h3><p>{body}</p></div>)}</div>;
}

function Hosts({t}){
  const hosts=[
    {id:'houdini',name:'Houdini',where:t('Solaris · husk','Solaris · husk'),items:[
      t('Moteur de rendu dans le viewport Solaris (Houdini 22.0)','Render delegate in the Solaris viewport (Houdini 22.0)'),
      t('Images finales en ligne de commande avec husk','Final frames from the command line with husk'),
      t('Lit les attributs Houdini : points, courbes, sprites, volumes, instances','Reads Houdini’s attributes: points, curves, sprites, volumes, instances'),
    ]},
    {id:'blender',name:'Blender',where:t('Module de rendu','Render engine add-on'),items:[
      t('Moteur de rendu Blender 5.2 : viewport en direct et F12','Blender 5.2 render engine: live viewport and F12'),
      t('Rendus en ligne de commande avec blender -b','Command-line renders with blender -b'),
      t('Caméras 360 et dôme depuis l’interface','360 and dome cameras from the interface'),
    ]},
    {id:'assimilate',name:'Assimilate',where:'SCRATCH · Live FX',items:[
      t('Édition séparée : un plugin pour SCRATCH et Live FX','A separate edition: a plugin for SCRATCH and Live FX'),
      t('Scènes 3D ray tracées en direct dans la timeline, pour les plateaux LED','Live ray-traced 3D scenes in the timeline, for LED stages'),
      t('Matériaux et profondeur de champ réglés en direct, avec bokeh et anamorphique','Materials and depth of field set live, with bokeh and anamorphic'),
      t('Distorsion d’objectif (k1, k2) pour caler le rendu sur une plaque non corrigée','Lens distortion (k1, k2) to line the render up with a plate that was not undistorted'),
      t('Décalques : une image projetée sur les surfaces à l’intérieur d’une boîte','Decals: an image projected onto the surfaces inside a box'),
    ]},
  ];
  return <Section id="hosts" eyebrow={t('DANS VOS LOGICIELS','INSIDE YOUR TOOLS')} title={t('Un moteur. Trois logiciels.','One renderer. Three hosts.')}>
    <div className="host-grid">{hosts.map(h=><Card glass className="host-card" key={h.id}>
      <StatusBadge status={NDER.hosts[h.id]} t={t}/>
      <h3>{h.name}<span className="product-kicker"> · {h.where}</span></h3>
      <ul>{h.items.map(x=><li key={x}>{x}</li>)}</ul>
    </Card>)}</div>
  </Section>;
}

function VirtualProduction({t}){
  return <Section id="virtual-production" className="nder-vp" eyebrow={t('PRODUCTION VIRTUELLE','VIRTUAL PRODUCTION')} title={t('Prêt pour le plateau.','Ready for the stage.')}
    intro={t('N’Der a été conçu pour la production virtuelle : la qualité du ray tracing, à la cadence d’un mur LED.','N’Der was built for virtual production: ray-traced quality at the frame rate of an LED wall.')}>
    <Features items={[
      [t('Temps réel à cadence fixe','Real time at a steady frame rate'),t('Le mode temps réel tient 25 images/s sur une ville de 2,3 millions d’instances : la caméra bouge, la lumière reste celle du rendu final.','Real-time mode holds 25 fps on a 2.3-million-instance city: the camera moves, the light stays final-frame light.')],
      [t('Rien à précalculer','Nothing to bake'),t('Pas de lightmaps ni de cache de lumière à préparer : ouvrez la scène USD, elle rend. L’éclairage indirect est calculé en direct.','No lightmaps or light caches to prepare: open the USD scene and it renders. Indirect light is computed live.')],
      [t('Modifié en direct','Changed live'),t('Déplacez une lumière, changez un matériau ou l’exposition dans Houdini ou Blender : l’image suit, sans relancer de rendu.','Move a light, change a material or the exposure in Houdini or Blender: the picture follows, with no render to restart.')],
      [t('Murs LED, dômes, VR','LED walls, domes, VR'),t('Caméras 360 latitude-longitude et dome master, pour des plaques et des arrière-plans à 360°.','360 lat-long and dome master cameras, for 360° plates and backgrounds.')],
      [t('Sur le plateau','On set'),t('L’édition Assimilate rend la scène 3D en direct dans SCRATCH et Live FX, là où le plateau est piloté.','The Assimilate edition renders the 3D scene live inside SCRATCH and Live FX, where the stage is run.')],
      [t('De la prévis à l’image finale','From previs to final pixels'),t('La même scène USD et le même moteur dans Houdini ou Blender, au plateau et pour les images finales.','The same USD scene and the same renderer in Houdini or Blender, on the stage and for final frames.')],
      [t('Couleurs gérées par OpenColorIO','Colour managed by OpenColorIO'),t('N’Der rend en lumière linéaire de la scène : l’OpenColorIO de Houdini et de Blender (ACES ou votre propre config) fait l’affichage, et l’édition SCRATCH / Live FX a une sortie Scene Linear pour leur chaîne couleur.','N’Der renders scene-linear light: Houdini’s and Blender’s OpenColorIO (ACES or your own config) does the display, and the SCRATCH / Live FX edition has a Scene Linear output for their colour pipeline.')],
      [t('Normes ouvertes','Open standards'),t('USD pour les scènes, MaterialX pour les matériaux : les fichiers de votre pipeline, sans conversion propriétaire.','USD for scenes, MaterialX for materials: your pipeline’s own files, with no proprietary conversion.')],
      [t('Lieux réels en splats','Real places as splats'),t('Des lieux scannés en Gaussian splats, éclairés par la scène et posés au plateau à côté des décors 3D.','Places scanned as Gaussian splats, lit by the scene and placed on the stage next to the 3D sets.')],
    ]}/>
  </Section>;
}

function RendererFeatures({t}){
  return <Section id="features" eyebrow={t('CE QU’IL REND','WHAT IT RENDERS')} title={<>{t('La lumière d’un rendu final.','Final-frame light.')}<br/><span>{t('À la vitesse de la lecture.','At playback speed.')}</span></>}>
    <Features items={[
      [t('Temps réel','Real time'),t('Un passage par image, DLSS Ray Reconstruction pour débruiter et monter en résolution : moins de 40 ms de GPU par image (25 images/s) sur une ville de 2,3 millions d’instances, en sortie 1080p, sur une seule RTX A5000.','One pass a frame, DLSS Ray Reconstruction to denoise and upscale: under 40 ms of GPU time a frame (25 fps) on a 2.3-million-instance city, 1080p output, on a single RTX A5000.')],
      [t('Images finales','Final frames'),t('Le même moteur en mode multipasse déterministe pour les rendus finaux, vérifié face à Karma sur une série de scènes de test.','The same renderer in deterministic multipass mode for final frames, checked against Karma on a suite of test scenes.')],
      [t('Gaussian splats rééclairés','Relit Gaussian splats'),t('Les splats prennent la lumière de la scène : rééclairage, délighting, spéculaire, ombres portées et reçues, couleurs HDR.','Splats take the scene’s light: relighting, delighting, specular, cast and received shadows, HDR colour.')],
      [t('Volumes et atmosphère','Volumes and atmosphere'),t('VDB, pyro, brouillard et faisceaux, nuages, océan : la lumière diffusée dans le volume.','VDB, pyro, fog and beams, clouds, ocean: light scattered through the volume.')],
      [t('Particules','Particles'),t('Points, courbes lissées, cheveux et sprites de particules avec les attributs de Houdini, opacité et lueur additive.','Points, smoothed curves, hair and particle sprites from Houdini’s attributes, opacity and additive glow.')],
      [t('Matériaux','Materials'),t('MaterialX et matériaux USD : métal, verre, couche, sheen, subsurface, film fin, déplacement.','MaterialX and USD materials: metal, glass, coat, sheen, subsurface, thin film, displacement.')],
      [t('Objectif et mouvement','Lens and motion'),t('Profondeur de champ de la caméra USD (ouverture, mise au point), flou de mouvement des caméras, objets, déformations, instances et volumes.','Depth of field from the USD camera (f-stop, focus distance), motion blur for cameras, objects, deformations, instances and volumes.')],
      [t('Animation','Animation'),t('Maillages déformés et séquences de maillages (caches de points USD) rejoués sur le GPU en temps réel, personnages skinnés UsdSkel avec blend shapes, foules d’agents, instances animées.','Deforming meshes and mesh sequences (USD point caches) played back on the GPU in real time, UsdSkel skinned characters with blend shapes, crowds of agents, animated instances.')],
      [t('USD de bout en bout','USD end to end'),t('Une scène USD de Houdini ou de Blender, rendue telle quelle : instances, lumières et liens de lumière, caméras, matériaux.','A USD scene from Houdini or Blender, rendered as it is: instances, lights and light linking, cameras, materials.')],
    ]}/>
  </Section>;
}

function Beta({t}){
  return <Section id="beta" className="nder-beta" eyebrow={NDER.stage==='paid'?t('TARIF','PRICING'):t('BÊTA','BETA')}
    title={NDER.stage==='paid'&&NDER.price?t(NDER.price.fr,NDER.price.en):t('Gratuit pendant la bêta.','Free during the beta.')}
    intro={NDER.stage==='paid'?t('Les licences de la bêta restent valables jusqu’à leur échéance.','Beta licences stay valid until they expire.'):t('N’Der est distribué uniquement en version compilée. Le tarif sera annoncé avant la fin de la bêta.','N’Der ships as compiled builds only. Pricing will be announced before the beta ends.')}>
    <Steps items={[
      [t('Recevez votre clé','Get your key'),t(`Entrez votre adresse e-mail : vous recevez une clé de licence gratuite, valable sur ${NDER.betaSeats} machines.`,`Enter your email address: you receive a free licence key, valid on ${NDER.betaSeats} machines.`)],
      [t('Installez le gestionnaire N’Der','Install the N’Der manager'),t('Une petite application pour Windows et Linux (macOS bientôt). Elle installe les plugins dans Houdini, Blender ou SCRATCH et les tient à jour.','A small app for Windows and Linux (macOS soon). It installs the plugins into Houdini, Blender or SCRATCH and keeps them up to date.')],
      [t('Une commande, puis rendez','One command, then render'),t('« n-der login <clé> --setup » active la machine, installe les plugins et renouvelle la licence chaque jour. Les plugins la vérifient hors ligne et ne se connectent jamais au réseau.','“n-der login <key> --setup” activates the machine, installs the plugins and renews the licence daily. The plugins check it offline and never connect to the network.')],
    ]}/>
    <div className="nder-actions"><MainAction t={t}/></div>
  </Section>;
}

function Requirements({t}){
  const rows=[
    [t('Carte graphique','Graphics card'),t('Une NVIDIA RTX (ray tracing matériel) par machine, pilote récent','One NVIDIA RTX (hardware ray tracing) per machine, recent driver')],
    ['Windows',t('Windows 10 ou 11, 64 bits','Windows 10 or 11, 64-bit'),NDER.platforms.windows],
    ['Linux',t('64 bits, testé sur Ubuntu 24.04','64-bit, tested on Ubuntu 24.04'),NDER.platforms.linux],
    ['macOS',t('Apple silicon avec ray tracing matériel (M3 ou plus récent)','Apple silicon with hardware ray tracing (M3 or later)'),NDER.platforms.macos],
    ['Houdini',`${NDER.hostVersions.houdini.windows} (Windows), ${NDER.hostVersions.houdini.linux} (Linux) — Solaris, husk`,NDER.hosts.houdini],
    ['Blender',NDER.hostVersions.blender,NDER.hosts.blender],
    ['Assimilate',t(`${NDER.hostVersions.assimilate} et Live FX, Windows`,`${NDER.hostVersions.assimilate} and Live FX, Windows`),NDER.hosts.assimilate],
  ];
  return <Section id="requirements" eyebrow={t('CONFIGURATION','REQUIREMENTS')} title={t('Ce qu’il faut.','What you need.')}>
    <dl className="requirements">{rows.map(([k,v,status])=><div key={k}><dt>{k}</dt><dd>{v}{status&&<StatusBadge status={status} t={t}/>}</dd></div>)}</dl>
  </Section>;
}

function Faq({t}){
  const items=[
    [t('Est-ce vraiment gratuit ?','Is it really free?'),t('Oui, pendant toute la bêta. Le tarif sera annoncé avant la fin de la bêta ; rien ne devient payant sans prévenir.','Yes, for the whole beta. Pricing will be announced before the beta ends; nothing becomes paid without notice.')],
    [t('Faut-il précalculer l’éclairage ?','Do I need to bake lighting?'),t('Non. Rien à préparer : N’Der lance ses rayons à chaque image, et ses sondes d’éclairage indirect se mettent à jour en direct.','No. Nothing to prepare: N’Der traces its rays every frame, and its indirect-light probes update live.')],
    [t('Combien de cartes graphiques ?','How many graphics cards?'),t('Une NVIDIA RTX par machine. Chaque machine rend sa propre image avec sa licence.','One NVIDIA RTX per machine. Each machine renders its own picture with its own licence.')],
    [t('Et OpenColorIO ?','What about OpenColorIO?'),t('N’Der rend une image en lumière linéaire de la scène, et le logiciel hôte gère les couleurs avec OpenColorIO : dans Houdini et Blender, votre config OCIO (ACES ou autre) s’applique à l’affichage, et husk écrit des EXR linéaires. Dans SCRATCH et Live FX, choisissez la sortie Scene Linear pour passer par leur chaîne couleur.','N’Der renders a scene-linear picture and the host manages colour with OpenColorIO: in Houdini and Blender your OCIO config (ACES or another) applies on display, and husk writes linear EXRs. In SCRATCH and Live FX, pick the Scene Linear output to go through their colour pipeline.')],
    [t('Faut-il être connecté pour rendre ?','Do I need to be online to render?'),t('Non. La licence d’une machine dure 14 jours et le gestionnaire la renouvelle chaque jour quand il est en ligne : une machine peut rester hors ligne deux semaines.','No. A machine’s licence lasts 14 days and the manager renews it daily while online, so a machine can stay offline for two weeks.')],
    [t('Et une ferme de rendu ?','What about a render farm?'),t('Les nœuds de rendu ont leur propre licence, pour les rendus en ligne de commande (husk, blender -b).','Render nodes get their own licence, for command-line renders (husk, blender -b).')],
    [t('Que se passe-t-il sans licence ?','What happens without a licence?'),t('Le rendu fonctionne, avec des bandes grises en diagonale sur l’image.','Rendering still works, with diagonal grey bands across the picture.')],
    [t('Le code source est-il disponible ?','Is the source code available?'),t('Non. N’Der est distribué uniquement en version compilée.','No. N’Der ships as compiled builds only.')],
    [t('Quelles données sont collectées ?','What data is collected?'),t('Votre adresse e-mail pour la licence, et pour chaque machine activée une empreinte anonyme (un hachage, pas son identifiant) et son nom. Détails dans la politique de confidentialité.','Your email address for the licence, and for each activated machine an anonymous fingerprint (a hash, not its identifier) and its name. Details in the privacy notice.')],
  ];
  return <Section id="faq" eyebrow={t('QUESTIONS','QUESTIONS')} title={t('Questions fréquentes.','Frequently asked.')}>
    <div className="faq"><Accordion items={items.map(([title,content])=>({title,content}))}/></div>
  </Section>;
}

function Contact({t,language}){
  return <Section id="contact" className="nder-contact" eyebrow={t('CONTACT','CONTACT')} title={t('Une question, un plateau, un projet ?','A question, a stage, a project?')}
    intro={t('Studios, plateaux LED, partenaires : écrivez-nous, nous répondons nous-mêmes.','Studios, LED stages, partners: write to us, we answer ourselves.')}>
    <ContactForm t={t} language={language} topic={NDER.stage==='soon'?'early_access':'question'}/>
  </Section>;
}

function App(){
  const {language,setLanguage,t}=useLanguage();
  const reduced=useReducedMotion();
  usePageMeta(t('N’Der — Ray tracing temps réel pour Houdini, Blender et Assimilate','N’Der — Real-time ray tracing for Houdini, Blender and Assimilate'),t('N’Der, le moteur de rendu de N’Brain : ray tracing GPU temps réel pour Houdini, Blender et Assimilate SCRATCH / Live FX, prêt pour la production virtuelle. Bêta gratuite.','N’Der, N’Brain’s renderer: real-time GPU ray tracing for Houdini, Blender and Assimilate SCRATCH / Live FX, ready for virtual production. Free beta.'));
  useHeroDrift(reduced);
  return <NBrainProvider theme="dark" glow={.5} motion={!reduced}>
    <a className="skip-link" href="#main">{t('Aller au contenu','Skip to content')}</a>
    <Masthead t={t} language={language} setLanguage={setLanguage} current="nder"/>
    <main id="main">
      <section className="hero nder-hero" id="home">
        <img className="nder-hero-image" src="/n-der/city.webp" alt={t('Une ville de nuit, des milliers de fenêtres éclairées, rendue dans N’Der','A city at night with thousands of lit windows, rendered in N’Der')} width="1120" height="544"/>
        <div className="hero-shade"/>
        <div className="hero-content">
          <span className="eyebrow">{t('N’BRAIN · MOTEUR DE RENDU','N’BRAIN · RENDERER')}</span>
          <h1>N’Der<span className="dot">.</span><br/><span>{t('Le ray tracing en temps réel, dans vos outils.','Real-time ray tracing, inside your tools.')}</span></h1>
          <p>{t('Un moteur de rendu ray tracing GPU pour Houdini, Blender et Assimilate SCRATCH / Live FX, prêt pour la production virtuelle. Regardez la lumière finale pendant que vous travaillez, puis rendez vos images avec le même moteur.','A GPU ray-tracing renderer for Houdini, Blender and Assimilate SCRATCH / Live FX, ready for virtual production. See the final light while you work, then render your frames with the same engine.')}</p>
          <div className="nder-actions"><MainAction t={t}/><LinkButton href="#requirements" variant="ghost">{t('Configuration requise','Requirements')}</LinkButton></div>
        </div>
        <div className="hero-bottom">
          <span>{open?t('Bêta gratuite','Free beta'):t('Bêta gratuite bientôt','Free beta coming soon')} · {Object.entries({windows:'Windows',linux:'Linux',macos:'macOS'}).map(([k,n])=>NDER.platforms[k]==='ready'?n:t(`${n} bientôt`,`${n} soon`)).join(' · ')}</span>
          <span>{t('Image rendue dans N’Der','Rendered in N’Der')}</span>
        </div>
      </section>
      <Hosts t={t}/>
      <VirtualProduction t={t}/>
      <RendererFeatures t={t}/>
      <Beta t={t}/>
      <Requirements t={t}/>
      <Faq t={t}/>
      <Contact t={t} language={language}/>
    </main>
    <Footer t={t}/>
  </NBrainProvider>;
}

createRoot(document.getElementById('root')).render(<App/>);
