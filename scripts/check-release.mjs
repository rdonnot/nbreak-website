// Fails the build when src/release.js would publish a broken or unlawful N'Der page:
// an open stage (beta | paid) without its signup form, licence server, beta end date or publisher identity,
// or a paid stage with no price.
import {NDER,COMPANY} from '../src/release.js';
const errors=[];
if(!['soon','beta','paid'].includes(NDER.stage))errors.push(`stage must be soon | beta | paid, not "${NDER.stage}"`);
for(const [group,values] of Object.entries({platforms:NDER.platforms,hosts:NDER.hosts}))
  for(const [k,v] of Object.entries(values))if(!['ready','soon'].includes(v))errors.push(`${group}.${k} must be ready | soon, not "${v}"`);
if(NDER.stage!=='soon'){
  if(!/^(https:\/\/|\/)/.test(NDER.signupUrl))errors.push(`stage "${NDER.stage}" needs a signupUrl (https or a site path)`);
  if(!/^https:\/\/[^/]+$/.test(NDER.apiUrl))errors.push(`stage "${NDER.stage}" needs apiUrl = https://host (no trailing slash)`);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(NDER.betaUntil)&&!(NDER.betaDays>0))errors.push(`stage "${NDER.stage}" needs betaUntil YYYY-MM-DD or betaDays`);
  for(const k of ['legalForm','address','registration','email','courts'])if(!COMPANY[k])errors.push(`COMPANY.${k} is empty (mentions légales / terms / privacy)`);
  if(!Object.values(NDER.platforms).includes('ready'))errors.push('an open stage needs at least one platform "ready"');
  if(!Object.values(NDER.hosts).includes('ready'))errors.push('an open stage needs at least one host "ready"');
}
if(NDER.stage==='paid'&&!(NDER.price&&NDER.price.fr&&NDER.price.en))errors.push('stage "paid" needs price.fr and price.en');
if(errors.length){console.error('release.js:\n  '+errors.join('\n  '));process.exit(1)}
console.log(`release.js: N'Der stage "${NDER.stage}"`);
