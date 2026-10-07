// Seastorm's tunables. Data only, so the sign-in settings can read the defaults without loading three.js.

export interface SeastormParams {
  /** Global velocity multiplier. 1 = original speed. */
  speed: number;
  /** How fast the flow field itself evolves per frame (original: 0.01). */
  flowSpeed: number;
  /** Opacity of the black fade plane per frame. Lower = longer trails. */
  trailFade: number;
  /** Target particle alpha (additive). Original: 0.19. */
  alpha: number;
  /** Scale of the flow-field noise. Higher = more, tighter currents. */
  flowDetail: number;
  /** Steering strength toward the screen center (0 = off). */
  centerPull: number;
  /** Particle color, RGB in 0–1. */
  color: [number, number, number];
  /** Simulation texture side; particle count = size². Rebuilds on change. */
  textureSize: number;
}

export const SEASTORM_DEFAULTS: SeastormParams = {
  speed: 0.5,
  flowSpeed: 0.01,
  trailFade: 0.05,
  alpha: 0.19,
  flowDetail: 1,
  centerPull: 0.3,
  color: [0.23, 0.51, 0.96], // #3b82f6 — app accent blue
  textureSize: 640,
};
