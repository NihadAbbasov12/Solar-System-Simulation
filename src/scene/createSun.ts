import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  Color,
  Group,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Uniform
} from "three";

export interface SunResult {
  group: Group;
  update: (elapsedDays: number) => void;
}

export const SUN_RADIUS_SCENE_UNITS = 3.0;

const sunVertexShader = /* glsl */ `
  varying vec3 vObjectPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vObjectPosition = position;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const sunFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uBrightness;

  varying vec3 vObjectPosition;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  // Ashima simplex 3D noise.
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  // Octave counts stay low on purpose: ANGLE's D3D compiler fully unrolls
  // and inlines each snoise call, so a dense fbm stalls shader compilation.
  float fbm4(vec3 p) {
    float total = 0.5 * snoise(p);
    total += 0.26 * snoise(p * 2.05);
    total += 0.135 * snoise(p * 4.2);
    total += 0.07 * snoise(p * 8.6);
    return total;
  }

  float fbm3(vec3 p) {
    float total = 0.5 * snoise(p);
    total += 0.26 * snoise(p * 2.05);
    total += 0.135 * snoise(p * 4.2);
    return total;
  }

  void main() {
    vec3 unitPosition = normalize(vObjectPosition);

    // Slow differential drift mimics convection; fast detail mimics granules.
    float convection = fbm4(unitPosition * 3.2 + vec3(0.0, uTime * 0.011, uTime * 0.004));
    float granulation = fbm3(unitPosition * 14.0 - vec3(uTime * 0.03, 0.0, uTime * 0.018));

    float surface = 0.62 + 0.34 * convection + 0.26 * granulation;
    surface = clamp(surface, 0.0, 1.45);

    // Sunspot umbrae from deep low-frequency wells.
    float spotField = snoise(unitPosition * 2.3 + vec3(31.4, uTime * 0.002, 17.2));
    float spots = smoothstep(-0.82, -0.52, spotField);
    surface *= mix(0.18, 1.0, spots);

    vec3 coolColor = vec3(0.98, 0.36, 0.05);
    vec3 midColor = vec3(1.0, 0.62, 0.18);
    vec3 hotColor = vec3(1.0, 0.93, 0.66);
    vec3 color = mix(coolColor, midColor, smoothstep(0.15, 0.62, surface));
    color = mix(color, hotColor, smoothstep(0.62, 1.1, surface));

    // Empirical limb darkening: photosphere dims toward the edge of the disk.
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float mu = clamp(dot(normalize(vWorldNormal), viewDirection), 0.0, 1.0);
    float limb = 0.34 + 0.66 * pow(mu, 0.72);

    // HDR output above the bloom threshold so the disk ignites the glow pass.
    vec3 hdr = color * surface * limb * uBrightness;
    gl_FragColor = vec4(hdr, 1.0);
  }
`;

const chromosphereVertexShader = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const chromosphereFragmentShader = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    // BackSide shell: the silhouette rim glows strongest.
    float rim = 1.0 - abs(dot(normalize(vWorldNormal), viewDirection));
    float intensity = pow(rim, 3.4);
    vec3 color = vec3(1.0, 0.46, 0.13) * intensity * 1.6;
    gl_FragColor = vec4(color, intensity);
  }
`;

export function createSun(): SunResult {
  const group = new Group();
  group.name = "Sun photosphere, chromosphere and corona";

  const material = new ShaderMaterial({
    vertexShader: sunVertexShader,
    fragmentShader: sunFragmentShader,
    uniforms: {
      uTime: new Uniform(0),
      uBrightness: new Uniform(2.2)
    }
  });

  const photosphere = new Mesh(
    new SphereGeometry(SUN_RADIUS_SCENE_UNITS, 96, 48),
    material
  );
  photosphere.name = "Sun photosphere";
  group.add(photosphere);

  const chromosphere = new Mesh(
    new SphereGeometry(SUN_RADIUS_SCENE_UNITS * 1.035, 96, 48),
    new ShaderMaterial({
      vertexShader: chromosphereVertexShader,
      fragmentShader: chromosphereFragmentShader,
      side: BackSide,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending
    })
  );
  chromosphere.name = "Sun chromosphere rim";
  group.add(chromosphere);

  group.add(
    createCoronaSprite(SUN_RADIUS_SCENE_UNITS * 5.4, 0.62, new Color(1.0, 0.82, 0.5)),
    createCoronaSprite(SUN_RADIUS_SCENE_UNITS * 10.5, 0.3, new Color(1.0, 0.66, 0.32)),
    createCoronaSprite(SUN_RADIUS_SCENE_UNITS * 19.0, 0.13, new Color(0.92, 0.55, 0.3))
  );

  return {
    group,
    update: (elapsedDays) => {
      material.uniforms.uTime.value = elapsedDays;
    }
  };
}

function createCoronaSprite(
  worldSize: number,
  opacity: number,
  tint: Color
): Sprite {
  const material = new SpriteMaterial({
    map: createCoronaTexture(),
    color: tint,
    transparent: true,
    opacity,
    blending: AdditiveBlending,
    depthWrite: false
  });

  const sprite = new Sprite(material);
  sprite.name = "Sun corona layer";
  sprite.scale.set(worldSize, worldSize, 1);
  return sprite;
}

let cachedCoronaTexture: CanvasTexture | undefined;

function createCoronaTexture(): CanvasTexture {
  if (cachedCoronaTexture) {
    return cachedCoronaTexture;
  }

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("2D canvas context is unavailable for the corona texture.");
  }

  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  // The gradient must reach zero well before the sprite edge, or bloom
  // reveals the square texture bounds from far away.
  gradient.addColorStop(0.0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.08, "rgba(255, 236, 196, 0.85)");
  gradient.addColorStop(0.2, "rgba(255, 196, 120, 0.34)");
  gradient.addColorStop(0.4, "rgba(255, 150, 70, 0.09)");
  gradient.addColorStop(0.62, "rgba(255, 120, 50, 0.018)");
  gradient.addColorStop(0.82, "rgba(255, 110, 40, 0)");
  gradient.addColorStop(1.0, "rgba(255, 110, 40, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  cachedCoronaTexture = new CanvasTexture(canvas);
  return cachedCoronaTexture;
}
