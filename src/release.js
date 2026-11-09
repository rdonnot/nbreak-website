// ─── N'Der release state ─────────────────────────────────────────────────────
// The ONE place to change when the beta opens, a platform ships or the price changes.
// Every page reads it; nothing else hard-codes availability.
//
//   stage        'soon'  — announced, the button asks for early access (contact)
//                'beta'  — free beta open: the button goes to signupUrl
//                'paid'  — pricing live: the button goes to signupUrl, the price line shows `price`
//   signupUrl    where the beta button goes: the site's own form (/n-der/beta/)
//   apiUrl       the licence server (nder-server, rdonnot/nder_application): POST /v1/signup,
//                POST /v1/signup/confirm, GET /v1/manager. The SAME host is compiled into the manager.
//   betaUntil    the end date of free-beta licences (must match the server's NDER_SIGNUP_UNTIL), or ''
//   betaDays     … else each licence lasts this many days from sign-up (the server's NDER_SIGNUP_DAYS)
//   hostVersions the exact host builds the published plugins load in (a Houdini build loads only in its own version)
//   platforms    status per OS: 'ready' | 'soon'
//   hosts        status per host application: 'ready' | 'soon'
//
// scripts/check-release.mjs fails the build when an open stage lacks any of these or COMPANY below.

export const NDER = {
  stage: 'beta',
  signupUrl: '/n-der/beta/',
  apiUrl: 'https://licence.n-break.com',
  betaUntil: '', // 'YYYY-MM-DD'
  betaDays: 90,
  hostVersions: {houdini: {windows: '22.0.429', linux: '22.0.466'}, blender: '5.2', assimilate: 'SCRATCH 12.1'},
  betaSeats: 2,   // machines per free-beta licence (must match the server's NDER_SIGNUP_SEATS)
  price: null, // e.g. {fr: '29 € / mois', en: '€29 / month'} once stage is 'paid'
  platforms: {windows: 'ready', linux: 'ready', macos: 'soon'},
  hosts: {houdini: 'ready', blender: 'ready', assimilate: 'ready'},
};

// ─── Publisher identity (mentions légales, terms, privacy) ─────────────────
// Required by French law on a commercial site (LCEN art. 6) and named in the terms and the privacy notice.
// Fill every field before the beta opens: the build refuses an open stage with an empty one.
export const COMPANY = {
  name: 'N’Break',
  legalForm: 'SAS',   // registry (recherche-entreprises.api.gouv.fr, 2026-11-09); LCEN also wants the share capital: 'SAS au capital de … €'
  address: '2 rue Jules Michelet, 70000 Navenne, France', // registered office (siège, SIRET 832 601 413 00020)
  registration: 'SIREN 832 601 413 — RCS Vesoul',
  vat: '',            // intra-EU VAT number, if any
  publisher: 'Romain Donnot', // directeur de la publication
  email: 'nder@n-break.com', // contact + data-protection requests
  courts: 'Vesoul',   // terms: competent courts (the registered office's)
};

// Hosting provider (mentions légales). The website and the licence server both run there.
export const HOST = 'Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen, Allemagne / Germany';
