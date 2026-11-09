// ─── /n-der/ — the N'Der product page ─────────────────────────────────────────
// Availability, the beta button and the price line all come from src/release.js.
import React from 'react';
import {createRoot} from 'react-dom/client';
import {NBrainProvider} from '../vendor/nbrain-ui/src/components/system/provider';
import {Card,Badge} from '../vendor/nbrain-ui/src/components/ui/primitives';
import {PROFILE,LinkButton,Masthead,Footer,useLanguage,useReducedMotion,usePageMeta,useHeroDrift} from './site';
import {NDER} from './release';
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
  return <LinkButton href={PROFILE} variant="primary" external>{t('Demander un accès anticipé','Ask for early access')}</LinkButton>;
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
      t('Scènes 3D ray tracées en direct dans la timeline','Live ray-traced 3D scenes in the timeline'),
      t('Pour les plateaux LED et la production virtuelle','For LED stages and virtual production'),
    ]},
  ];
  return <section className="nder-section" id="hosts">
    <div className="nder-heading">
      <span className="eyebrow">{t('DANS VOS LOGICIELS','INSIDE YOUR TOOLS')}</span>
      <h2>{t('Un moteur. Trois logiciels.','One renderer. Three hosts.')}</h2>
    </div>
    <div className="host-grid">{hosts.map(h=><Card glass className="product-card host-card" key={h.id}>
      <StatusBadge status={NDER.hosts[h.id]} t={t}/>
      <h3>{h.name}<span className="product-kicker"> · {h.where}</span></h3>
      <ul>{h.items.map(x=><li key={x}>{x}</li>)}</ul>
    </Card>)}</div>
  </section>;
}

function VirtualProduction({t}){
  const items=[
    [t('Temps réel à cadence fixe','Real time at a steady frame rate'),t('Le mode temps réel tient 25 images/s sur une ville de 2,3 millions d’instances : la caméra bouge, la lumière reste celle du rendu final.','Real-time mode holds 25 fps on a 2.3-million-instance city: the camera moves, the light stays final-frame light.')],
    [t('Murs LED, dômes, VR','LED walls, domes, VR'),t('Caméras 360 latitude-longitude et dome master, pour des plaques et des arrière-plans à 360°.','360 lat-long and dome master cameras, for 360° plates and backgrounds.')],
    [t('Sur le plateau','On set'),t('L’édition Assimilate rend la scène 3D en direct dans SCRATCH et Live FX, là où le plateau est piloté.','The Assimilate edition renders the 3D scene live inside SCRATCH and Live FX, where the stage is run.')],
    [t('De la prévis à l’image finale','From previs to final pixels'),t('La même scène USD et le même moteur dans Houdini ou Blender, au plateau et pour les images finales.','The same USD scene and the same renderer in Houdini or Blender, on the stage and for final frames.')],
  ];
  return <section className="nder-section nder-vp" id="virtual-production">
    <div className="nder-heading">
      <span className="eyebrow">{t('PRODUCTION VIRTUELLE','VIRTUAL PRODUCTION')}</span>
      <h2>{t('Prêt pour le plateau.','Ready for the stage.')}</h2>
      <p>{t('N’Der a été conçu pour la production virtuelle : la qualité du ray tracing, à la cadence d’un mur LED.','N’Der was built for virtual production: ray-traced quality at the frame rate of an LED wall.')}</p>
    </div>
    <div className="feature-grid">{items.map(([title,body])=><div className="feature" key={title}><h3>{title}</h3><p>{body}</p></div>)}</div>
  </section>;
}

