import {defineConfig} from 'vite';
// One entry per page; nginx serves /<page>/ from <page>/index.html.
const pages={main:'index.html',nder:'n-der/index.html',beta:'n-der/beta/index.html',welcome:'n-der/welcome/index.html',download:'n-der/download/index.html',terms:'n-der/terms/index.html',legal:'legal/index.html',privacy:'privacy/index.html'};
export default defineConfig({esbuild:{jsx:'automatic'},build:{outDir:'dist',emptyOutDir:true,rollupOptions:{input:pages}}});
