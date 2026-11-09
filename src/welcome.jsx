// ─── /nder/welcome/ — the link from the signup mail lands here ───────────────
// The token is in the URL FRAGMENT (#t=…), so it never reaches a server log. Nothing is sent until the
// person clicks (mail scanners that pre-open links must not consume the one-time token):
//   POST {apiUrl}/v1/signup/confirm {token} → {licence_key, licence_id, features, kind, seats, expires_at, email, replaced?}
//   410 token_used / token_expired, 404 not_found.
// Then GET {apiUrl}/v1/manager → {managers:[{platform, version, sha256, size, url, latest}]} for the downloads.
import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {NBrainProvider} from '../vendor/nbrain-ui/src/components/system/provider';
import {Card} from '../vendor/nbrain-ui/src/components/ui/primitives';
import {SimplePage,useLanguage,useReducedMotion,usePageMeta} from './site';
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

function Copy({text,t}){
  const [done,setDone]=useState(false);
  return <button type="button" className="nb-button button-sm button-ghost copy-button" onClick={async()=>{try{await navigator.clipboard.writeText(text);setDone(true);setTimeout(()=>setDone(false),1600)}catch{}}}>{done?t('Copié','Copied'):t('Copier','Copy')}</button>;
}

function formatSize(n){return n>1e6?`${(n/1e6).toFixed(1)} MB`:`${Math.round(n/1e3)} kB`}

function Setup({licence,t,language}){
  const [managers,setManagers]=useState(null);
  const [platform,setPlatform]=useState(guessPlatform);
  useEffect(()=>{fetch(`${NDER.apiUrl}/v1/manager`).then(r=>r.ok?r.json():{managers:[]}).then(d=>setManagers((d.managers||[]).filter(m=>m.latest))).catch(()=>setManagers([]))},[]);
  const manager=managers&&managers.find(m=>m.platform===platform);
  const file=manager?`nder-${manager.version}-${manager.platform}${manager.platform.startsWith('windows')?'.exe':''}`:'';
  const exe=platform==='windows-x86_64'?`.\\${file||'nder.exe'}`:`./${file||'nder'}`;
  const key=licence?licence.licence_key:t('<votre-clé>','<your-key>');
  const command=`${exe} login ${key} --setup`;
  const until=licence&&licence.expires_at?new Date(licence.expires_at*1000).toLocaleDateString(language==='fr'?'fr-FR':'en-GB',{day:'numeric',month:'long',year:'numeric'}):null;
  return <>
    {licence&&<Card glass className="product-card key-card">
      <span className="eyebrow">{t('VOTRE CLÉ DE LICENCE','YOUR LICENCE KEY')}</span>
      <div className="licence-key"><code>{licence.licence_key}</code><Copy text={licence.licence_key} t={t}/></div>
      <p>{t(`Nous l’avons aussi envoyée à ${licence.email}. Elle n’est affichée qu’une fois : gardez cet e-mail.`,`We also sent it to ${licence.email}. It is shown only once: keep that email.`)}</p>
      <ul className="licence-facts">
        <li>{t(`${licence.seats} machines`,`${licence.seats} machines`)}</li>
        <li>{(licence.features||[]).map(f=>({houdini:'Houdini',blender:'Blender',scratch:'Assimilate SCRATCH / Live FX'}[f]||f)).join(' · ')}</li>
        {until&&<li>{t(`Valable jusqu’au ${until}`,`Valid until ${until}`)}</li>}
      </ul>
      {licence.replaced&&<p className="form-note">{t('Cette clé remplace la précédente, qui ne fonctionne plus : connectez à nouveau vos machines avec la nouvelle.','This key replaces your previous one, which no longer works: sign your machines in again with the new key.')}</p>}
    </Card>}
    <section className={licence?'setup':'setup setup-first'}>
      <h2>{t('Installer N’Der','Install N’Der')}</h2>
      <div className="platform-tabs" role="tablist" aria-label={t('Système','System')}>{Object.entries(PLATFORM_NAMES).map(([id,name])=>
        <button key={id} type="button" role="tab" aria-selected={platform===id} className={`nb-button button-sm ${platform===id?'button-silver':'button-ghost'}`} onClick={()=>setPlatform(id)}>{name}</button>)}</div>
      <ol className="steps steps-vertical">
        <li><span className="step-number">1</span><div>
          <h3>{t('Téléchargez le gestionnaire N’Der','Download the N’Der manager')}</h3>
          {managers===null?<p>{t('Chargement…','Loading…')}</p>
            :manager?<p><a className="nb-button button-md button-primary link-button" href={/^https?:/.test(manager.url)?manager.url:`${NDER.apiUrl}${manager.url}`} download={file}>{t(`Télécharger pour ${PLATFORM_NAMES[platform]}`,`Download for ${PLATFORM_NAMES[platform]}`)}</a><span className="download-meta">{file} · {formatSize(manager.size)} · SHA-256 {manager.sha256.slice(0,12)}…</span></p>
            :<p>{t(`Le gestionnaire pour ${PLATFORM_NAMES[platform]} arrive bientôt. Gardez votre clé : elle fonctionnera dès sa sortie.`,`The manager for ${PLATFORM_NAMES[platform]} is coming soon. Keep your key: it will work as soon as it ships.`)}</p>}
        </div></li>
        <li><span className="step-number">2</span><div>
          <h3>{t('Connectez cette machine','Sign this machine in')}</h3>
          <p>{platform==='windows-x86_64'
            ?t('Ouvrez PowerShell dans le dossier du téléchargement et lancez :','Open PowerShell in the download folder and run:')
            :t('Ouvrez un terminal dans le dossier du téléchargement et lancez :','Open a terminal in the download folder and run:')}</p>
          {platform!=='windows-x86_64'&&<div className="command"><code>chmod +x {file||'nder'}</code><Copy text={`chmod +x ${file||'nder'}`} t={t}/></div>}
          <div className="command"><code>{command}</code><Copy text={command} t={t}/></div>
          <p>{t('Le gestionnaire active la licence, installe N’Der dans Houdini, Blender et SCRATCH s’ils sont présents, et la renouvelle chaque jour en arrière-plan.','The manager activates the licence, installs N’Der into Houdini, Blender and SCRATCH where they are installed, and renews it every day in the background.')}</p>
        </div></li>
        <li><span className="step-number">3</span><div>
          <h3>{t('Rendez','Render')}</h3>
          <p>{t('Houdini : choisissez « N’Der » dans le menu des moteurs de rendu du viewport Solaris. Blender : activez l’extension « Nder » dans Préférences › Extensions, puis choisissez N’Der comme moteur de rendu. SCRATCH : le plugin N’Der apparaît au prochain démarrage.','Houdini: pick “N’Der” in the Solaris viewport’s renderer menu. Blender: enable the “Nder” add-on in Preferences › Add-ons, then pick N’Der as the render engine. SCRATCH: the N’Der plugin appears at the next start.')}</p>
        </div></li>
      </ol>
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
  if(!token)return <><p className="lede">{t('Ouvrez cette page depuis le lien reçu par e-mail.','Open this page from the link in your email.')}</p><p><a className="text-link" href="/nder/beta/">{t('Recevoir un lien','Get a link')}</a></p></>;
  return <Card glass className="product-card form-card">
    <h3>{t('Votre clé est prête.','Your key is ready.')}</h3>
    <p>{t('Elle ne s’affiche qu’une fois, et vous la recevez aussi par e-mail.','It is shown only once, and you also receive it by email.')}</p>
    {state.kind==='error'&&<p className="form-error" role="alert">{state.message}</p>}
    <button className="nb-button button-md button-primary link-button" type="button" onClick={confirm} disabled={state.kind==='sending'}>{state.kind==='sending'?t('Un instant…','One moment…'):t('Afficher ma clé de licence','Show my licence key')}</button>
  </Card>;
}