function Features({t}){
  const features=[
    [t('Temps réel','Real time'),t('Un passage par image, DLSS Ray Reconstruction pour débruiter et monter en résolution : moins de 40 ms de GPU par image (25 images/s) sur une ville de 2,3 millions d’instances, en sortie 1080p, sur une seule RTX A5000.','One pass a frame, DLSS Ray Reconstruction to denoise and upscale: under 40 ms of GPU time a frame (25 fps) on a 2.3-million-instance city, 1080p output, on a single RTX A5000.')],
    [t('Images finales','Final frames'),t('Le même moteur en mode multipasse déterministe pour les rendus finaux, vérifié face à Karma sur une série de scènes de test.','The same renderer in deterministic multipass mode for final frames, checked against Karma on a suite of test scenes.')],
    [t('Gaussian splats rééclairés','Relit Gaussian splats'),t('Les splats prennent la lumière de la scène : rééclairage, délighting, spéculaire, ombres portées et reçues, couleurs HDR.','Splats take the scene’s light: relighting, delighting, specular, cast and received shadows, HDR colour.')],
    [t('Volumes et atmosphère','Volumes and atmosphere'),t('VDB, pyro, brouillard et faisceaux, nuages, océan : la lumière diffusée dans le volume.','VDB, pyro, fog and beams, clouds, ocean: light scattered through the volume.')],
    [t('Particules','Particles'),t('Points, courbes lissées, cheveux et sprites de particules avec les attributs de Houdini, opacité et lueur additive.','Points, smoothed curves, hair and particle sprites from Houdini’s attributes, opacity and additive glow.')],
    [t('Matériaux','Materials'),t('MaterialX et matériaux USD : métal, verre, couche, sheen, subsurface, film fin, déplacement.','MaterialX and USD materials: metal, glass, coat, sheen, subsurface, thin film, displacement.')],
    [t('Mouvement','Motion'),t('Flou de mouvement des caméras, objets, déformations, instances et volumes.','Motion blur for cameras, objects, deformations, instances and volumes.')],
    [t('USD de bout en bout','USD end to end'),t('Une scène USD de Houdini ou de Blender, rendue telle quelle : instances, lumières et liens de lumière, caméras, matériaux.','A USD scene from Houdini or Blender, rendered as it is: instances, lights and light linking, cameras, materials.')],
  ];
  return <section className="nder-section" id="features">
    <div className="nder-heading">
      <span className="eyebrow">{t('CE QU’IL REND','WHAT IT RENDERS')}</span>
      <h2>{t('La lumière d’un rendu final.','Final-frame light.')}<br/><span>{t('À la vitesse de la lecture.','At playback speed.')}</span></h2>
    </div>
    <div className="feature-grid">{features.map(([title,body])=><div className="feature" key={title}><h3>{title}</h3><p>{body}</p></div>)}</div>
  </section>;
}

function Beta({t}){
  const steps=[
    [t('Recevez votre clé','Get your key'),t(`Entrez votre adresse e-mail : vous recevez une clé de licence gratuite, valable sur ${NDER.betaSeats} machines.`,`Enter your email address: you receive a free licence key, valid on ${NDER.betaSeats} machines.`)],
    [t('Installez le gestionnaire N’Der','Install the N’Der manager'),t('Une petite application pour Windows et Linux (macOS bientôt). Elle installe les plugins dans Houdini, Blender ou SCRATCH et les tient à jour.','A small app for Windows and Linux (macOS soon). It installs the plugins into Houdini, Blender or SCRATCH and keeps them up to date.')],
    [t('Une commande, puis rendez','One command, then render'),t('« nder login <clé> --setup » active la machine, installe les plugins et renouvelle la licence chaque jour. Les plugins la vérifient hors ligne et ne se connectent jamais au réseau.','“nder login <key> --setup” activates the machine, installs the plugins and renews the licence daily. The plugins check it offline and never connect to the network.')],
  ];
  return <section className="nder-section nder-beta" id="beta">
    <div className="nder-heading">
      <span className="eyebrow">{NDER.stage==='paid'?t('TARIF','PRICING'):t('BÊTA','BETA')}</span>
      <h2>{NDER.stage==='paid'&&NDER.price?t(NDER.price.fr,NDER.price.en):t('Gratuit pendant la bêta.','Free during the beta.')}</h2>
      <p>{NDER.stage==='paid'?t('Les licences de la bêta restent valables jusqu’à leur échéance.','Beta licences stay valid until they expire.'):t('N’Der est distribué uniquement en version compilée. Le tarif sera annoncé avant la fin de la bêta.','N’Der ships as compiled builds only. Pricing will be announced before the beta ends.')}</p>
    </div>
    <ol className="steps">{steps.map(([title,body],i)=><li key={title}><span className="step-number">{i+1}</span><div><h3>{title}</h3><p>{body}</p></div></li>)}</ol>
    <div className="nder-actions"><MainAction t={t}/></div>
  </section>;
}

