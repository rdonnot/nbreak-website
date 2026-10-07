/** src/components/ui/backgrounds/physarum/presets.ts
 *
 * Presets for PhysarumBackground, each a port of one of Domenico Brz's
 * Physarum experiments (github.com/Domenicobrz/Physarum-experiments, MIT).
 * The folder number in that repo is noted on each preset. The originals were
 * one copy of the shaders per experiment with the constants edited in place;
 * here the shaders are shared and the constants are uniforms.
 *
 * Kept tiny and free of three.js on purpose: the landing page's picker imports
 * this eagerly for the labels, while the engine itself loads on demand.
 */

export interface FluidPreset {
  /** Push of the fluid velocity on a particle's heading (orig 0.0088). */
  push: number;
  /** How strongly dye keeps trails alive: decay = min(0.8, 1 - exp(-|dye| * k)). */
  dyeDecay: number;
  /** Share of the dye added straight into the trail map each step (orig 0.0035). */
  dyeDeposit: number;
  /** Velocity → display tint (orig 0.007) — the pink/green cast of the vortex. */
  tint: number;
  /** Vorticity confinement (orig CURL 25). */
  curl: number;
}

export interface PhysarumPreset {
  label: string;
  /** Particle texture side; particle count = size². */
  textureSize: number;

  /** Sensor distance ahead of the particle, px; ± jitter per particle. */
  senseLength: number;
  senseLengthJitter: number;
  /** Sensor half-angle, radians; ± jitter per particle. */
  senseAngle: number;
  senseAngleJitter: number;
  /** Two particles in three swing their sensors with time (exp. 15). */
  swingAngle: number;
  swingLength: number;
  swingRate: number;

  /** Distance moved per step, px; ± jitter per particle. */
  moveStep: number;
  moveStepJitter: number;
  /** Extra px per unit of trail found ahead — dense veins run faster. */
  densitySpeed: number;
  /** Per-particle constant turn, radians per step (exp. 15). */
  wobble: number;

  /** 3×3 blur kernel of the trail map. */
  blur: "box" | "gaussian";
  /** mix(blurred, unblurred, keep): 1 = no blur at all. */
  blurKeep: number;
  /** Blur + decay passes per step. */
  blurPasses: number;
  /** Trail multiplier per pass. */
  decay: number;
  /** Extra fade on dense trails: each pass also multiplies by exp(-trail × this). */
  densityDecay: number;

  /** Display: 1 - exp(-trail * exposure). */
  exposure: number;
  /** Trail tint; dense trails bloom to white whatever the tint. */
  color: [number, number, number];

  /** Initial particles: anywhere, or in a disc around the centre heading out. */
  seed: "screen" | "disc";
  discRadius: number;
  /** A circular wall around the centre, as a share of half the screen's
   *  shorter side (1 = touches top and bottom); agents turn back at its rim.
   *  CIRCLE_OFF or more = no wall. */
  circle: number;

  /** The shaders' `uTime` = timeBase + seconds × timeRate. */
  timeBase: number;
  timeRate: number;

  fluid?: FluidPreset;
}

const BASE: PhysarumPreset = {
  label: "",
  textureSize: 1024,
  senseLength: 15.7,
  senseLengthJitter: 0,
  senseAngle: 0.4,
  senseAngleJitter: 0,
  swingAngle: 0,
  swingLength: 0,
  swingRate: 0,
  moveStep: 1,
  moveStepJitter: 0,
  densitySpeed: 0,
  wobble: 0,
  blur: "box",
  blurKeep: 0,
  blurPasses: 1,
  decay: 0.975,
  densityDecay: 0,
  exposure: 0.05,
  color: [1, 1, 1],
  seed: "screen",
  discRadius: 300,
  circle: 1.6,
  timeBase: 0,
  timeRate: 1,
};

/** Circle size at which there is no circle — the right end of its slider. */
export const CIRCLE_OFF = 1.6;

/** The original ran decay on length(vec4 trail), i.e. √3 × the one channel used here. */
const SQRT3 = Math.sqrt(3);

