// ─── /n-der/welcome/ — the link from the signup mail lands here ───────────────
// The token is in the URL FRAGMENT (#t=…), so it never reaches a server log. Nothing is sent until the
// person clicks (mail scanners that pre-open links must not consume the one-time token):
//   POST {apiUrl}/v1/signup/confirm {token} → {licence_key, licence_id, features, kind, seats, expires_at, email, replaced?}
//   410 token_used / token_expired, 404 not_found.
// Then GET {apiUrl}/v1/manager → {managers:[{platform, version, sha256, size, url, filename, latest}]} for the downloads
// (the manager is `n-der`: n-der-<version>-<platform>[.exe]). Controls are N'Brain UI's (Tabs, Card, Badge, Alert, Button).
import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {NBrainProvider} from '../vendor/nbrain-ui/src/components/system/provider';
import {Download} from 'lucide-react';
import {Alert,Badge,Button,Card,Tabs} from '../vendor/nbrain-ui/src/components/ui/primitives';
import {Command,CopyButton,LinkButton,SimplePage,Steps,useLanguage,useReducedMotion,usePageMeta} from './site';
import {NDER} from './release';
import '@fontsource-variable/inter';import '@fontsource-variable/oxanium';import '@fontsource/ibm-plex-mono/400.css';
import '../vendor/nbrain-ui/styles.css';import '../site.css';

const PLATFORM_NAMES={'windows-x86_64':'Windows','linux-x86_64':'Linux','macos-aarch64':'macOS'};

function guessPlatform(){
  const ua=(navigator.userAgentData&&navigator.userAgentData.platform)||navigator.userAgent||'';
  if(/win/i.test(ua))return 'windows-x86_64';
  if(/mac/i.test(ua))return 'macos-aarch64';
  if(/linux|x11/i.test(ua))return 'linux-x86_64';
  return 'windows-x86_64';
}

