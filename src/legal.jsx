// ─── /legal/, /privacy/, /n-der/terms/ — the legal texts ─────────────────────
// One module, three pages (picked by the path). Identity fields come from COMPANY in src/release.js;
// an empty one shows as "[à compléter]" and the build refuses to open the beta while any is empty.
// DRAFT texts written for a French SAS/SASU publishing a free beta: have them reviewed before launch.
import React from 'react';
import {createRoot} from 'react-dom/client';
import {NBrainProvider} from '../vendor/nbrain-ui/src/components/system/provider';
import {PROFILE,SimplePage,useLanguage,useReducedMotion,usePageMeta} from './site';
import {NDER,COMPANY,HOST} from './release';
import '@fontsource-variable/inter';import '@fontsource-variable/oxanium';import '@fontsource/ibm-plex-mono/400.css';
import '../vendor/nbrain-ui/styles.css';import '../site.css';

const f=(v,t)=>v||t('[à compléter]','[to be completed]');
const mail=(t)=>COMPANY.email?<a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>:<a href={PROFILE} target="_blank" rel="noopener noreferrer">{t('Romain Donnot sur LinkedIn','Romain Donnot on LinkedIn')}</a>;
const until=(t,language)=>NDER.betaUntil?new Date(NDER.betaUntil+'T00:00:00Z').toLocaleDateString(language==='fr'?'fr-FR':'en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}):(NDER.betaDays?t(`${NDER.betaDays} jours après votre inscription (la date figure dans votre licence)`,`${NDER.betaDays} days after you sign up (the date is shown in your licence)`):t('la date indiquée dans votre licence','the date shown in your licence'));

function Legal({t}){
  return <article className="legal-text">
    <h2>{t('Éditeur','Publisher')}</h2>
    <p>{COMPANY.name}, {f(COMPANY.legalForm,t)}<br/>{t('Siège : ','Registered office: ')}{f(COMPANY.address,t)}<br/>{f(COMPANY.registration,t)}{COMPANY.vat&&<><br/>{t('TVA intracommunautaire : ','EU VAT: ')}{COMPANY.vat}</>}<br/>{t('Contact : ','Contact: ')}{mail(t)}</p>
    <h2>{t('Directeur de la publication','Publication director')}</h2>
    <p>{COMPANY.publisher}</p>
    <h2>{t('Hébergement','Hosting')}</h2>
    <p>{HOST}<br/>{t('Le site et le serveur de licences N’Der y sont hébergés.','The website and the N’Der licence server are hosted there.')}</p>
    <h2>{t('Propriété intellectuelle','Intellectual property')}</h2>
    <p>{t('Les textes, images et logiciels présentés sur ce site appartiennent à N’Break ou à leurs auteurs. Les noms Houdini, Blender, SCRATCH, Live FX, NVIDIA et RTX appartiennent à leurs propriétaires respectifs ; ils sont cités pour indiquer la compatibilité.','The texts, images and software presented on this site belong to N’Break or their authors. Houdini, Blender, SCRATCH, Live FX, NVIDIA and RTX are the property of their respective owners; they are named to state compatibility.')}</p>
  </article>;
}

function Privacy({t}){
  return <article className="legal-text">
    <p>{t('Cette notice explique quelles données N’Break traite, pourquoi, et vos droits (RGPD).','This notice explains which data N’Break processes, why, and your rights (GDPR).')}</p>
    <h2>{t('Responsable du traitement','Controller')}</h2>
    <p>{COMPANY.name}, {f(COMPANY.address,t)}. {t('Contact : ','Contact: ')}{mail(t)}</p>
    <h2>{t('Ce site','This website')}</h2>
    <p>{t('Ni cookie, ni mesure d’audience, ni publicité. Votre choix de langue est gardé dans votre navigateur seulement. Le serveur web conserve des journaux techniques (adresse IP, page, date) pour la sécurité, pendant une durée limitée.','No cookies, no analytics, no advertising. Your language choice stays in your browser only. The web server keeps technical logs (IP address, page, date) for security, for a limited time.')}</p>
    <h2>{t('La bêta N’Der','The N’Der beta')}</h2>
    <ul>
      <li>{t('Votre adresse e-mail : pour vous envoyer le lien de confirmation et votre clé, et vous informer de la bêta (fin, tarifs, mises à jour importantes). Base : l’exécution de la licence que vous demandez.','Your email address: to send you the confirmation link and your key, and to tell you about the beta (its end, pricing, important updates). Basis: performing the licence you ask for.')}</li>
      <li>{t('La licence : son identifiant, une empreinte de la clé (jamais la clé elle-même), ses dates et le nombre de machines.','The licence: its id, a hash of the key (never the key itself), its dates and number of machines.')}</li>
      <li>{t('Pour chaque machine activée : une empreinte anonyme (un hachage de l’identifiant de la machine, pas l’identifiant), le nom de la machine, l’adresse IP et les dates d’activation et de renouvellement. Base : faire respecter le nombre de machines de la licence et prévenir les abus (intérêt légitime).','For each activated machine: an anonymous fingerprint (a hash of the machine id, not the id), the machine name, the IP address, and the activation and renewal dates. Basis: enforcing the licence’s number of machines and preventing abuse (legitimate interest).')}</li>
      <li>{t('Les plugins N’Der dans Houdini, Blender et SCRATCH ne se connectent jamais au réseau et n’envoient rien sur vos scènes ni vos images.','The N’Der plugins in Houdini, Blender and SCRATCH never connect to the network and send nothing about your scenes or pictures.')}</li>
    </ul>
    <h2>{t('Durée de conservation','Retention')}</h2>
    <p>{t('Pendant la durée de la licence, puis 12 mois après sa fin (pour vous la renouveler ou vous proposer la suite), sauf demande d’effacement. Les sauvegardes de la base sont gardées 30 jours.','For the life of the licence, then 12 months after it ends (to renew it or offer you what comes next), unless you ask for erasure. Database backups are kept 30 days.')}</p>
    <h2>{t('Destinataires','Recipients')}</h2>
    <p>{t('Aucune vente ni cession. Sous-traitants : l’hébergeur (','No selling or sharing. Processors: the host (')}{HOST}{t(') et le service d’envoi des e-mails. Les données sont stockées en Allemagne.',') and the email delivery service. The data is stored in Germany.')}</p>
    <h2>{t('Vos droits','Your rights')}</h2>
    <p>{t('Accès, rectification, effacement, limitation, opposition et portabilité : écrivez à ','Access, rectification, erasure, restriction, objection and portability: write to ')}{mail(t)}{t('. L’effacement révoque la licence. Vous pouvez aussi saisir la CNIL (cnil.fr).','. Erasure revokes the licence. You can also lodge a complaint with the CNIL (cnil.fr).')}</p>
  </article>;
}

function Terms({t,language}){
  return <article className="legal-text">
    <p>{t('Ces conditions s’appliquent à la bêta gratuite de N’Der (« le Logiciel ») : les plugins pour Houdini, Blender et Assimilate SCRATCH / Live FX, et le gestionnaire N’Der. En demandant une clé de licence, vous les acceptez.','These terms apply to the free beta of N’Der (“the Software”): the plugins for Houdini, Blender and Assimilate SCRATCH / Live FX, and the N’Der manager. By requesting a licence key you accept them.')}</p>
    <h2>{t('1. Licence','1. Licence')}</h2>
    <p>{t(`${COMPANY.name} vous accorde une licence gratuite, personnelle, non exclusive et non transférable d’utilisation du Logiciel, sous forme compilée uniquement, sur le nombre de machines indiqué dans votre licence, jusqu’au ${until(t,language)}. Vous pouvez l’utiliser pour tout projet, y compris commercial.`,`${COMPANY.name} grants you a free, personal, non-exclusive, non-transferable licence to use the Software, in compiled form only, on the number of machines stated in your licence, until ${until(t,language)}. You may use it for any project, including commercial ones.`)}</p>
    <h2>{t('2. Ce que vous ne pouvez pas faire','2. What you may not do')}</h2>
    <ul>
      <li>{t('Distribuer, louer, prêter ou revendre le Logiciel ou votre clé.','Distribute, rent, lend or resell the Software or your key.')}</li>
      <li>{t('Contourner ou désactiver la vérification de licence.','Circumvent or disable the licence check.')}</li>
      <li>{t('Décompiler ou désassembler le Logiciel, sauf dans les cas où la loi l’autorise expressément (article L122-6-1 du Code de la propriété intellectuelle).','Decompile or disassemble the Software, except where the law expressly allows it (article L122-6-1 of the French Intellectual Property Code).')}</li>
    </ul>
    <h2>{t('3. Vos images','3. Your pictures')}</h2>
    <p>{t('Les images et fichiers que vous produisez avec le Logiciel vous appartiennent. N’Break ne revendique aucun droit dessus et n’y a pas accès.','The pictures and files you make with the Software are yours. N’Break claims no rights to them and has no access to them.')}</p>
    <h2>{t('4. Une bêta','4. A beta')}</h2>
    <p>{t('Le Logiciel est en développement : il peut contenir des erreurs, changer, ou perdre des fonctions. La bêta peut prendre fin plus tôt ; nous vous prévenons alors par e-mail au moins 30 jours avant. Le tarif après la bêta sera annoncé avant sa fin ; rien ne devient payant sans votre accord. Sans licence valide, le Logiciel continue de rendre, avec des bandes grises sur l’image.','The Software is in development: it may contain errors, change, or lose features. The beta may end early; if so we tell you by email at least 30 days before. Pricing after the beta will be announced before it ends; nothing becomes paid without your agreement. Without a valid licence, the Software still renders, with grey bands across the picture.')}</p>
    <h2>{t('5. Composants tiers','5. Third-party components')}</h2>
    <p>{t('Le Logiciel contient des composants de tiers (dont NVIDIA DLSS), soumis à leurs propres licences, listées dans le fichier THIRD_PARTY_NOTICES fourni avec chaque version.','The Software contains third-party components (including NVIDIA DLSS), under their own licences, listed in the THIRD_PARTY_NOTICES file shipped with every build.')}</p>
    <h2>{t('6. Garantie et responsabilité','6. Warranty and liability')}</h2>
    <p>{t('Le Logiciel est fourni gratuitement, « en l’état », sans garantie d’aucune sorte, dans la mesure permise par la loi. N’Break n’est pas responsable des dommages indirects (perte de données, de production ou de revenus). Gardez des sauvegardes de vos projets. Rien ici n’exclut une responsabilité que la loi interdit d’exclure.','The Software is provided free of charge, “as is”, without warranty of any kind, to the extent the law allows. N’Break is not liable for indirect damage (loss of data, production or revenue). Keep backups of your projects. Nothing here excludes a liability the law does not allow to be excluded.')}</p>
    <h2>{t('7. Fin de la licence','7. End of the licence')}</h2>
    <p>{t('La licence prend fin à sa date d’échéance, si vous ne respectez pas ces conditions (N’Break peut alors révoquer la clé), ou à votre demande.','The licence ends on its expiry date, if you break these terms (N’Break may then revoke the key), or when you ask.')}</p>
    <h2>{t('8. Données personnelles','8. Personal data')}</h2>
    <p>{t('Voir la ','See the ')}<a href="/privacy/">{t('politique de confidentialité','privacy notice')}</a>.</p>
    <h2>{t('9. Droit applicable','9. Governing law')}</h2>
    <p>{t(`Droit français. En cas de litige, et après une tentative de solution amiable, les tribunaux de ${f(COMPANY.courts,t)} sont compétents, sauf règle impérative contraire.`,`French law. In a dispute, after an attempt to settle it amicably, the courts of ${f(COMPANY.courts,t)} have jurisdiction, unless a mandatory rule says otherwise.`)}</p>
    <p>{t('Contact : ','Contact: ')}{mail(t)}</p>
  </article>;
}

const PAGES={
  '/legal/':{eyebrow:['INFORMATIONS LÉGALES','LEGAL'],title:['Mentions légales.','Legal notice.'],Body:Legal},
  '/privacy/':{eyebrow:['DONNÉES PERSONNELLES','PERSONAL DATA'],title:['Confidentialité.','Privacy.'],Body:Privacy},
  '/n-der/terms/':{eyebrow:['N’DER · BÊTA','N’DER · BETA'],title:['Conditions de la bêta.','Beta terms.'],Body:Terms},
};

function App(){
  const {language,setLanguage,t}=useLanguage();
  const reduced=useReducedMotion();
  const path=window.location.pathname.replace(/\/?$/,'/');
  const page=PAGES[path]||PAGES['/legal/'];
  usePageMeta(`${t(...page.title).replace(/\.$/,'')} — N’Break`,t(...page.title));
  return <NBrainProvider theme="dark" glow={.5} motion={!reduced}>
    <SimplePage t={t} language={language} setLanguage={setLanguage} eyebrow={t(...page.eyebrow)} title={t(...page.title)} current={path.startsWith('/n-der/')?'nder':undefined}>
      <page.Body t={t} language={language}/>
    </SimplePage>
  </NBrainProvider>;
}

createRoot(document.getElementById('root')).render(<App/>);
