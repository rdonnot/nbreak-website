/** src/components/ui/SeastormBackground.tsx
 *
 * "Seastorm" flow-field particle background, ported from the original 2019
 * vanilla three.js project to modern three (r150+) + React.
 *
 * How it works (same as the original):
 *   - Two WIDTH×WIDTH float textures hold particle positions and velocities,
 *     stepped every frame on the GPU via GPUComputationRenderer.
 *   - A CPU-side Perlin flow field (small DataTexture, updated every frame)
 *     steers the velocities; a static "force" texture gives each particle its
 *     own max speed / steering force so the flow looks organic.
 *   - Trails come from NOT clearing the canvas: a translucent black plane
 *     is drawn over the last frame, so old particles fade out.
 *
 * Tuning:
 *   All look/feel parameters live in SeastormParams: props.params over
 *   SEASTORM_DEFAULTS. Everything except `textureSize` updates LIVE (read from
 *   a ref every frame — no re-init). `textureSize` rebuilds the simulation.
 *   An admin tunes them on the landing page itself (the gear by the
 *   background switch) and saves them for everyone — see
 *   backgrounds/registry.ts. The old dev-only tuner and its per-browser
 *   "seastorm:params" override are gone.
 */

import { useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";
import { ImprovedNoise } from "three/addons/math/ImprovedNoise.js";
import { runCappedLoop } from "./frameCap";
import { densityScaledSize } from "./density";
import { createLandingInput } from "./landingInput";
import type { MotionState } from "./deviceMotion";

const PI = Math.PI;
const TWO_PI = Math.PI * 2;

// ── Tunable parameters ───────────────────────────────────────────────────────

import { SEASTORM_DEFAULTS, type SeastormParams } from "./seastormParams";
export { SEASTORM_DEFAULTS, type SeastormParams };

// ── GLSL ─────────────────────────────────────────────────────────────────────
// `resolution`, `texturePosition` and `textureVelocity` are injected by
// GPUComputationRenderer — do not declare them here.

const fragmentShaderPosition = /* glsl */ `
  precision highp float;
  uniform vec2 screenResolution;
  uniform float speed;
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 _p = texture2D(texturePosition, uv).xyz;
    vec3 _v = texture2D(textureVelocity, uv).xyz;
    vec3 _np = _p + _v * speed;
    _np.x = mod(_np.x, screenResolution.x);
    _np.y = mod(_np.y, screenResolution.y);
    gl_FragColor = vec4(_np, 1.0);
  }
`;

const fragmentShaderVelocity = /* glsl */ `
  precision highp float;
  uniform sampler2D FlowField;
  uniform sampler2D ForceTexture;
  uniform vec2 screenResolution;
  uniform vec2 center;
  uniform float centerPull;
  uniform vec2 pointer;       // px, same space as the particle positions
  uniform float pointerForce; // 0 = no input yet; eases in
  uniform vec2 pointerVel;    // px/s-ish, pushes the wake along

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    vec2 _pp = texture2D(texturePosition, uv).xy;
    vec2 _ff_uv = _pp / screenResolution;
    vec3 _ff = texture2D(FlowField, _ff_uv).xyz;
    vec2 _f  = texture2D(ForceTexture, uv).xy;   // x: max speed, y: max force
    vec2 _v  = texture2D(textureVelocity, uv).xy;

    // Steer toward the flow-field direction (Reynolds steering).
    vec2 _d = _ff.xy * _f.x;
    vec2 _s = _d - _v;
    _s *= _f.y / max(length(_s), 1e-6);

    // Second steering force: toward the screen center (where the card sits).
    // Same max-force limiting, so it bends the currents instead of overriding
    // them — particles spiral in and orbit rather than beelining.
    vec2 _toC = center - _pp;
    vec2 _c = _toC * (_f.x / max(length(_toC), 1e-6)) - _v;
    _c *= _f.y / max(length(_c), 1e-6);

    // Third steering force: the mouse / device tilt. Its own, much larger
    // force limit (a fraction of the particle's speed, not the gentle flow
    // limit) so it really bends the currents: close particles spiral into
    // the pointer, and its motion drags a wake along.
    vec2 _toP = pointer - _pp;
    float _dP = length(_toP);
    float _fall = pointerForce * exp(-_dP / (0.12 * screenResolution.y)); // screenResolution is 2h here
    vec2 _nP = _toP / max(_dP, 1e-6);
    vec2 _swirl = vec2(-_nP.y, _nP.x);
    vec2 _pf = (_nP * 0.7 + _swirl) * _f.x + pointerVel * 4.0 - _v;
    _pf *= (0.22 * _f.x) / max(length(_pf), 1e-6);

    _v += _s + _c * centerPull + _pf * _fall;
    _v *= _f.x / max(length(_v), 1e-6);

    gl_FragColor = vec4(_v, 0.0, 1.0);
  }
`;

const psVertex = /* glsl */ `
  precision highp float;
  attribute vec2 reference;
  uniform sampler2D texturePosition;
  uniform vec2 screenResolution;
  uniform vec2 pointer;
  uniform float pointerForce;
  varying float vGlow;

  void main() {
    vec4 _tp = texture2D(texturePosition, reference);
    vGlow = pointerForce * exp(-length(_tp.xy - pointer) / (0.12 * screenResolution.y));
    vec4 _fp = vec4(mod(_tp.x, screenResolution.x), mod(_tp.y, screenResolution.y), 0.0, 1.0);
    gl_PointSize = 1.0 + 1.5 * vGlow;
    gl_Position = projectionMatrix * modelViewMatrix * _fp;
  }
`;

const psFragment = /* glsl */ `
  precision mediump float;
  uniform vec3 col;
  uniform float alpha;
  varying float vGlow;
  void main() {
    // Particles near the pointer light up, so the response is visible at once.
    gl_FragColor = vec4(mix(col, vec3(1.0), vGlow * 0.25), alpha * (1.0 + 2.5 * vGlow));
  }
`;

// ── CPU-side flow field (Perlin noise, re-sampled every frame) ───────────────

class FlowField {
  cols: number;
  rows: number;
  texture!: THREE.DataTexture;
  private perlin = new ImprovedNoise();
  private zoff = 0;
  private seed = Math.random() * 10000;
  private base: Array<{ x: number; y: number }> = [];

  constructor(resolution: number, width: number) {
    this.cols = Math.max(2, Math.floor(width / resolution));
    if (this.cols % 2 === 1) this.cols++;
    this.rows = Math.floor(this.cols / 2);
    while (this.rows % 2 === 1) {
      this.cols += 2;
      this.rows = Math.floor(this.cols / 2);
    }
  }

  init() {
    const data = new Float32Array(this.cols * this.rows * 4);
    let i4 = 0;
    let xoff = 0;
    for (let x = 0; x < this.cols; x++) {
      let yoff = 0;
      for (let y = 0; y < this.rows; y++) {
        const n = this.perlin.noise(xoff + this.seed, yoff + this.seed, this.zoff);
        data[i4++] = Math.cos(n) * TWO_PI;
        data[i4++] = Math.sin(n) * TWO_PI;
        data[i4++] = 0;
        data[i4++] = 1;
        this.base.push({ x: xoff, y: yoff });
        yoff += 0.05;
      }
      xoff += 0.05;
    }
    this.texture = new THREE.DataTexture(data, this.rows, this.cols, THREE.RGBAFormat, THREE.FloatType);
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.needsUpdate = true;
  }

  /** @param step   how far to advance the noise's time axis this frame
   *  @param detail  scale on the noise coordinates — higher = tighter currents */
  update(step: number, detail: number) {
    // Built above as a FloatType DataTexture, so the buffer really is a
    // Float32Array — three types `image.data` as a union over every typed
    // array, hence the double cast.
    const data = this.texture.image.data as unknown as Float32Array;
    let i4 = 0;
    let n_i = 0;
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        const p = this.base[n_i++];
        const n = PI + ((1 + this.perlin.noise(p.x * detail + this.seed, p.y * detail + this.seed, this.zoff)) / 2) * TWO_PI;
        data[i4] = Math.cos(n);
        data[i4 + 1] = Math.sin(n);
        i4 += 4;
      }
    }
    this.zoff += step;
    this.texture.needsUpdate = true;
  }
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  className?: string;
  /** Overrides; anything unset falls back to SEASTORM_DEFAULTS. */
  params?: Partial<SeastormParams>;
  /** Phone tilt / shake (backgrounds/deviceMotion): steers the currents while the visitor holds the device. */
  motion?: MutableRefObject<MotionState>;
  /** Skip the WebGL scene entirely (e.g. prefers-reduced-motion). */
  disabled?: boolean;
}