const DOWNLOAD=window.location.pathname.replace(/\/?$/,'/')==='/nder/download/';

function App(){
  const {language,setLanguage,t}=useLanguage();
  const reduced=useReducedMotion();
  usePageMeta(DOWNLOAD?t('Télécharger N’Der — N’Break','Download N’Der — N’Break'):t('Bienvenue dans la bêta N’Der — N’Break','Welcome to the N’Der beta — N’Break'),DOWNLOAD?t('Le gestionnaire N’Der pour Windows, macOS et Linux.','The N’Der manager for Windows, macOS and Linux.'):t('Votre clé de licence N’Der et le gestionnaire à installer.','Your N’Der licence key and the manager to install.'));
  if(DOWNLOAD)return <NBrainProvider theme="dark" glow={.5} motion={!reduced}>
    <SimplePage t={t} language={language} setLanguage={setLanguage} eyebrow={t('N’DER · TÉLÉCHARGEMENT','N’DER · DOWNLOAD')} title={t('Le gestionnaire N’Der.','The N’Der manager.')} wide>
      <p className="lede">{t('Il installe N’Der dans Houdini, Blender et SCRATCH, et garde la licence de la machine. Il vous faut une clé : ','It installs N’Der into Houdini, Blender and SCRATCH and keeps the machine’s licence. You need a key: ')}<a className="text-link" href="/nder/beta/">{t('recevoir une clé gratuite','get a free key')}</a>.</p>
      <Setup licence={null} t={t} language={language}/>
    </SimplePage>
  </NBrainProvider>;
  return <NBrainProvider theme="dark" glow={.5} motion={!reduced}>
    <SimplePage t={t} language={language} setLanguage={setLanguage} eyebrow={t('N’DER · BÊTA GRATUITE','N’DER · FREE BETA')} title={t('Bienvenue.','Welcome.')} wide>
      <Confirm t={t} language={language}/>
    </SimplePage>
  </NBrainProvider>;
}

createRoot(document.getElementById('root')).render(<App/>);
