// ─── N'Der release state ─────────────────────────────────────────────────────
// The ONE place to change when the beta opens, a platform ships or the price changes.
// Every page reads it; nothing else hard-codes availability.
//
//   stage        'soon'  — announced, the button asks for early access (contact)
//                'beta'  — free beta open: the button goes to signupUrl
//                'paid'  — pricing live: the button goes to signupUrl, the price line shows `price`
//   signupUrl    where the beta button goes: the site's own form (/nder/beta/)
//   apiUrl       the licence server (nder-server, rdonnot/nder_application): POST /v1/signup,
//                POST /v1/signup/confirm, GET /v1/manager. The SAME host is compiled into the manager.
//   betaUntil    the end date of free-beta licences (must match the server's NDER_SIGNUP_UNTIL)
//   platforms    status per OS: 'ready' | 'soon'
//   hosts        status per host application: 'ready' | 'soon'
//
// scripts/check-release.mjs fails the build when an open stage lacks any of these or COMPANY below.

export const NDER = {
  stage: 'soon',
  signupUrl: '/nder/beta/',
  apiUrl: 'https://licence.n-break.com',
  betaUntil: '', // 'YYYY-MM-DD'
  betaSeats: 2,   // machines per free-beta licence (must match the server's NDER_SIGNUP_SEATS)
  price: null, // e.g. {fr: '29 € / mois', en: '€29 / month'} once stage is 'paid'
  platforms: {windows: 'soon', linux: 'soon', macos: 'soon'},
  hosts: {houdini: 'soon', blender: 'soon', assimilate: 'soon'},
};

// ─── Publisher identity (mentions légales, terms, privacy) ─────────────────
// Required by French law on a commercial site (LCEN art. 6) and named in the terms and the privacy notice.
// Fill every field before the beta opens: the build refuses an open stage with an empty one.
export const COMPANY = {
  name: 'N’Break',
  legalForm: '',      // e.g. 'SASU au capital de 1 000 €'
  address: '',        // registered office
  registration: '',   // e.g. 'RCS Paris 123 456 789'
  vat: '',            // intra-EU VAT number, if any
  publisher: 'Romain Donnot', // directeur de la publication
  email: '',          // contact + data-protection requests
  courts: '',         // e.g. 'Paris' (terms: competent courts)
};

// Hosting provider (mentions légales). The website and the licence server both run there.
export const HOST = 'Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen, Allemagne / Germany';