function Requirements({t}){
  const rows=[
    [t('Carte graphique','Graphics card'),t('NVIDIA RTX (ray tracing matériel), pilote récent','NVIDIA RTX (hardware ray tracing), recent driver')],
    ['Windows',t('Windows 10 ou 11, 64 bits','Windows 10 or 11, 64-bit'),NDER.platforms.windows],
    ['Linux',t('64 bits, testé sur Ubuntu 24.04','64-bit, tested on Ubuntu 24.04'),NDER.platforms.linux],
    ['macOS',t('Apple silicon avec ray tracing matériel (M3 ou plus récent)','Apple silicon with hardware ray tracing (M3 or later)'),NDER.platforms.macos],
    ['Houdini',t(`${NDER.hostVersions.houdini.windows} (Windows), ${NDER.hostVersions.houdini.linux} (Linux) — Solaris, husk`,`${NDER.hostVersions.houdini.windows} (Windows), ${NDER.hostVersions.houdini.linux} (Linux) — Solaris, husk`),NDER.hosts.houdini],
    ['Blender',NDER.hostVersions.blender,NDER.hosts.blender],
    ['Assimilate',t(`${NDER.hostVersions.assimilate} et Live FX, Windows`,`${NDER.hostVersions.assimilate} and Live FX, Windows`),NDER.hosts.assimilate],
  ];
  return <section className="nder-section" id="requirements">
    <div className="nder-heading">
      <span className="eyebrow">{t('CONFIGURATION','REQUIREMENTS')}</span>
      <h2>{t('Ce qu’il faut.','What you need.')}</h2>
    </div>
    <dl className="requirements">{rows.map(([k,v,status])=><div key={k}><dt>{k}</dt><dd>{v}{status&&<StatusBadge status={status} t={t}/>}</dd></div>)}</dl>
  </section>;
}

function Faq({t}){
  const items=[
    [t('Est-ce vraiment gratuit ?','Is it really free?'),t('Oui, pendant toute la bêta. Le tarif sera annoncé avant la fin de la bêta ; rien ne devient payant sans prévenir.','Yes, for the whole beta. Pricing will be announced before the beta ends; nothing becomes paid without notice.')],
    [t('Faut-il être connecté pour rendre ?','Do I need to be online to render?'),t('Non. La licence d’une machine dure 14 jours et le gestionnaire la renouvelle chaque jour quand il est en ligne : une machine peut rester hors ligne deux semaines.','No. A machine’s licence lasts 14 days and the manager renews it daily while online, so a machine can stay offline for two weeks.')],
    [t('Et une ferme de rendu ?','What about a render farm?'),t('Les nœuds de rendu ont leur propre licence, pour les rendus en ligne de commande (husk, blender -b).','Render nodes get their own licence, for command-line renders (husk, blender -b).')],
    [t('Que se passe-t-il sans licence ?','What happens without a licence?'),t('Le rendu fonctionne, avec des bandes grises en diagonale sur l’image.','Rendering still works, with diagonal grey bands across the picture.')],
    [t('Le code source est-il disponible ?','Is the source code available?'),t('Non. N’Der est distribué uniquement en version compilée.','No. N’Der ships as compiled builds only.')],
    [t('Quelles données sont collectées ?','What data is collected?'),t('Votre adresse e-mail pour la licence, et pour chaque machine activée une empreinte anonyme (un hachage, pas son identifiant) et son nom. Détails dans la politique de confidentialité.','Your email address for the licence, and for each activated machine an anonymous fingerprint (a hash, not its identifier) and its name. Details in the privacy notice.')],
  ];
  return <section className="nder-section" id="faq">
    <div className="nder-heading">
      <span className="eyebrow">{t('QUESTIONS','QUESTIONS')}</span>
      <h2>{t('Questions fréquentes.','Frequently asked.')}</h2>
    </div>
    <div className="faq">{items.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
  </section>;
}

function App(){
  const {language,setLanguage,t}=useLanguage();
  const reduced=useReducedMotion();
  usePageMeta(t('N’Der — Ray tracing temps réel pour Houdini, Blender et Assimilate','N’Der — Real-time ray tracing for Houdini, Blender and Assimilate'),t('N’Der, le moteur de rendu de N’Brain : ray tracing GPU temps réel pour Houdini, Blender et Assimilate SCRATCH / Live FX, prêt pour la production virtuelle. Bêta gratuite.','N’Der, N’Brain’s renderer: real-time GPU ray tracing for Houdini, Blender and Assimilate SCRATCH / Live FX, ready for virtual production. Free beta.'));
  useHeroDrift(reduced);
  return <NBrainProvider theme="dark" glow={.5} motion={!reduced}>
    <a className="skip-link" href="#main">{t('Aller au contenu','Skip to content')}</a>
    <Masthead t={t} language={language} setLanguage={setLanguage}/>
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
      <Features t={t}/>
      <Beta t={t}/>
      <Requirements t={t}/>
      <Faq t={t}/>
    </main>
    <Footer t={t}/>
  </NBrainProvider>;
}

createRoot(document.getElementById('root')).render(<App/>);
