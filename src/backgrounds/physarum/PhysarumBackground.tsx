/** src/components/ui/backgrounds/physarum/PhysarumBackground.tsx
 *
 * Physarum (slime mould) transport network — Jeff Jones' agent model, as
 * explored in Domenico Brz's Physarum-experiments (MIT, see LICENSE.txt here).
 * One engine; the look comes from a preset (presets.ts).
 *
 * Every step:
 *   1. sense + move — a full-screen pass over the agent texture, one texel
 *      per agent (xy = position in px, zw = heading). Each agent samples the
 *      trail map at three sensors ahead, turns toward the strongest and moves.
 *   2. deposit — every agent drawn as a 1 px point, additively, into the
 *      trail map.
 *   3. blur + decay — the trail map diffuses and fades.
 *   4. display — trail → 1 - exp(-trail × exposure), tinted.
 * The Vortex preset adds a fluid sim (fluid.ts): its velocity pushes the
 * agents, and trails survive only where its dye flows.
 *
 * The sim runs in CSS pixels (1 trail texel = 1 px) and steps at 60 a second
 * whatever the display refresh (frameCap.ts), times the `speed` setting.
 *
 * `look` holds the admin-tunable settings (see presets.ts → PhysarumLook). It
 * is read every frame, so sliders apply live; `textureSize` rebuilds, and the
 * seed settings apply when the parent remounts it (the panel's Restart).
 */

import { useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { runCappedLoop, LANDING_MAX_FPS } from "../frameCap";
import { createLandingInput } from "../landingInput";
import { densityScaledSize } from "../density";
import type { MotionState } from "../deviceMotion";
import { FluidSim, FLUID_DEFAULTS } from "./fluid";
import { CIRCLE_OFF, presetLook, type PhysarumLook, type PhysarumPreset } from "./presets";

const STEP_DT = 1 / LANDING_MAX_FPS;

// ── GLSL ─────────────────────────────────────────────────────────────────────

const quadVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const copyFrag = /* glsl */ `
  uniform sampler2D uTexture;
  varying vec2 vUv;
  void main() {
    gl_FragColor = texture2D(uTexture, vUv);
  }
`;

const senseMoveFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uAgents;
  uniform sampler2D uTrail;
  uniform sampler2D uFluidVelocity;
  uniform vec2 uScreen;
  uniform float uTime;
  uniform float uSenseLength;
  uniform float uSenseLengthJitter;
  uniform float uSenseAngle;
  uniform float uSenseAngleJitter;
  uniform float uSwingAngle;
  uniform float uSwingLength;
  uniform float uSwingRate;
  uniform float uMoveStep;
  uniform float uMoveStepJitter;
  uniform float uDensitySpeed;
  uniform float uWobble;
  uniform float uFluidPush;
  uniform vec2 uCenter;
  uniform float uCircle;
  uniform vec2 uPointer;      // px; mouse or device tilt
  uniform float uPointerForce; // 0 until real input arrives
  varying vec2 vUv;

  vec2 rotate(vec2 v, float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c) * v;
  }

  float trailAt(vec2 p) {
    return texture2D(uTrail, mod(p, uScreen) / uScreen).x;
  }

  void main() {
    // The agent's texel index seeds its jitter, as in the original.
    vec2 index = floor(gl_FragCoord.xy);
    vec4 agent = texture2D(uAgents, vUv);
    vec2 pos = agent.xy;
    vec2 dir = normalize(agent.zw);

    float senseLength = uSenseLength + sin(index.x * 0.757) * uSenseLengthJitter;
    float senseAngle = uSenseAngle + sin(index.x) * uSenseAngleJitter;
    if (sin(index.x) > -0.5) {
      senseAngle += sin(uTime * uSwingRate) * uSwingAngle;
      senseLength += cos(uTime * uSwingRate) * uSwingLength;
    }

    vec2 lDir = rotate(dir, senseAngle);
    vec2 rDir = rotate(dir, -senseAngle);
    float c = trailAt(pos + dir * senseLength);
    float l = trailAt(pos + lDir * senseLength);
    float r = trailAt(pos + rDir * senseLength);

    vec2 newDir = dir;
    float best = c;
    if (l > best) { newDir = lDir; best = l; }
    if (r > best) { newDir = rDir; best = r; }
    // Left and right tie above the centre: pick a side, per agent and over time.
    if (r == l && r > c) newDir = fract(index.x * 0.3242 + uTime) > 0.5 ? rDir : lDir;

    // Dense trail ahead → a faster agent.
    float stepLength = uMoveStep + sin(index.x * 0.333) * uMoveStepJitter + best * uDensitySpeed;

    newDir = rotate(newDir, sin(uTime + index.x) * uWobble);
    newDir += texture2D(uFluidVelocity, pos / uScreen).xy * uFluidPush;
    // Agents near the pointer bend toward it and curl around it.
    vec2 toP = uPointer - pos;
    float dP = length(toP);
    float fall = uPointerForce * exp(-dP / (0.15 * uScreen.y));
    vec2 nP = toP / max(dP, 1e-6);
    // Bend the heading but keep its length: the fluid push scales it, and the
    // step length is part of each preset's pattern.
    vec2 bent = newDir + (nP * 0.8 + vec2(-nP.y, nP.x)) * fall * 1.2;
    newDir = bent * (length(newDir) / max(length(bent), 1e-6));

    vec2 next = pos + newDir * stepLength;
    // Petri dish: an agent about to cross the rim bounces back in; one that is
    // already outside (the circle just shrank) heads for the centre.
    if (uCircle > 0.0) {
      vec2 away = next - uCenter; // not "out": a reserved word in GLSL ES 3.00
      if (dot(away, away) > uCircle * uCircle) {
        vec2 n = normalize(away);
        newDir = length(pos - uCenter) > uCircle ? -n : reflect(normalize(newDir), n);
        next = pos + newDir * stepLength;
      }
    }

    gl_FragColor = vec4(mod(next, uScreen), newDir);
  }
