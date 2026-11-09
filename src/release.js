// ─── N'Der release state ─────────────────────────────────────────────────────
// The ONE place to change when the beta opens, a platform ships or the price changes.
// Both pages (home and /nder/) read it; nothing else hard-codes availability.
//
//   stage        'soon'  — announced, the button asks for early access (contact)
//                'beta'  — free beta open: the button goes to signupUrl
//                'paid'  — pricing live: the button goes to signupUrl, the price line shows `price`
//   signupUrl    account creation + the N'Der manager download (required for 'beta' and 'paid';
//                scripts/check-release.mjs fails the build if it is missing)
//   platforms    status per OS: 'ready' | 'soon'
//   hosts        status per host application: 'ready' | 'soon'

export const NDER = {
  stage: 'soon',
  signupUrl: '',
  price: null, // e.g. {fr: '29 € / mois', en: '€29 / month'} once stage is 'paid'
  platforms: {windows: 'soon', linux: 'soon', macos: 'soon'},
  hosts: {houdini: 'soon', blender: 'soon', assimilate: 'soon'},
};
