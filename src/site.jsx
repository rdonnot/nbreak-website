// ─── Shared page chrome: language, motion preference, header, footer ────────
import React,{useEffect,useState} from 'react';
import {Button} from '../vendor/nbrain-ui/src/components/ui/primitives';

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
export function SimplePage({t,language,setLanguage,eyebrow,title,children,wide=false}){
  return <>
    <a className="skip-link" href="#main">{t('Aller au contenu','Skip to content')}</a>
    <Masthead t={t} language={language} setLanguage={setLanguage}/>
    <main id="main" className={`simple-page${wide?' simple-page-wide':''}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {children}
    </main>
    <Footer t={t}/>
  </>;
}

export function LinkButton({href,children,variant='silver',external=false}){
  return <a className={`nb-button button-md button-${variant} link-button`} href={href} {...(external?{target:'_blank',rel:'noopener noreferrer'}:{})}>{children}</a>;
}

// `home` = the home page's anchors stay in-page; elsewhere they point back to /.
export function Masthead({t,language,setLanguage,home=false}){
  const base=home?'':'/';
  return <header className="masthead">
    <a className="brand" href={home?'#home':'/'}>N’BREAK<span>/</span></a>
    <nav aria-label={t('Navigation principale','Main navigation')}>
      <a href={`${base}#nbrain`}>N’Brain</a>
      <a href="/n-der/">N’Der</a>
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
