// ─── Shared page chrome: language, motion preference, header, footer ────────
import React,{useEffect,useState} from 'react';
import {Check,Copy} from 'lucide-react';
import {Button,buttonVariants} from '../vendor/nbrain-ui/src/components/ui/primitives';

export const PROFILE='https://fr.linkedin.com/in/romain-donnot-7995709';

export function useLanguage(){
  const [language,setLanguage]=useState(()=>{try{return localStorage.getItem('nbreak-language')==='en'?'en':'fr'}catch{return 'fr'}});
  useEffect(()=>{document.documentElement.lang=language;try{localStorage.setItem('nbreak-language',language)}catch{}},[language]);
  const t=(fr,en)=>language==='fr'?fr:en;
  return {language,setLanguage,t};
}

export function useReducedMotion(){
  const [reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{const q=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(q.matches);q.addEventListener('change',update);return()=>q.removeEventListener('change',update)},[]);
  return reduced;
}

export function usePageMeta(title,description){
  useEffect(()=>{document.title=title;const meta=document.querySelector('meta[name=description]');if(meta)meta.content=description},[title,description]);
}

export function useHeroDrift(reduced){
  useEffect(()=>{if(reduced)return;let frame=0;const update=()=>{frame=0;document.documentElement.style.setProperty('--hero-drift',`${Math.min(window.scrollY*.12,65)}px`)};const scroll=()=>{if(!frame)frame=requestAnimationFrame(update)};window.addEventListener('scroll',scroll,{passive:true});update();return()=>{window.removeEventListener('scroll',scroll);cancelAnimationFrame(frame);document.documentElement.style.setProperty('--hero-drift','0px')}},[reduced]);
}

// The page shell every secondary page shares (beta form, welcome, legal texts).
export function SimplePage({t,language,setLanguage,eyebrow,title,children,wide=false,current}){
  return <>
    <a className="skip-link" href="#main">{t('Aller au contenu','Skip to content')}</a>
    <Masthead t={t} language={language} setLanguage={setLanguage} current={current}/>
    <main id="main" className={`simple-page${wide?' simple-page-wide':''}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {children}
    </main>
    <Footer t={t}/>
  </>;
}

// A link drawn as the library's Button (same variants and sizes), for actions that navigate.
export function LinkButton({href,children,variant='silver',size='md',external=false,...rest}){
  return <a className={`${buttonVariants({variant,size})} link-button`} href={href} {...(external?{target:'_blank',rel:'noopener noreferrer'}:{})} {...rest}>{children}</a>;
}

// The library's Button copying a text (a licence key, a command); says "Copied" for a moment.
export function CopyButton({text,t,label}){
  const [done,setDone]=useState(false);
  return <Button type="button" variant="ghost" size="sm" className="copy-button" aria-label={label||t('Copier','Copy')}
    onClick={async()=>{try{await navigator.clipboard.writeText(text);setDone(true);setTimeout(()=>setDone(false),1600)}catch{}}}>
    {done?<Check size={14} aria-hidden="true"/>:<Copy size={14} aria-hidden="true"/>}<span aria-live="polite">{done?t('Copié','Copied'):t('Copier','Copy')}</span>
  </Button>;
}

// A shell command on one line with its copy button.
export function Command({text,t}){
  return <div className="command"><code>{text}</code><CopyButton text={text} t={t} label={t('Copier la commande','Copy the command')}/></div>;
}

// Numbered steps (the beta's three, the install's three).
export function Steps({items,vertical=false}){
  return <ol className={`steps${vertical?' steps-vertical':''}`}>{items.map(([title,body],i)=><li key={i}><span className="step-number" aria-hidden="true">{i+1}</span><div><h3>{title}</h3>{typeof body==='string'?<p>{body}</p>:body}</div></li>)}</ol>;
}

// A page section with its eyebrow / title / intro.
export function Section({id,eyebrow,title,intro,className='',children}){
  return <section className={`nder-section ${className}`} id={id} aria-labelledby={id?id+'-title':undefined}>
    <div className="nder-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2 id={id?id+'-title':undefined}>{title}</h2>
      {intro&&<p>{intro}</p>}
    </div>
    {children}
  </section>;
}

// `home` = the home page's anchors stay in-page; elsewhere they point back to /.
export function Masthead({t,language,setLanguage,home=false,current}){
  const base=home?'':'/';
  return <header className="masthead">
    <a className="brand" href={home?'#home':'/'}>N’BREAK<span>/</span></a>
    <nav aria-label={t('Navigation principale','Main navigation')}>
      <a href={`${base}#nbrain`}>N’Brain</a>
      <a href="/n-der/" aria-current={current==='nder'?'page':undefined}>N’Der</a>
      <a href={`${base}#contact`}>Contact</a>
    </nav>
    <div className="languages">{['fr','en'].map(x=><Button key={x} size="sm" variant={language===x?'silver':'ghost'} aria-pressed={language===x} onClick={()=>setLanguage(x)}>{x.toUpperCase()}</Button>)}</div>
  </header>;
}

export function Footer({t,home=false}){
  return <footer>
    <a className="brand" href={home?'#home':'/'}>N’BREAK<span>/</span></a>
    <span>{t('Technologies créatives','Creative technology')}</span>
    <nav className="footer-links" aria-label={t('Informations légales','Legal information')}>
      <a href="/legal/">{t('Mentions légales','Legal notice')}</a>
      <a href="/privacy/">{t('Confidentialité','Privacy')}</a>
      <a href="/n-der/terms/">{t('Conditions N’Der','N’Der terms')}</a>
    </nav>
    <span>© {new Date().getFullYear()} N’Break</span>
  </footer>;
}
