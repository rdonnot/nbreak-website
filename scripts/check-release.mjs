// Fails the build when src/release.js would publish a broken N'Der page:
// an open beta (or paid stage) with no signup URL, or a paid stage with no price.
import {NDER} from '../src/release.js';
const errors=[];
if(!['soon','beta','paid'].includes(NDER.stage))errors.push(`stage must be soon | beta | paid, not "${NDER.stage}"`);
if(NDER.stage!=='soon'&&!/^https:\/\//.test(NDER.signupUrl))errors.push(`stage "${NDER.stage}" needs an https signupUrl`);
if(NDER.stage==='paid'&&!(NDER.price&&NDER.price.fr&&NDER.price.en))errors.push('stage "paid" needs price.fr and price.en');
for(const [group,values] of Object.entries({platforms:NDER.platforms,hosts:NDER.hosts}))
  for(const [k,v] of Object.entries(values))if(!['ready','soon'].includes(v))errors.push(`${group}.${k} must be ready | soon, not "${v}"`);
if(errors.length){console.error('release.js:\n  '+errors.join('\n  '));process.exit(1)}
console.log(`release.js: N'Der stage "${NDER.stage}"`);
