import {defineConfig} from 'vite';
export default defineConfig({esbuild:{jsx:'automatic'},build:{outDir:'dist',emptyOutDir:true,rollupOptions:{input:{main:'index.html',brochure:'brochure/index.html'}}}});