export const PHYSARUM_PRESETS = {
  /** Exp. 1 — long sensors, ten blur passes a step: thick, soft veins. */
  "physarum-veins": {
    ...BASE,
    label: "Physarum · Veins",
    senseLength: 30.7,
    senseAngle: 0.5,
    senseAngleJitter: 0.5,
    moveStep: 1.5,
    moveStepJitter: 0.35,
    blurPasses: 10,
  },
  /** Exp. 2 — short sensors, gaussian blur: a fine, busy network. */
  "physarum-network": {
    ...BASE,
    label: "Physarum · Network",
    senseAngle: 0.15,
    senseAngleJitter: 0.5,
    moveStep: 1,
    moveStepJitter: 0.35,
    blur: "gaussian",
    color: [0.45, 0.66, 1],
  },
  /** Exp. 3 — fixed sensors, fast decay: a mesh of cells. */
  "physarum-cells": {
    ...BASE,
    label: "Physarum · Cells",
    senseLength: 25.7,
    blurKeep: 0.9,
    decay: 0.85,
  },
  /** Exp. 4 — grows out of a disc; dense veins run faster and fade faster. */
  "physarum-bloom": {
    ...BASE,
    label: "Physarum · Bloom",
    senseLength: 25.7,
    senseLengthJitter: 2.35,
    senseAngle: 0.4,
    senseAngleJitter: 0.1,
    moveStep: 0.1,
    moveStepJitter: 0.035,
    densitySpeed: 0.075,
    blurKeep: 0.98,
    decay: 1,
    densityDecay: 0.007 * SQRT3,
    exposure: 0.15,
    seed: "disc",
    // Left alone it grows until it wraps and fills the page; a dish keeps it
    // a circle in the centre.
    circle: 0.9,
    color: [0.7, 0.9, 1],
  },
  /** Exp. 5 — exp. 4 with shorter, narrower sensors: hair-thin filaments.
   *  Seeded across the screen, not in a disc: from a disc it grows the same
   *  ring as Bloom and the two are hard to tell apart. */
  "physarum-filaments": {
    ...BASE,
    label: "Physarum · Filaments",
    senseLength: 15.7,
    senseLengthJitter: 2.35,
    senseAngle: Math.PI / 8,
    moveStep: 0.1,
    moveStepJitter: 0.035,
    densitySpeed: 0.075,
    blurKeep: 0.98,
    decay: 1,
    densityDecay: 0.007 * SQRT3,
    exposure: 0.15,
  },
  /** Exp. 15 — coupled to a fluid sim: trails live only where dye flows. The
   *  repo's screenshot. The original moved only while the mouse was dragged;
   *  here a ghost pointer keeps a vortex turning and the mouse adds to it. */
  "physarum-vortex": {
    ...BASE,
    label: "Physarum · Vortex",
    senseLength: 3.2,
    senseLengthJitter: 2.35,
    senseAngle: (Math.PI / 4) * 0.65,
    swingAngle: 3,
    swingLength: 4,
    swingRate: 0.37,
    moveStep: 1.3,
    moveStepJitter: 0.455,
    densitySpeed: 0.195,
    wobble: 0.2,
    blurKeep: 1,
    decay: 1, // trails live on dye alone, as in the original
    exposure: 0.15,
    // The original's uTime was a scene number (6.5 … 23) switched from the
    // keyboard. A slow drift walks through those scenes instead.
    timeBase: 6.5,
    timeRate: 0.02,
    fluid: { push: 0.0088, dyeDecay: 30.1, dyeDeposit: 0.0035, tint: 0.007, curl: 25 },
  },
} satisfies Record<string, PhysarumPreset>;

export type PhysarumPresetId = keyof typeof PHYSARUM_PRESETS;

/**
 * What an admin can tune (backgrounds/registry.ts has the sliders): the
 * preset's own numbers, plus a few knobs that are not preset fields. Read
 * every frame, so all of it is live except `textureSize` (rebuilds) and the
 * seed settings (`seed`, `discRadius` — they apply on Restart).
 */
export interface PhysarumLook {
  /** Sim steps per 60 Hz frame: 0.5 = half speed, 2 = double. */
  speed: number;
  /** Multiplies the preset's exposure. */
  brightness: number;
  color: [number, number, number];
  circle: number;
  textureSize: number;
  moveStep: number;
  moveStepJitter: number;
  densitySpeed: number;
  wobble: number;
  senseLength: number;
  senseLengthJitter: number;
  senseAngle: number;
  senseAngleJitter: number;
  swingAngle: number;
  swingLength: number;
  swingRate: number;
  blurKeep: number;
  blurPasses: number;
  decay: number;
  densityDecay: number;
  /** 0 = whole screen, 1 = disc in the centre (numbers only: it is stored). */
  seed: number;
  discRadius: number;
  /** Vortex only: fluid push on headings, vorticity, dye hold, ghost stirring. */
  push: number;
  curl: number;
  dyeDecay: number;
  stir: number;
}

/** A preset's look before anyone touches it. */
export function presetLook(p: PhysarumPreset): PhysarumLook {
  return {
    speed: 1,
    brightness: 1,
    stir: 1,
    color: [...p.color] as [number, number, number],
    circle: p.circle,
    textureSize: p.textureSize,
    moveStep: p.moveStep,
    moveStepJitter: p.moveStepJitter,
    densitySpeed: p.densitySpeed,
    wobble: p.wobble,
    senseLength: p.senseLength,
    senseLengthJitter: p.senseLengthJitter,
    senseAngle: p.senseAngle,
    senseAngleJitter: p.senseAngleJitter,
    swingAngle: p.swingAngle,
    swingLength: p.swingLength,
    swingRate: p.swingRate,
    blurKeep: p.blurKeep,
    blurPasses: p.blurPasses,
    decay: p.decay,
    densityDecay: p.densityDecay,
    seed: p.seed === "disc" ? 1 : 0,
    discRadius: p.discRadius,
    push: p.fluid?.push ?? 0,
    curl: p.fluid?.curl ?? 0,
    dyeDecay: p.fluid?.dyeDecay ?? 0,
  };
}