`;

// `position` carries the agent's UV in the agent texture, not a place in space.
const depositVertex = /* glsl */ `
  uniform sampler2D uAgents;
  uniform vec2 uScreen;
  void main() {
    vec2 pos = texture2D(uAgents, position.xy).xy;
    gl_PointSize = 1.0;
    gl_Position = vec4(pos / uScreen * 2.0 - 1.0, 0.0, 1.0);
  }
`;

const depositFrag = /* glsl */ `
  void main() {
    gl_FragColor = vec4(1.0);
  }
`;

const dyeDepositFrag = /* glsl */ `
  uniform sampler2D uDye;
  uniform float uAmount;
  varying vec2 vUv;
  void main() {
    gl_FragColor = vec4(texture2D(uDye, vUv).x * uAmount, 0.0, 0.0, 0.0);
  }
`;

const blurDecayFrag = /* glsl */ `
  uniform sampler2D uTrail;
  uniform sampler2D uDye;
  uniform vec2 uTexel;
  uniform float uGaussian;
  uniform float uBlurKeep;
  uniform float uDecay;
  uniform float uDensityDecay;
  uniform float uDyeDecay;
  varying vec2 vUv;

  void main() {
    float sum = 0.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        float w = uGaussian > 0.5
          ? (x == 0 ? 2.0 : 1.0) * (y == 0 ? 2.0 : 1.0) / 16.0
          : 1.0 / 9.0;
        sum += texture2D(uTrail, vUv + vec2(float(x), float(y)) * uTexel).x * w;
      }
    }
    float v = mix(sum, texture2D(uTrail, vUv).x, uBlurKeep);

    // Three fades, multiplied: a flat one, one that bites harder on dense
    // trails, and (Vortex) one that keeps trails only where the fluid has dye.
    float decay = uDecay * exp(-v * uDensityDecay);
    if (uDyeDecay > 0.0) decay *= min(0.8, 1.0 - exp(-length(texture2D(uDye, vUv).rgb) * uDyeDecay));

    gl_FragColor = vec4(v * decay, 0.0, 0.0, 1.0);
  }
`;

const displayFrag = /* glsl */ `
  uniform sampler2D uTrail;
  uniform sampler2D uFluidVelocity;
  uniform float uExposure;
  uniform float uFluidTint;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    float m = 1.0 - exp(-texture2D(uTrail, vUv).x * uExposure);
    // Tinted, with the densest trails blooming to white.
    vec3 col = mix(uColor * m, vec3(m), m * m);
    if (uFluidTint > 0.0) {
      vec3 fv = vec3(texture2D(uFluidVelocity, vUv).xy * uFluidTint + 3.0, 3.0);
      col *= 2.6 * (1.0 - exp(-fv * uExposure));
    }
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────

