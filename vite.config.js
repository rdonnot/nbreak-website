import {defineConfig} from 'vite';
// One entry per page; nginx serves /<page>/ from <page>/index.html.
const pages={main:'index.html',nder:'nder/index.html',beta:'nder/beta/index.html',welcome:'nder/welcome/index.html',download:'nder/download/index.html',terms:'nder/terms/index.html',legal:'legal/index.html',privacy:'privacy/index.html'};
export default defineConfig({esbuild:{jsx:'automatic'},build:{outDir:'dist',emptyOutDir:true,rollupOptions:{input:pages}}});
