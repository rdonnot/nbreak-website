// ─── /n-der/beta/ — the free-beta form ────────────────────────────────────────
// POST {apiUrl}/v1/signup {email, lang, accept_terms} → 202 {status:"sent"} for any valid email (no enumeration);
// the server mails a link to /n-der/welcome/#t=<token>. 400 bad_request, 429 rate_limited, 503 signup_closed.
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {NBrainProvider} from '../vendor/nbrain-ui/src/components/system/provider';
import {Card} from '../vendor/nbrain-ui/src/components/ui/primitives';
import {PROFILE,LinkButton,SimplePage,useLanguage,useReducedMotion,usePageMeta} from './site';
import {NDER} from './release';
import '@fontsource-variable/inter';import '@fontsource-variable/oxanium';import '@fontsource/ibm-plex-mono/400.css';
import '../vendor/nbrain-ui/styles.css';import '../site.css';

const open=NDER.stage==='beta'||NDER.stage==='paid';

function SignupForm({t,language}){
  const [email,setEmail]=useState('');
  const [accept,setAccept]=useState(false);
  const [state,setState]=useState({kind:'idle'});
  async function submit(e){
    e.preventDefault();
    if(!accept){setState({kind:'error',message:t('Acceptez les conditions de la bêta pour continuer.','Accept the beta terms to continue.')});return}
    setState({kind:'sending'});
    try{
      const r=await fetch(`${NDER.apiUrl}/v1/signup`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email.trim(),lang:language,accept_terms:true})});
      if(r.status===202||r.ok){setState({kind:'sent'});return}
      const body=await r.json().catch(()=>({}));
      const messages={
        bad_request:t('Cette adresse e-mail ne semble pas valide.','That email address does not look valid.'),
        rate_limited:t('Trop de demandes. Réessayez dans une heure.','Too many requests. Try again in an hour.'),
        signup_closed:t('Les inscriptions à la bêta sont fermées pour le moment.','Beta sign-ups are closed for now.'),
      };
      setState({kind:'error',message:messages[body.error]||t('Le serveur n’a pas pu traiter la demande. Réessayez plus tard.','The server could not take the request. Try again later.')});
    }catch{
      setState({kind:'error',message:t('Le serveur de licences ne répond pas. Vérifiez votre connexion et réessayez.','The licence server is not answering. Check your connection and try again.')});
    }
  }
  if(state.kind==='sent')return <Card glass className="product-card form-card" role="status">
    <h3>{t('Vérifiez votre boîte mail.','Check your inbox.')}</h3>
    <p>{t(`Nous avons envoyé un lien à ${email.trim()}. Ouvrez-le dans les 24 heures pour recevoir votre clé de licence. Pas de message ? Regardez dans les indésirables.`,`We sent a link to ${email.trim()}. Open it within 24 hours to get your licence key. Nothing there? Look in your spam folder.`)}</p>
  </Card>;
  return <Card glass className="product-card form-card">
    <form onSubmit={submit} noValidate>
      <label className="field">
        <span>{t('Adresse e-mail','Email address')}</span>
        <input type="email" required autoComplete="email" inputMode="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder={t('vous@studio.com','you@studio.com')}/>
      </label>
      <label className="check">
        <input type="checkbox" checked={accept} onChange={e=>setAccept(e.target.checked)}/>
        <span>{t('J’accepte les ','I accept the ')}<a href="/n-der/terms/">{t('conditions de la bêta N’Der','N’Der beta terms')}</a>{t(' et j’ai lu la ',' and have read the ')}<a href="/privacy/">{t('politique de confidentialité','privacy notice')}</a>.</span>
      </label>
      {state.kind==='error'&&<p className="form-error" role="alert">{state.message}</p>}
      <button className="nb-button button-md button-primary link-button" type="submit" disabled={state.kind==='sending'||!email.trim()}>{state.kind==='sending'?t('Envoi…','Sending…'):t('Recevoir ma clé de licence','Get my licence key')}</button>
    </form>
  </Card>;
}

function App(){
  const {language,setLanguage,t}=useLanguage();
  const reduced=useReducedMotion();
  usePageMeta(t('Bêta gratuite N’Der — N’Break','N’Der free beta — N’Break'),t('Recevez une clé de licence gratuite pour la bêta de N’Der.','Get a free licence key for the N’Der beta.'));
  return <NBrainProvider theme="dark" glow={.5} motion={!reduced}>
    <SimplePage t={t} language={language} setLanguage={setLanguage} eyebrow={t('N’DER · BÊTA GRATUITE','N’DER · FREE BETA')} title={t('Votre clé de licence.','Your licence key.')}>
      {open?<>
        <p className="lede">{t(`Entrez votre adresse e-mail : nous vous envoyons un lien, puis votre clé de licence et le gestionnaire N’Der. Gratuit pendant toute la bêta, sur ${NDER.betaSeats} machines.`,`Enter your email address: we send you a link, then your licence key and the N’Der manager. Free for the whole beta, on ${NDER.betaSeats} machines.`)}</p>
        <SignupForm t={t} language={language}/>
      </>:<>
        <p className="lede">{t('La bêta n’est pas encore ouverte. Écrivez-nous pour un accès anticipé.','The beta is not open yet. Get in touch for early access.')}</p>
        <div className="nder-actions"><LinkButton href={PROFILE} variant="primary" external>{t('Demander un accès anticipé','Ask for early access')}</LinkButton></div>
      </>}
    </SimplePage>
  </NBrainProvider>;
}

createRoot(document.getElementById('root')).render(<App/>);