export function SeastormBackground({ className, params, motion, disabled = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef(motion);
  motionRef.current = motion;

  const merged: SeastormParams = { ...SEASTORM_DEFAULTS, ...params };

  // Live params: the render loop reads this ref every frame, so slider
  // changes apply instantly without tearing down the simulation.
  const liveRef = useRef(merged);
  liveRef.current = merged;

  const textureSize = merged.textureSize;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || disabled) return;

    let w = container.clientWidth || window.innerWidth;
    let h = container.clientHeight || window.innerHeight;
    const WIDTH = densityScaledSize(textureSize, w, h);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true, antialias: false });
    } catch {
      return; // No WebGL — leave whatever static background the parent has.
    }
    renderer.setPixelRatio(1); // Intentional: trails + ~1M points, keep it cheap.
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 1);
    renderer.autoClearColor = false; // Never clear — the fade plane does it softly.
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(75, w / h, 1, 1_000_000);
    const cameraZ = (cw: number, ch: number) => (cw > ch ? cw / 3.2 : ch / 1.592);
    camera.position.z = cameraZ(w, h);

    const scene = new THREE.Scene();

    // Fade plane: repaints a little black each frame → trails.
    const fadeMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: liveRef.current.trailFade,
      depthTest: false,
      depthWrite: false,
    });
    const fadePlane = new THREE.Mesh(new THREE.PlaneGeometry(w * 2, h * 2), fadeMat);
    fadePlane.position.z = -10;
    fadePlane.renderOrder = -1;
    scene.add(fadePlane);

    // Flow field + per-particle speed/force limits.
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const flowfield = new FlowField(isMobile ? 5 : 10, w);
    flowfield.init();

    const forceData = new Float32Array(WIDTH * WIDTH * 4);
    for (let i = 0; i < WIDTH * WIDTH; i++) {
      forceData[i * 4] = 0.5 + Math.random() * 2.25;      // max speed
      forceData[i * 4 + 1] = 0.02 + Math.random() * 0.04; // max force
      forceData[i * 4 + 3] = 1;
    }
    const forceTexture = new THREE.DataTexture(forceData, WIDTH, WIDTH, THREE.RGBAFormat, THREE.FloatType);
    forceTexture.minFilter = THREE.NearestFilter;
    forceTexture.magFilter = THREE.NearestFilter;
    forceTexture.needsUpdate = true;

    // Particle points, one per simulation texel.
    const count = WIDTH * WIDTH;
    const vertices = new Float32Array(count * 3);
    const references = new Float32Array(count * 2);
    let vi = 0;
    let ri = 0;
    for (let i = 0; i < WIDTH; i++) {
      for (let j = 0; j < WIDTH; j++) {
        vertices[vi++] = Math.random() * w;
        vertices[vi++] = Math.random() * h;
        vertices[vi++] = 0;
        references[ri++] = i / WIDTH;
        references[ri++] = j / WIDTH;
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute("reference", new THREE.BufferAttribute(references, 2));

    let alpha = 0; // fades in toward params.alpha
    const psUniforms = {
      texturePosition: { value: null as THREE.Texture | null },
      screenResolution: { value: new THREE.Vector2(w, h) },
      col: { value: new THREE.Vector3(...liveRef.current.color) },
      alpha: { value: alpha },
      pointer: { value: new THREE.Vector2(w / 2, h / 2) },
      pointerForce: { value: 0 },
    };
    const psMaterial = new THREE.ShaderMaterial({
      uniforms: psUniforms,
      vertexShader: psVertex,
      fragmentShader: psFragment,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const points = new THREE.Points(geometry, psMaterial);
    points.position.set(-w / 2, -h / 2, 0);
    points.frustumCulled = false;
    scene.add(points);

    // GPU compute: position + velocity ping-pong textures.
    const gpuCompute = new GPUComputationRenderer(WIDTH, WIDTH, renderer);

    const dtPosition = gpuCompute.createTexture();
    const dtVelocity = gpuCompute.createTexture();
    // GPUComputationRenderer.createTexture() always allocates FloatType RGBA;
    // three's `image.data` union forces the double cast.
    const pArr = dtPosition.image.data as unknown as Float32Array;
    for (let i = 0; i < pArr.length; i += 4) {
      pArr[i] = Math.random() * w;
      pArr[i + 1] = Math.random() * h;
      pArr[i + 2] = 0;
      pArr[i + 3] = 1;
    }
    // dtVelocity stays zeroed — matches the original.

    const velocityVariable = gpuCompute.addVariable("textureVelocity", fragmentShaderVelocity, dtVelocity);
    const positionVariable = gpuCompute.addVariable("texturePosition", fragmentShaderPosition, dtPosition);
    gpuCompute.setVariableDependencies(velocityVariable, [positionVariable, velocityVariable]);
    gpuCompute.setVariableDependencies(positionVariable, [positionVariable, velocityVariable]);

    const positionUniforms = positionVariable.material.uniforms;
    const velocityUniforms = velocityVariable.material.uniforms;
    positionUniforms["screenResolution"] = { value: new THREE.Vector2(w, h) };
    positionUniforms["speed"] = { value: liveRef.current.speed };
    velocityUniforms["FlowField"] = { value: flowfield.texture };
    velocityUniforms["ForceTexture"] = { value: forceTexture };
    // ×2 like the original: particles sample the lower-left region of the
    // field, which is what gives the drift its large, slow structure.
    velocityUniforms["screenResolution"] = { value: new THREE.Vector2(w * 2, h * 2) };
    velocityUniforms["center"] = { value: new THREE.Vector2(w / 2, h / 2) };
    velocityUniforms["centerPull"] = { value: liveRef.current.centerPull };
    // Pointer is in particle-position space (w×h).
    velocityUniforms["pointer"] = { value: new THREE.Vector2(w / 2, h / 2) };
    velocityUniforms["pointerForce"] = { value: 0 };
    velocityUniforms["pointerVel"] = { value: new THREE.Vector2() };
    const input = createLandingInput(container);
    let pointerForce = 0;
    let lastNow = 0;

    velocityVariable.wrapS = velocityVariable.wrapT = THREE.ClampToEdgeWrapping;
    positionVariable.wrapS = positionVariable.wrapT = THREE.ClampToEdgeWrapping;

    const error = gpuCompute.init();
    if (error !== null) {
      console.warn("SeastormBackground unavailable:", error);
      input.dispose();
      geometry.dispose();
      psMaterial.dispose();
      fadePlane.geometry.dispose();
      fadeMat.dispose();
      flowfield.texture.dispose();
      forceTexture.dispose();
      (gpuCompute as { dispose?: () => void }).dispose?.();
      container.removeChild(renderer.domElement);
      renderer.dispose();
      return;
    }

    // Resize with the container.
    const onResize = () => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      if (!nw || !nh || (nw === w && nh === h)) return;
      w = nw;
      h = nh;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      // Turning a phone flips portrait/landscape: the distance that frames the sea depends on which.
      camera.position.z = cameraZ(w, h);
      camera.updateProjectionMatrix();
      positionUniforms["screenResolution"].value.set(w, h);
      velocityUniforms["screenResolution"].value.set(w * 2, h * 2);
      velocityUniforms["center"].value.set(w / 2, h / 2);
      psUniforms.screenResolution.value.set(w, h);
      points.position.set(-w / 2, -h / 2, 0);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    // Render loop — paused when the tab is hidden (RAF does that for free).
    // Capped at 60 steps a second: every quantity below advances per STEP, so
    // an uncapped loop ran four times too fast on a 240 Hz display.
    const stopLoop = runCappedLoop(now => {
      const p = liveRef.current;

      const dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 1 / 60;
      lastNow = now;
      input.tick(dt);
      pointerForce += ((input.active ? 1 : 0) - pointerForce) * 0.05;
      // The camera sees only part of the w×h field (75° fov, camera.z set above):
      // map the pointer into the VISIBLE plane so the force sits under the cursor.
      const vis = (1.5347 * camera.position.z) / h;
      const px = w / 2 + (input.uv.x - 0.5) * w * vis;
      const py = h / 2 + (input.uv.y - 0.5) * h * vis;
      velocityUniforms["pointer"].value.set(px, py);
      velocityUniforms["pointerForce"].value = pointerForce;
      psUniforms.pointer.value.set(px, py);
      psUniforms.pointerForce.value = pointerForce;
      // Wake: the pointer's motion, scaled into a per-step velocity nudge.
      velocityUniforms["pointerVel"].value.set(
        Math.max(-3, Math.min(3, input.vel.x * w * 0.004)),
        Math.max(-3, Math.min(3, input.vel.y * h * 0.004)));

      // Where the sea is steered (mouse / tilt) is landingInput's; a SHAKE of the phone (deviceMotion) stirs it up.
      const energy = motionRef.current?.current.energy ?? 0;
      flowfield.update(p.flowSpeed * (1 + energy * 3), p.flowDetail);
      velocityUniforms["centerPull"].value = p.centerPull;
      positionUniforms["speed"].value = p.speed * (1 + energy * 2.5);
      gpuCompute.compute();

      fadeMat.opacity = p.trailFade;
      psUniforms.col.value.set(p.color[0], p.color[1], p.color[2]);
      alpha += (p.alpha * (1 + energy * 0.8) - alpha) * 0.008; // fade-in + responsive to slider
      psUniforms.alpha.value = alpha;
      psUniforms.texturePosition.value =
        gpuCompute.getCurrentRenderTarget(positionVariable).texture;

      renderer.render(scene, camera);
    });

    return () => {
      stopLoop();
      input.dispose();
      ro.disconnect();
      geometry.dispose();
      psMaterial.dispose();
      fadePlane.geometry.dispose();
      fadeMat.dispose();
      flowfield.texture.dispose();
      forceTexture.dispose();
      (gpuCompute as { dispose?: () => void }).dispose?.(); // dispose() exists from three r155
      renderer.dispose();
      renderer.forceContextLoss(); // free it now: the landing picker swaps backgrounds
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [disabled, textureSize]);

  return <div ref={containerRef} className={className} aria-hidden />;
}
