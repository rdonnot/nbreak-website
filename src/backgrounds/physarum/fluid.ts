/** src/components/ui/backgrounds/physarum/fluid.ts
 *
 * A small stable-fluids solver on the GPU — Pavel Dobryakov's
 * WebGL-Fluid-Simulation as adapted to three.js in Physarum-experiments 6–15
 * (MIT, see LICENSE.txt here). Only what the Vortex preset reads is kept: the
 * velocity field the particles ride and the dye that keeps their trails alive.
 * No display pass, bloom or sunrays.
 *
 * Coordinates are UV (0–1, y up). Velocity is in texels per second.
 */

import * as THREE from "three";

const baseVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform vec2 texelSize;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const splatFrag = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;
  void main() {
    vec2 p = vUv - point;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + splat, 1.0);
  }
`;

const advectionFrag = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform float dt;
  uniform float dissipation;
  void main() {
    vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
    gl_FragColor = texture2D(uSource, coord) / (1.0 + dissipation * dt);
  }
`;

const divergenceFrag = /* glsl */ `
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uVelocity;
  void main() {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;
    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vL.x < 0.0) { L = -C.x; }
    if (vR.x > 1.0) { R = -C.x; }
    if (vT.y > 1.0) { T = -C.y; }
    if (vB.y < 0.0) { B = -C.y; }
    gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
  }
`;

const curlFrag = /* glsl */ `
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uVelocity;
  void main() {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
  }
`;

const vorticityFrag = /* glsl */ `
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float curl;
  uniform float dt;
  void main() {
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;
    vec2 vel = texture2D(uVelocity, vUv).xy;
    gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
  }
`;

const clearFrag = /* glsl */ `
  varying highp vec2 vUv;
  uniform sampler2D uTexture;
  uniform float value;
  void main() {
    gl_FragColor = value * texture2D(uTexture, vUv);
  }
`;

const pressureFrag = /* glsl */ `
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  void main() {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float divergence = texture2D(uDivergence, vUv).x;
    gl_FragColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
  }
`;

