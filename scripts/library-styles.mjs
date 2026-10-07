import {spawnSync} from 'node:child_process';
import {copyFileSync} from 'node:fs';
const r=spawnSync(process.execPath,['build-styles.mjs'],{cwd:'vendor/nbrain-ui',stdio:'inherit'});if(r.status)process.exit(r.status);copyFileSync('vendor/nbrain-ui/.build/styles.css','vendor/nbrain-ui/styles.css');