function readToken(){
  const m=/(?:^|[#&])t=([A-Za-z0-9_-]+)/.exec(window.location.hash);
  return m?m[1]:'';
}

function formatSize(n){return n>1e6?`${(n/1e6).toFixed(1)} MB`:`${Math.round(n/1e3)} kB`}

// The three install steps for one platform. `manager` is the server's entry for it (or undefined: not published yet).
function PlatformSteps({platform,manager,managers,licence,t}){
  const win=platform==='windows-x86_64';
  // The server names the file (n-der-<version>-<platform>[.exe]); before the list arrives, a generic name.
  const file=manager?(manager.filename||`n-der-${manager.version}-${manager.platform}${win?'.exe':''}`):(win?'n-der.exe':'n-der');
  const key=licence?licence.licence_key:t('<votre-clé>','<your-key>');
  const command=`${win?'.\\':'./'}${file} login ${key} --setup`;
  const download=managers===null?<p>{t('Chargement…','Loading…')}</p>
    :managers==='error'?<Alert tone="warning" title={t('Le serveur de téléchargement ne répond pas.','The download server is not answering.')}>{t('Rechargez la page dans un instant.','Reload the page in a moment.')}</Alert>
    :manager?<div className="download">
      <LinkButton href={/^https?:/.test(manager.url)?manager.url:`${NDER.apiUrl}${manager.url}`} variant="primary" download={file}>
        <Download size={16} aria-hidden="true"/>{t(`Télécharger pour ${PLATFORM_NAMES[platform]}`,`Download for ${PLATFORM_NAMES[platform]}`)}
      </LinkButton>
      <span className="download-meta">{file} · {formatSize(manager.size)} · SHA-256 {manager.sha256.slice(0,12)}…</span>
    </div>
    :<Alert tone="blue" title={t(`Le gestionnaire pour ${PLATFORM_NAMES[platform]} arrive bientôt.`,`The manager for ${PLATFORM_NAMES[platform]} is coming soon.`)}>
      {t('Gardez votre clé : elle fonctionnera dès sa sortie.','Keep your key: it will work as soon as it ships.')}
    </Alert>;
  return <Steps vertical items={[
    [t('Téléchargez le gestionnaire N’Der','Download the N’Der manager'),download],
    [t('Connectez cette machine','Sign this machine in'),<>
      <p>{win?t('Ouvrez PowerShell dans le dossier du téléchargement et lancez :','Open PowerShell in the download folder and run:')
            :t('Ouvrez un terminal dans le dossier du téléchargement et lancez :','Open a terminal in the download folder and run:')}</p>
      {!win&&<Command text={`chmod +x ${file}`} t={t}/>}
      <Command text={command} t={t}/>
      <p>{t('Le gestionnaire active la licence, installe N’Der dans Houdini, Blender et SCRATCH s’ils sont présents, et la renouvelle chaque jour en arrière-plan.','The manager activates the licence, installs N’Der into Houdini, Blender and SCRATCH where they are installed, and renews it every day in the background.')}</p>
    </>],
    [t('Rendez','Render'),t('Houdini : choisissez « N’Der » dans le menu des moteurs de rendu du viewport Solaris. Blender : activez l’extension « N’Der » dans Préférences › Extensions, puis choisissez N’Der comme moteur de rendu. SCRATCH : le plugin N’Der apparaît au prochain démarrage.','Houdini: pick “N’Der” in the Solaris viewport’s renderer menu. Blender: enable the “N’Der” add-on in Preferences › Add-ons, then pick N’Der as the render engine. SCRATCH: the N’Der plugin appears at the next start.')],
  ]}/>;
}

function Setup({licence,t,language}){
  const [managers,setManagers]=useState(null);
  const [platform,setPlatform]=useState(guessPlatform);
  useEffect(()=>{fetch(`${NDER.apiUrl}/v1/manager`).then(r=>r.ok?r.json():{managers:[]}).then(d=>setManagers((d.managers||[]).filter(m=>m.latest))).catch(()=>setManagers('error'))},[]);
  const until=licence&&licence.expires_at?new Date(licence.expires_at*1000).toLocaleDateString(language==='fr'?'fr-FR':'en-GB',{day:'numeric',month:'long',year:'numeric'}):null;
  return <>
    {licence&&<Card glass className="key-card">
      <span className="eyebrow">{t('VOTRE CLÉ DE LICENCE','YOUR LICENCE KEY')}</span>
      <div className="licence-key"><code>{licence.licence_key}</code><CopyButton text={licence.licence_key} t={t} label={t('Copier la clé','Copy the key')}/></div>
      <p>{t(`Nous l’avons aussi envoyée à ${licence.email}. Elle n’est affichée qu’une fois : gardez cet e-mail.`,`We also sent it to ${licence.email}. It is shown only once: keep that email.`)}</p>
      <div className="licence-facts">
        <Badge tone="blue">{t(`${licence.seats} machines`,`${licence.seats} machines`)}</Badge>
        {(licence.features||[]).map(f=><Badge key={f}>{({houdini:'Houdini',blender:'Blender',scratch:'Assimilate SCRATCH / Live FX'}[f]||f)}</Badge>)}
        {until&&<Badge tone="success">{t(`Valable jusqu’au ${until}`,`Valid until ${until}`)}</Badge>}
      </div>
      {licence.replaced&&<Alert tone="warning" title={t('Cette clé remplace la précédente.','This key replaces your previous one.')}>
        {t('L’ancienne ne fonctionne plus : connectez à nouveau vos machines avec la nouvelle.','The old one no longer works: sign your machines in again with the new key.')}
      </Alert>}
    </Card>}
    <section className={licence?'setup':'setup setup-first'} aria-labelledby="setup-title">
      <h2 id="setup-title">{t('Installer N’Der','Install N’Der')}</h2>
      <Tabs value={platform} onValueChange={setPlatform} items={Object.entries(PLATFORM_NAMES).map(([id,name])=>({value:id,label:name,
        content:<PlatformSteps platform={id} manager={Array.isArray(managers)?managers.find(m=>m.platform===id):undefined} managers={managers} licence={licence} t={t}/>}))}/>
    </section>
  </>;
}

function Confirm({t,language}){
  const [token]=useState(readToken);
  const [state,setState]=useState({kind:'idle'});
  async function confirm(){
    setState({kind:'sending'});
    try{
      const r=await fetch(`${NDER.apiUrl}/v1/signup/confirm`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});
      const body=await r.json().catch(()=>({}));
      if(r.ok&&body.licence_key){
        try{history.replaceState(null,'',window.location.pathname)}catch{}
        setState({kind:'done',licence:body});return;
      }
      const messages={
        token_used:t('Ce lien a déjà servi. Votre clé vous a été envoyée par e-mail à ce moment-là.','This link was already used. Your key was emailed to you at that time.'),
        token_expired:t('Ce lien a expiré (24 heures). Inscrivez-vous à nouveau pour en recevoir un autre.','This link has expired (24 hours). Sign up again to get a new one.'),
        not_found:t('Ce lien n’est pas valide. Vérifiez qu’il est complet, ou inscrivez-vous à nouveau.','This link is not valid. Check it is complete, or sign up again.'),
      };
      setState({kind:'error',message:messages[body.error]||t('Le serveur n’a pas pu traiter la demande. Réessayez plus tard.','The server could not take the request. Try again later.')});
    }catch{
      setState({kind:'error',message:t('Le serveur de licences ne répond pas. Réessayez dans un instant.','The licence server is not answering. Try again in a moment.')});
    }
  }
  if(state.kind==='done')return <Setup licence={state.licence} t={t} language={language}/>;
  if(!token)return <><p className="lede">{t('Ouvrez cette page depuis le lien reçu par e-mail.','Open this page from the link in your email.')}</p><LinkButton href="/n-der/beta/" variant="secondary">{t('Recevoir un lien','Get a link')}</LinkButton></>;
  return <Card glass className="form-card">
    <h3>{t('Votre clé est prête.','Your key is ready.')}</h3>
    <p>{t('Elle ne s’affiche qu’une fois, et vous la recevez aussi par e-mail.','It is shown only once, and you also receive it by email.')}</p>
    {state.kind==='error'&&<Alert tone="danger" title={state.message}/>}
    <Button type="button" variant="primary" onClick={confirm} loading={state.kind==='sending'}>{state.kind==='sending'?t('Un instant…','One moment…'):t('Afficher ma clé de licence','Show my licence key')}</Button>
  </Card>;
}

const DOWNLOAD=window.location.pathname.replace(/\/?$/,'/')==='/n-der/download/';

function App(){
  const {language,setLanguage,t}=useLanguage();
  const reduced=useReducedMotion();
  usePageMeta(DOWNLOAD?t('Télécharger N’Der — N’Break','Download N’Der — N’Break'):t('Bienvenue dans la bêta N’Der — N’Break','Welcome to the N’Der beta — N’Break'),DOWNLOAD?t('Le gestionnaire N’Der pour Windows et Linux.','The N’Der manager for Windows and Linux.'):t('Votre clé de licence N’Der et le gestionnaire à installer.','Your N’Der licence key and the manager to install.'));
  if(DOWNLOAD)return <NBrainProvider theme="dark" glow={.5} motion={!reduced}>
    <SimplePage t={t} language={language} setLanguage={setLanguage} eyebrow={t('N’DER · TÉLÉCHARGEMENT','N’DER · DOWNLOAD')} title={t('Le gestionnaire N’Der.','The N’Der manager.')} wide current="nder">
      <p className="lede">{t('Il installe N’Der dans Houdini, Blender et SCRATCH, et garde la licence de la machine. Il vous faut une clé : ','It installs N’Der into Houdini, Blender and SCRATCH and keeps the machine’s licence. You need a key: ')}<a href="/n-der/beta/">{t('recevoir une clé gratuite','get a free key')}</a>.</p>
      <Setup licence={null} t={t} language={language}/>
    </SimplePage>
  </NBrainProvider>;
  return <NBrainProvider theme="dark" glow={.5} motion={!reduced}>
    <SimplePage t={t} language={language} setLanguage={setLanguage} eyebrow={t('N’DER · BÊTA GRATUITE','N’DER · FREE BETA')} title={t('Bienvenue.','Welcome.')} wide current="nder">
      <Confirm t={t} language={language}/>
    </SimplePage>
  </NBrainProvider>;
}

createRoot(document.getElementById('root')).render(<App/>);