const gradientSubtractFrag = /* glsl */ `
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  void main() {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy - vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

// ── Targets ──────────────────────────────────────────────────────────────────

function target(w: number, h: number, filter: THREE.MagnificationTextureFilter) {
  return new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: filter,
    magFilter: filter,
    depthBuffer: false,
    stencilBuffer: false,
  });
}

class PingPong {
  read: THREE.WebGLRenderTarget;
  write: THREE.WebGLRenderTarget;
  constructor(w: number, h: number, filter: THREE.MagnificationTextureFilter) {
    this.read = target(w, h, filter);
    this.write = target(w, h, filter);
  }
  swap() {
    [this.read, this.write] = [this.write, this.read];
  }
  dispose() {
    this.read.dispose();
    this.write.dispose();
  }
}

/** Grid for `resolution` cells on the SHORT side, matching the screen's aspect. */
function gridFor(resolution: number, aspect: number) {
  const long = Math.round(resolution * (aspect < 1 ? 1 / aspect : aspect));
  return aspect >= 1 ? { w: long, h: resolution } : { w: resolution, h: long };
}

export interface FluidConfig {
  simResolution: number;
  dyeResolution: number;
  densityDissipation: number;
  velocityDissipation: number;
  pressure: number;
  pressureIterations: number;
  curl: number;
  /** Splat radius, in % of the screen (orig 0.25). */
  splatRadius: number;
}

export const FLUID_DEFAULTS: FluidConfig = {
  simResolution: 256,
  // The original ran dye at 1024. Here dye is only a mask (where trails live)
  // and is never shown directly, so half of that is indistinguishable.
  dyeResolution: 512,
  densityDissipation: 0.6,
  velocityDissipation: 0.2,
  pressure: 1,
  pressureIterations: 20,
  curl: 25,
  splatRadius: 0.25,
};

export class FluidSim {
  velocity!: PingPong;
  dye!: PingPong;
  private divergence!: THREE.WebGLRenderTarget;
  private curlRT!: THREE.WebGLRenderTarget;
  private pressure!: PingPong;
  private aspect = 1;
  private texel = new THREE.Vector2();

  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly quad: THREE.Mesh;
  private readonly materials: THREE.ShaderMaterial[] = [];
  private readonly splatMat: THREE.ShaderMaterial;
  private readonly curlMat: THREE.ShaderMaterial;
  private readonly vorticityMat: THREE.ShaderMaterial;
  private readonly divergenceMat: THREE.ShaderMaterial;
  private readonly clearMat: THREE.ShaderMaterial;
  private readonly pressureMat: THREE.ShaderMaterial;
  private readonly gradientMat: THREE.ShaderMaterial;
  private readonly advectionMat: THREE.ShaderMaterial;

  /** `config` is read every step, so its fields can be changed live. */
  constructor(
    private renderer: THREE.WebGLRenderer,
    width: number,
    height: number,
    readonly config: FluidConfig = { ...FLUID_DEFAULTS }
  ) {
    const mat = (fragmentShader: string, uniforms: Record<string, THREE.IUniform>) => {
      const m = new THREE.ShaderMaterial({
        uniforms: { texelSize: { value: this.texel }, ...uniforms },
        vertexShader: baseVertex,
        fragmentShader,
        depthTest: false,
        depthWrite: false,
      });
      this.materials.push(m);
      return m;
    };
    const tex = () => ({ value: null as THREE.Texture | null });
    this.splatMat = mat(splatFrag, {
      uTarget: tex(),
      aspectRatio: { value: 1 },
      point: { value: new THREE.Vector2() },
      color: { value: new THREE.Vector3() },
      radius: { value: 0 },
    });
    this.curlMat = mat(curlFrag, { uVelocity: tex() });
    this.vorticityMat = mat(vorticityFrag, {
      uVelocity: tex(),
      uCurl: tex(),
      curl: { value: config.curl },
      dt: { value: 0 },
    });
    this.divergenceMat = mat(divergenceFrag, { uVelocity: tex() });
    this.clearMat = mat(clearFrag, { uTexture: tex(), value: { value: config.pressure } });
    this.pressureMat = mat(pressureFrag, { uPressure: tex(), uDivergence: tex() });
    this.gradientMat = mat(gradientSubtractFrag, { uPressure: tex(), uVelocity: tex() });
    this.advectionMat = mat(advectionFrag, {
      uVelocity: tex(),
      uSource: tex(),
      dt: { value: 0 },
      dissipation: { value: 0 },
    });

    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.curlMat);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);
    this.allocate(width, height);
  }

  private allocate(width: number, height: number) {
    this.aspect = width / Math.max(1, height);
    const sim = gridFor(this.config.simResolution, this.aspect);
    const dye = gridFor(this.config.dyeResolution, this.aspect);
    this.velocity = new PingPong(sim.w, sim.h, THREE.LinearFilter);
    this.dye = new PingPong(dye.w, dye.h, THREE.LinearFilter);
    this.divergence = target(sim.w, sim.h, THREE.NearestFilter);
    this.curlRT = target(sim.w, sim.h, THREE.NearestFilter);
    this.pressure = new PingPong(sim.w, sim.h, THREE.NearestFilter);
    this.texel.set(1 / sim.w, 1 / sim.h);
  }

  private release() {
    this.velocity.dispose();
    this.dye.dispose();
    this.divergence.dispose();
    this.curlRT.dispose();
    this.pressure.dispose();
  }

  /** New screen size: fresh (empty) fields at the new aspect. */
  resize(width: number, height: number) {
    this.release();
    this.allocate(width, height);
  }

  private pass(material: THREE.ShaderMaterial, out: THREE.WebGLRenderTarget) {
    this.quad.material = material;
    this.renderer.setRenderTarget(out);
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Push the fluid at `point` (UV) by `force` (texels/s) and drop `dye` there.
   * `radiusScale` widens the splat beyond the configured radius.
   */
  splat(point: THREE.Vector2, force: THREE.Vector2, dye: THREE.Vector3, radiusScale = 1) {
    const u = this.splatMat.uniforms;
    let radius = (this.config.splatRadius / 100) * radiusScale;
    if (this.aspect > 1) radius *= this.aspect;
    u.aspectRatio.value = this.aspect;
    u.point.value.copy(point);
    u.radius.value = radius;

    u.uTarget.value = this.velocity.read.texture;
    u.color.value.set(force.x, force.y, 0);
    this.pass(this.splatMat, this.velocity.write);
    this.velocity.swap();

    u.uTarget.value = this.dye.read.texture;
    u.color.value.copy(dye);
    this.pass(this.splatMat, this.dye.write);
    this.dye.swap();
  }

  step(dt: number) {
    const c = this.config;

    this.curlMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.pass(this.curlMat, this.curlRT);

    const vu = this.vorticityMat.uniforms;
    vu.uVelocity.value = this.velocity.read.texture;
    vu.uCurl.value = this.curlRT.texture;
    vu.curl.value = c.curl;
    vu.dt.value = dt;
    this.pass(this.vorticityMat, this.velocity.write);
    this.velocity.swap();

    this.divergenceMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.pass(this.divergenceMat, this.divergence);

    this.clearMat.uniforms.uTexture.value = this.pressure.read.texture;
    this.clearMat.uniforms.value.value = c.pressure;
    this.pass(this.clearMat, this.pressure.write);
    this.pressure.swap();

    this.pressureMat.uniforms.uDivergence.value = this.divergence.texture;
    for (let i = 0; i < c.pressureIterations; i++) {
      this.pressureMat.uniforms.uPressure.value = this.pressure.read.texture;
      this.pass(this.pressureMat, this.pressure.write);
      this.pressure.swap();
    }

    this.gradientMat.uniforms.uPressure.value = this.pressure.read.texture;
    this.gradientMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.pass(this.gradientMat, this.velocity.write);
    this.velocity.swap();

    const au = this.advectionMat.uniforms;
    au.uVelocity.value = this.velocity.read.texture;
    au.uSource.value = this.velocity.read.texture;
    au.dt.value = dt;
    au.dissipation.value = c.velocityDissipation;
    this.pass(this.advectionMat, this.velocity.write);
    this.velocity.swap();

    au.uVelocity.value = this.velocity.read.texture;
    au.uSource.value = this.dye.read.texture;
    au.dissipation.value = c.densityDissipation;
    this.pass(this.advectionMat, this.dye.write);
    this.dye.swap();
  }

  dispose() {
    this.release();
    this.quad.geometry.dispose();
    for (const m of this.materials) m.dispose();
  }
}