class PingPong {
  read: THREE.WebGLRenderTarget;
  write: THREE.WebGLRenderTarget;
  constructor(make: () => THREE.WebGLRenderTarget) {
    this.read = make();
    this.write = make();
  }
  swap() {
    [this.read, this.write] = [this.write, this.read];
  }
  setSize(w: number, h: number) {
    this.read.setSize(w, h);
    this.write.setSize(w, h);
  }
  dispose() {
    this.read.dispose();
    this.write.dispose();
  }
}

function floatTarget(
  w: number,
  h: number,
  type: THREE.TextureDataType,
  filter: THREE.MagnificationTextureFilter,
  wrap: THREE.Wrapping
) {
  return new THREE.WebGLRenderTarget(w, h, {
    type,
    format: THREE.RGBAFormat,
    minFilter: filter,
    magFilter: filter,
    wrapS: wrap,
    wrapT: wrap,
    depthBuffer: false,
    stencilBuffer: false,
  });
}

/** Mouse → fluid force, texels/s per UV of travel (orig SPLAT_FORCE). */
const SPLAT_FORCE = 6000;
/** Dye dropped by every pointer splat (orig: normalize(1, .8, .5) × 0.2). */
const POINTER_DYE = new THREE.Vector3(1, 0.8, 0.5).normalize().multiplyScalar(0.2);

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  className?: string;
  preset: PhysarumPreset;
  /** Settings over the preset; unset = the preset's own values. */
  look?: Partial<PhysarumLook>;
  /** Phone tilt / shake (deviceMotion): quickens and swirls the agents while the visitor holds the device. */
  motion?: MutableRefObject<MotionState>;
}

/** More than this many sim steps in one frame is a slideshow, not "faster". */
const MAX_STEPS_PER_FRAME = 4;

