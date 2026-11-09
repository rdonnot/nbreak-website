# N’Break website

Company website with a short N’Brain product announcement. French and English,
responsive layout, shader background, subtle parallax and N’Brain UI components.

## Run locally

Use Node.js 24 and npm.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite.

## Build and preview

```bash
npm run build
npm run preview
```

Deploy the generated `dist/` directory to a static website host.

## Edit the website

- `src/main.jsx`: home page — company copy, the N’Brain products (N’Brain app, N’Der), contact.
- `src/nder.jsx` + `nder/index.html`: the N’Der product page at `/nder/`.
- `src/release.js`: **N’Der availability in one place** — `stage` (`soon` → early-access button, `beta` → free-beta signup,
  `paid` → price line), `signupUrl`, and `ready`/`soon` per platform and host. `npm run build` runs
  `scripts/check-release.mjs` first and fails on an open stage without an https `signupUrl` or a paid stage without a price.
- `src/site.jsx`: shared header, footer, language and motion helpers.
- `public/nder/`: N’Der page images (rendered in N’Der).
- `site.css`: layout, colours, typography and parallax.
- `src/backgrounds/`: supplied Three.js simulations and local support helpers.
- `vendor/nbrain-ui/`: bundled UI library source, pinned by `UPSTREAM_COMMIT`.
- `scripts/library-styles.mjs`: generates library CSS before building.
- `public/favicon.svg`: website icon.

The product button links to contact until you add a new N’Brain product URL.
Contact currently links to Romain Donnot’s LinkedIn profile.
Language choice is stored in the visitor’s browser. Reduced-motion preferences disable animation.

## Create your GitHub repository

Create an empty repository, then run these commands inside this extracted folder:

```bash
git init
git add .
git commit -m "Initial N’Break website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the example URL with your repository URL.
For GitHub Pages at a project URL, configure Vite’s `base` to your repository path
(e.g. `/nbreak-website/`) before building. For a custom domain, keep the default base.

## Licenses

N’Brain UI retains its ownership notice in `vendor/nbrain-ui/LICENSE`.
Shader licenses are retained in `src/backgrounds/physarum/LICENSE.txt`.
Font licenses are retained under `vendor/nbrain-ui/FONT-LICENSES/`.
No new open-source license is assigned to the website.

The ZIP excludes dependencies, build output, temporary files, Git history,
credentials and the ChatGPT Sites project identity.
