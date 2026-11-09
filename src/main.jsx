import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {NBrainProvider} from '../vendor/nbrain-ui/src/components/system/provider';
import {Button,Card,Badge} from '../vendor/nbrain-ui/src/components/ui/primitives';
import {ExperienceBackground} from './backgrounds/ExperienceBackground';
import {PROFILE,LinkButton,Masthead,Footer,useLanguage,useReducedMotion,usePageMeta,useHeroDrift} from './site';
import {NDER} from './release';
import '@fontsource-variable/inter';import '@fontsource-variable/oxanium';import '@fontsource/ibm-plex-mono/400.css';
import '../vendor/nbrain-ui/styles.css';import '../site.css';

function nderBadge(t){
  if(NDER.stage==='beta')return <Badge tone="success">{t('BÊTA GRATUITE','FREE BETA')}</Badge>;
  if(NDER.stage==='paid')return <Badge tone="success">{t('DISPONIBLE','AVAILABLE')}</Badge>;
  return <Badge tone="blue">{t('BÊTA GRATUITE BIENTÔT','FREE BETA SOON')}</Badge>;
}

function App(){
  const {language,setLanguage,t}=useLanguage();
  const reduced=useReducedMotion();
  const [paused,setPaused]=useState(false);
  usePageMeta(t('N’Break — Technologies créatives','N’Break — Creative technology'),t('N’Break développe des expériences et des outils créatifs : N’Brain, la plateforme de création, et N’Der, son moteur de rendu ray tracing temps réel.','N’Break develops creative experiences and tools: N’Brain, the creative platform, and N’Der, its real-time ray tracing renderer.'));
  useHeroDrift(reduced);
  return <NBrainProvider theme="dark" glow={.5} motion={!reduced}>
    <a className="skip-link" href="#main">{t('Aller au contenu','Skip to content')}</a>
    <Masthead t={t} language={language} setLanguage={setLanguage} home/>
    <main id="main">
      <section className="hero" id="home">
        <ExperienceBackground mode="flow" enabled={!paused&&!reduced}/>
        <div className="hero-shade"/>
        <div className="hero-content">
          <span className="eyebrow">{t('TECHNOLOGIES CRÉATIVES','CREATIVE TECHNOLOGY')}</span>
          <h1>{t('La technologie.','Technology.')}<br/><span>{t('Au service de la création.','For creativity.')}</span></h1>
          <p>{t('N’Break conçoit des expériences et des outils pour la production virtuelle, les univers immersifs et la création avec l’IA.','N’Break creates experiences and tools for virtual production, immersive worlds and AI-assisted creativity.')}</p>
          <LinkButton href="#nbrain">{t('Découvrir N’Brain','Discover N’Brain')}</LinkButton>
        </div>
        <div className="hero-bottom">
          <span>{t('Production virtuelle · Immersion · IA','Virtual production · Immersive experiences · AI')}</span>
          <Button variant="ghost" size="sm" disabled={reduced} aria-pressed={paused} onClick={()=>setPaused(!paused)}>{reduced?t('Animation désactivée','Animation disabled'):paused?t('Reprendre l’animation','Resume animation'):t('Mettre en pause','Pause animation')}</Button>
        </div>
      </section>
      <section className="product-section" id="nbrain">
        <div className="product-intro">
          <span className="eyebrow">{t('NOS PRODUITS','OUR PRODUCTS')}</span>
          <h2>N’Brain<span>.</span></h2>
          <p>{t('Vos outils de création. Une seule interface.','Your creative tools. One interface.')}</p>
        </div>
        <div className="product-stack">
          <Card glass className="product-card">
            <Badge tone="blue">{t('EN DÉVELOPPEMENT','IN DEVELOPMENT')}</Badge>
            <h3>{t('La création, aux commandes.','Creativity, in control.')}</h3>
            <p>{t('Nous développons une application web pour réunir les outils de création et de production dans une interface commune, adaptée à vos projets.','We’re developing a web application that brings creative and production tools together in a shared interface, tailored to your projects.')}</p>
            <LinkButton href="#contact" variant="primary">{t('Parlons de N’Brain','Let’s talk about N’Brain')}</LinkButton>
          </Card>
          <Card glass className="product-card product-card-nder">
            {nderBadge(t)}
            <h3>N’Der<span className="product-kicker">{t(' — le moteur de rendu de N’Brain',' — N’Brain’s renderer')}</span></h3>
            <p>{t('Un moteur de rendu ray tracing temps réel dans vos outils : Houdini, Blender et Assimilate SCRATCH / Live FX. Prêt pour la production virtuelle : la lumière d’un rendu final, à la vitesse de la lecture.','A real-time ray-tracing renderer inside your tools: Houdini, Blender and Assimilate SCRATCH / Live FX. Ready for virtual production: final-frame light at playback speed.')}</p>
            <LinkButton href="/n-der/" variant="primary">{t('Découvrir N’Der','Discover N’Der')}</LinkButton>
          </Card>
        </div>
      </section>
      <section className="contact-section" id="contact">
        <span className="eyebrow">{t('PARLONS DE VOTRE PROJET','LET’S TALK ABOUT YOUR PROJECT')}</span>
        <h2>{t('Une idée à concrétiser ?','An idea to bring to life?')}</h2>
        <LinkButton href={PROFILE} external>{t('Contacter Romain sur LinkedIn','Contact Romain on LinkedIn')}</LinkButton>
      </section>
    </main>
    <Footer t={t} home/>
  </NBrainProvider>;
}

createRoot(document.getElementById('root')).render(<App/>);