export function PhysarumBackground({ className, preset, look, motion }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef(motion);
  motionRef.current = motion;
  const lookRef = useRef(look);
  lookRef.current = look;
  const textureSize = look?.textureSize ?? preset.textureSize;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let w = container.clientWidth || window.innerWidth;
    let h = container.clientHeight || window.innerHeight;

    // The preset's own values under whatever the admin moved. Read per frame.
    const base = presetLook(preset);
    const current = (): PhysarumLook => {
      const l = { ...base, ...lookRef.current };
      const m = motionRef.current?.current;
      if (m?.live) {
        // A shake quickens the agents and brightens the trails (where they are steered is landingInput's).
        l.speed *= 1 + m.energy * 1.5;
        l.brightness *= 1 + m.energy * 0.5;
      }
      return l;
    };

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, depth: false, stencil: false });
    } catch {
      return; // No WebGL — leave whatever static background the parent has.
    }
    // Agents live in float render targets; without them there is nothing to run.
    if (!renderer.extensions.has("EXT_color_buffer_float")) {
      renderer.dispose();
      return;
    }
    renderer.setPixelRatio(1); // 1 trail texel = 1 CSS px, like the original.
    renderer.setSize(w, h);
    renderer.autoClear = false;
    // One object per pass, nothing to sort — and sorting would compute a
    // bounding sphere from the agent points' 2-component "positions" (NaN).
    renderer.sortObjects = false;
    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    container.appendChild(canvas);

    const N = densityScaledSize(textureSize, w, h); // area-scaled: a phone gets what its pixels warrant
    const fluidPreset = preset.fluid;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quadScene = new THREE.Scene();
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    quad.frustumCulled = false;
    quadScene.add(quad);

    const agents = new PingPong(() =>
      floatTarget(N, N, THREE.FloatType, THREE.NearestFilter, THREE.ClampToEdgeWrapping)
    );
    // Half float is enough for trail densities, and unlike 32-bit float it
    // can be blended into without EXT_float_blend.
    const trail = new PingPong(() =>
      floatTarget(w, h, THREE.HalfFloatType, THREE.LinearFilter, THREE.RepeatWrapping)
    );

    const fluid = fluidPreset
      ? new FluidSim(renderer, w, h, { ...FLUID_DEFAULTS, curl: fluidPreset.curl })
      : null;

    const screen = new THREE.Vector2(w, h);
    const center = new THREE.Vector2(w / 2, h / 2);
    const texel = new THREE.Vector2(1 / w, 1 / h);
    /** Circle size (share of half the shorter side) → wall radius in px, 0 = none. */
    const circlePx = (size: number) => (size < CIRCLE_OFF ? (size * Math.min(w, h)) / 2 : 0);
    const tex = () => ({ value: null as THREE.Texture | null });
    const quadMat = (
      fragmentShader: string,
      uniforms: Record<string, THREE.IUniform>,
      extra: Partial<THREE.ShaderMaterialParameters> = {}
    ) =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: quadVertex,
        fragmentShader,
        depthTest: false,
        depthWrite: false,
        ...extra,
      });
    const additive: Partial<THREE.ShaderMaterialParameters> = {
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
    };

    const copyMat = quadMat(copyFrag, { uTexture: tex() });
    const senseMat = quadMat(senseMoveFrag, {
      uAgents: tex(),
      uTrail: tex(),
      uFluidVelocity: tex(),
      uScreen: { value: screen },
      uTime: { value: 0 },
      uSenseLength: { value: preset.senseLength },
      uSenseLengthJitter: { value: preset.senseLengthJitter },
      uSenseAngle: { value: preset.senseAngle },
      uSenseAngleJitter: { value: preset.senseAngleJitter },
      uSwingAngle: { value: preset.swingAngle },
      uSwingLength: { value: preset.swingLength },
      uSwingRate: { value: preset.swingRate },
      uMoveStep: { value: preset.moveStep },
      uMoveStepJitter: { value: preset.moveStepJitter },
      uDensitySpeed: { value: preset.densitySpeed },
      uWobble: { value: preset.wobble },
      uFluidPush: { value: fluidPreset?.push ?? 0 },
      uCenter: { value: center },
      uCircle: { value: 0 },
      uPointer: { value: new THREE.Vector2(-1e5, -1e5) },
      uPointerForce: { value: 0 },
    });
    const dyeDepositMat = quadMat(
      dyeDepositFrag,
      {
        uDye: tex(),
        uAmount: { value: fluidPreset?.dyeDeposit ?? 0 },
      },
      additive
    );
    const blurMat = quadMat(blurDecayFrag, {
      uTrail: tex(),
      uDye: tex(),
      uTexel: { value: texel },
      uGaussian: { value: preset.blur === "gaussian" ? 1 : 0 },
      uBlurKeep: { value: preset.blurKeep },
      uDecay: { value: preset.decay },
      uDensityDecay: { value: preset.densityDecay },
      uDyeDecay: { value: fluidPreset?.dyeDecay ?? 0 },
    });
    const displayMat = quadMat(displayFrag, {
      uTrail: tex(),
      uFluidVelocity: tex(),
      uExposure: { value: preset.exposure },
      uFluidTint: { value: fluidPreset?.tint ?? 0 },
      uColor: { value: new THREE.Vector3(...preset.color) },
    });

    // One point per agent; its "position" is the agent's texel in the agent texture.
    const refs = new Float32Array(N * N * 2);
    for (let y = 0, i = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        refs[i++] = (x + 0.5) / N;
        refs[i++] = (y + 0.5) / N;
      }
    }
    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute("position", new THREE.BufferAttribute(refs, 2));
    const depositMat = new THREE.ShaderMaterial({
      uniforms: { uAgents: tex(), uScreen: { value: screen } },
      vertexShader: depositVertex,
      fragmentShader: depositFrag,
      depthTest: false,
      depthWrite: false,
      ...additive,
    });
    const points = new THREE.Points(pointsGeometry, depositMat);
    points.frustumCulled = false;
    const pointsScene = new THREE.Scene();
    pointsScene.add(points);

    const pass = (material: THREE.ShaderMaterial, out: THREE.WebGLRenderTarget | null) => {
      quad.material = material;
      renderer.setRenderTarget(out);
      renderer.render(quadScene, camera);
    };

    // Seed the agents — with the settings as they are NOW; changing them later
    // takes a remount (the panel's Restart).
    {
      const start = current();
      const wall = circlePx(start.circle);
      // A seed disc bigger than the wall would start half the agents outside it.
      const discRadius = wall > 0 ? Math.min(start.discRadius, wall * 0.7) : start.discRadius;
      // The whole screen, edge to edge: it wraps, so an empty margin (the
      // original left 50 px) only draws a frame of trail around the page.
      const data = new Float32Array(N * N * 4);
      for (let i = 0; i < data.length; i += 4) {
        let x: number, y: number, dx: number, dy: number;
        if (start.seed >= 0.5) {
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * discRadius;
          dx = Math.cos(a);
          dy = Math.sin(a);
          x = w / 2 + dx * r;
          y = h / 2 + dy * r;
        } else if (wall > 0) {
          // "Whole screen" inside a wall: the whole dish, evenly.
          const a = Math.random() * Math.PI * 2;
          const r = wall * Math.sqrt(Math.random());
          x = w / 2 + Math.cos(a) * r;
          y = h / 2 + Math.sin(a) * r;
          const b = Math.random() * Math.PI * 2;
          dx = Math.cos(b);
          dy = Math.sin(b);
        } else {
          const a = Math.random() * Math.PI * 2;
          x = Math.random() * w;
          y = Math.random() * h;
          dx = Math.cos(a);
          dy = Math.sin(a);
        }
        data[i] = x;
        data[i + 1] = y;
        data[i + 2] = dx;
        data[i + 3] = dy;
      }
      const seed = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.FloatType);
      seed.needsUpdate = true;
      copyMat.uniforms.uTexture.value = seed;
      pass(copyMat, agents.read);
      pass(copyMat, agents.write);
      seed.dispose();
    }

    // ── Fluid driving (Vortex) ────────────────────────────────────────────────
    // The original moved only while the mouse was DRAGGED; on a sign-in page
    // nobody drags. A ghost pointer circles the centre so a vortex is always
    // turning, the real pointer stirs it just by moving, and now and then a
    // burst lands somewhere at random.
    // Mouse on desktop, device tilt on a phone (landingInput.ts). Whatever
    // moves it stirs the fluid, and every preset's agents bend toward it.
    const input = createLandingInput(container);
    const pointer = { uv: new THREE.Vector2(0.5, 0.5), last: new THREE.Vector2(0.5, 0.5), seen: false, moved: false };
    let pointerForce = 0;
    let lastNow = 0;
    const readInput = (now: number) => {
      const dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 1 / 60;
      lastNow = now;
      input.tick(dt);
      pointerForce += ((input.active ? 1 : 0) - pointerForce) * 0.05;
      pointer.uv.set(input.uv.x, input.uv.y);
      if (input.active) {
        if (!pointer.seen) {
          pointer.last.copy(pointer.uv);
          pointer.seen = true;
        }
        pointer.moved = pointer.moved || pointer.uv.distanceToSquared(pointer.last) > 1e-8;
      }
      senseMat.uniforms.uPointer.value.set(pointer.uv.x * w, pointer.uv.y * h);
      senseMat.uniforms.uPointerForce.value = pointerForce;
    };

    const force = new THREE.Vector2();
    const ghost = {
      angle: Math.random() * Math.PI * 2,
      at: new THREE.Vector2(),
      prev: new THREE.Vector2(),
    };
    let nextBurst = 1.5;
    const burstDye = new THREE.Vector3();

    /** Pavel's pointer splat: push along from→to, dye at `to`. */
    const stir = (
      from: THREE.Vector2,
      to: THREE.Vector2,
      dye: THREE.Vector3,
      radiusScale = 1,
      gain = 1
    ) => {
      let dx = to.x - from.x;
      let dy = to.y - from.y;
      const aspect = w / h;
      if (aspect < 1) dx *= aspect;
      if (aspect > 1) dy /= aspect;
      const f = SPLAT_FORCE * gain;
      fluid.splat(to, force.set(dx * f, dy * f), dye, radiusScale);
    };
    /** The "Stir strength" setting: the ghost's push. */
    let ghostGain = 1;

    const driveFluid = (seconds: number) => {
      const aspect = w / h;
      // Ghost: a slow orbit whose radius breathes, so the dye spreads in a ring
      // instead of wearing one groove.
      const radius = 0.26 + Math.sin(seconds * 0.23) * 0.08;
      ghost.prev.copy(ghost.at);
      ghost.angle += 1.1 * STEP_DT;
      ghost.at.set(
        0.5 + (Math.cos(ghost.angle) * radius) / aspect,
        0.5 + Math.sin(ghost.angle) * radius
      );
      if (seconds > 0 && ghostGain > 0) stir(ghost.prev, ghost.at, POINTER_DYE, 3, ghostGain);

      if (pointer.moved) {
        stir(pointer.last, pointer.uv, POINTER_DYE);
        pointer.last.copy(pointer.uv);
        pointer.moved = false;
      }

      if (seconds >= nextBurst) {
        nextBurst = seconds + 2 + Math.random() * 3;
        const at = new THREE.Vector2(Math.random(), Math.random());
        force.set(2700 * (Math.random() - 0.5), 2700 * (Math.random() - 0.5));
        // Orig: ×10 dye, and half the bursts NEGATIVE (they erase). Fewer
        // erasers here — the page should not go dark.
        const sign = Math.random() > 0.75 ? -0.4 : 1;
        burstDye.copy(POINTER_DYE).multiplyScalar(10 * sign);
        fluid.splat(at, force, burstDye);
      }
    };

    // ── Resize ───────────────────────────────────────────────────────────────
    const onResize = () => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      if (!nw || !nh || (nw === w && nh === h)) return;
      w = nw;
      h = nh;
      renderer.setSize(w, h);
      screen.set(w, h);
      center.set(w / 2, h / 2);
      texel.set(1 / w, 1 / h);
      trail.setSize(w, h); // trails regrow; agents wrap into the new size
      fluid?.resize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    // ── Loop ─────────────────────────────────────────────────────────────────
    let seconds = 0;
    let blurPasses = 1;
    const simulate = () => {
      if (fluid) {
        driveFluid(seconds);
        fluid.step(STEP_DT);
      }

      // 1. sense + move
      const su = senseMat.uniforms;
      su.uAgents.value = agents.read.texture;
      su.uTrail.value = trail.read.texture;
      su.uFluidVelocity.value = fluid?.velocity.read.texture ?? null;
      su.uTime.value = preset.timeBase + seconds * preset.timeRate;
      pass(senseMat, agents.write);
      agents.swap();

      // 2. deposit
      depositMat.uniforms.uAgents.value = agents.read.texture;
      renderer.setRenderTarget(trail.read);
      renderer.render(pointsScene, camera);
      if (fluid) {
        dyeDepositMat.uniforms.uDye.value = fluid.dye.read.texture;
        pass(dyeDepositMat, trail.read);
      }

      // 3. blur + decay
      blurMat.uniforms.uDye.value = fluid?.dye.read.texture ?? null;
      for (let i = 0; i < blurPasses; i++) {
        blurMat.uniforms.uTrail.value = trail.read.texture;
        pass(blurMat, trail.write);
        trail.swap();
      }

      seconds += STEP_DT;
    };

    // `speed` scales the step RATE, not the step size: the step size is part
    // of what makes each preset's pattern, the rate only how fast it plays.
    let owed = 0;
    const stopLoop = runCappedLoop(now => {
      readInput(now);
      const l = current();
      const su = senseMat.uniforms;
      su.uSenseLength.value = l.senseLength;
      su.uSenseLengthJitter.value = l.senseLengthJitter;
      su.uSenseAngle.value = l.senseAngle;
      su.uSenseAngleJitter.value = l.senseAngleJitter;
      su.uSwingAngle.value = l.swingAngle;
      su.uSwingLength.value = l.swingLength;
      su.uSwingRate.value = l.swingRate;
      su.uMoveStep.value = l.moveStep;
      su.uMoveStepJitter.value = l.moveStepJitter;
      su.uDensitySpeed.value = l.densitySpeed;
      su.uWobble.value = l.wobble;
      su.uCircle.value = circlePx(l.circle);
      const bu = blurMat.uniforms;
      bu.uBlurKeep.value = l.blurKeep;
      bu.uDecay.value = l.decay;
      bu.uDensityDecay.value = l.densityDecay;
      blurPasses = Math.max(1, Math.min(10, Math.round(l.blurPasses)));
      if (fluid) {
        su.uFluidPush.value = l.push;
        bu.uDyeDecay.value = l.dyeDecay;
        fluid.config.curl = l.curl;
        ghostGain = l.stir;
      }

      owed += Math.max(0, l.speed);
      const steps = Math.floor(owed);
      owed -= steps;
      if (steps === 0) return; // slower than 60: this vsync keeps the last frame
      for (let i = 0; i < Math.min(steps, MAX_STEPS_PER_FRAME); i++) simulate();

      // 4. display
      const du = displayMat.uniforms;
      du.uExposure.value = preset.exposure * l.brightness;
      du.uColor.value.set(...l.color);
      du.uTrail.value = trail.read.texture;
      du.uFluidVelocity.value = fluid?.velocity.read.texture ?? null;
      pass(displayMat, null);
    });

    return () => {
      stopLoop();
      ro.disconnect();
      input.dispose();
      agents.dispose();
      trail.dispose();
      fluid?.dispose();
      for (const m of [copyMat, senseMat, dyeDepositMat, blurMat, displayMat, depositMat])
        m.dispose();
      quad.geometry.dispose();
      pointsGeometry.dispose();
      renderer.dispose();
      // Free the context now, not at GC: flipping through the backgrounds
      // would otherwise pile up contexts until the browser drops the oldest.
      renderer.forceContextLoss();
      if (canvas.parentElement === container) container.removeChild(canvas);
    };
  }, [preset, textureSize]);

  return <div ref={containerRef} className={className} aria-hidden />;
}
