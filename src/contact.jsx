// ─── The contact / early-access form (no mailto: people fill a form, N'Break gets the mail) ─────
// POST {apiUrl}/v1/contact {email, name, topic, message, lang, accept_privacy, website}
//   → 202 {status:"sent"}; 400 bad_request, 429 rate_limited, 503 contact_closed, 502 mail_failed.
// The licence server mails it to N'Break (NDER_NOTIFY_EMAIL) with Reply-To = the visitor; it never mails the visitor.
// `website` is a honeypot: hidden from people, bots fill it, the server drops those.
import React,{useState} from 'react';
import {Alert,Button,Card,Checkbox,Field,Input,Select,Textarea} from '../vendor/nbrain-ui/src/components/ui/primitives';
import {NDER} from './release';

export function ContactForm({t,language,topic:initialTopic='question'}){
  const [email,setEmail]=useState('');
  const [name,setName]=useState('');
  const [topic,setTopic]=useState(initialTopic);
  const [message,setMessage]=useState('');
  const [accept,setAccept]=useState(false);
  const [website,setWebsite]=useState('');
  const [state,setState]=useState({kind:'idle'});
  const topics=[
    {value:'early_access',label:t('Accès anticipé à N’Der','Early access to N’Der')},
    {value:'question',label:t('Une question','A question')},
    {value:'studio',label:t('Studio, plateau ou partenariat','Studio, stage or partnership')},
    {value:'other',label:t('Autre','Something else')},
  ];
  const messageNeeded=topic!=='early_access';
  async function submit(e){
    e.preventDefault();
    if(!accept){setState({kind:'error',message:t('Acceptez la politique de confidentialité pour envoyer le message.','Accept the privacy notice to send the message.')});return}
    if(messageNeeded&&!message.trim()){setState({kind:'error',message:t('Écrivez votre message.','Write your message.')});return}
    setState({kind:'sending'});
    try{
      const r=await fetch(`${NDER.apiUrl}/v1/contact`,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email:email.trim(),name:name.trim(),topic,message:message.trim(),lang:language,accept_privacy:true,website})});
      if(r.status===202||r.ok){setState({kind:'sent'});return}
      const body=await r.json().catch(()=>({}));
      const messages={
        bad_request:t('Vérifiez l’adresse e-mail et le message.','Check the email address and the message.'),
        rate_limited:t('Trop de messages. Réessayez dans une heure.','Too many messages. Try again in an hour.'),
      };
      setState({kind:'error',message:messages[body.error]||t('Le message n’a pas pu partir. Réessayez plus tard.','The message could not be sent. Try again later.')});
    }catch{
      setState({kind:'error',message:t('Le serveur ne répond pas. Vérifiez votre connexion et réessayez.','The server is not answering. Check your connection and try again.')});
    }
  }
  if(state.kind==='sent')return <Alert tone="success" title={t('Message envoyé.','Message sent.')}>
    {topic==='early_access'
      ?t(`Merci. Nous vous écrivons à ${email.trim()} dès que votre accès est prêt.`,`Thank you. We will write to ${email.trim()} as soon as your access is ready.`)
      :t(`Merci. Nous vous répondons à ${email.trim()}.`,`Thank you. We will reply to ${email.trim()}.`)}
  </Alert>;
  const acceptLabel=t('J’ai lu la politique de confidentialité','I have read the privacy notice');
  return <Card glass className="form-card contact-card">
    <form onSubmit={submit} noValidate>
      <div className="form-row">
        <Field label={t('Adresse e-mail','Email address')}>
          <Input type="email" required autoComplete="email" inputMode="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder={t('vous@studio.com','you@studio.com')}/>
        </Field>
        <Field label={t('Nom (facultatif)','Name (optional)')}>
          <Input autoComplete="name" value={name} maxLength={120} onChange={e=>setName(e.target.value)}/>
        </Field>
      </div>
      <div className="nb-field"><span className="field-label">{t('Sujet','Topic')}</span><Select label={t('Sujet','Topic')} value={topic} onValueChange={setTopic} options={topics}/></div>
      <Field label={messageNeeded?t('Message','Message'):t('Message (facultatif)','Message (optional)')}>
        <Textarea rows={5} maxLength={4000} value={message} onChange={e=>setMessage(e.target.value)}
          placeholder={topic==='early_access'?t('Votre studio, vos logiciels, votre projet…','Your studio, your software, your project…'):''}/>
      </Field>
      <div className="hp-field" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label></div>
      <Checkbox className="accept-box" checked={accept} onCheckedChange={v=>setAccept(!!v)} aria-label={acceptLabel}
        label={<span className="accept-text">{t('J’ai lu la ','I have read the ')}<a href="/privacy/">{t('politique de confidentialité','privacy notice')}</a>.</span>}/>
      {state.kind==='error'&&<Alert tone="danger" title={state.message}/>}
      <Button type="submit" variant="primary" loading={state.kind==='sending'} disabled={!email.trim()}>{state.kind==='sending'?t('Envoi…','Sending…'):t('Envoyer','Send')}</Button>
    </form>
  </Card>;
}
