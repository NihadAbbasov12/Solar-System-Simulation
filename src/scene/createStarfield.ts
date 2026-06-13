import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Group,
  Points,
  ShaderMaterial,
  Sprite,
  SpriteMaterial,
  Uniform,
  Vector3
} from "three";
import { seededRandom } from "../utils/math";

export interface StarfieldResult {
  group: Group;
  update: (elapsedRealSeconds: number) => void;
}

const SKY_RADIUS = 1_700;

// The galactic plane is inclined about 60 degrees to the ecliptic.
const GALACTIC_TILT_RAD = (60.2 * Math.PI) / 180;

const starVertexShader = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aTwinklePhase;

  uniform float uTime;
  uniform float uPixelRatio;

  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vColor = aColor;
    vTwinkle = 0.88 + 0.12 * sin(uTime * 0.9 + aTwinklePhase);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(aSize * uPixelRatio * (820.0 / -mvPosition.z), 0.0, 48.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vec2 fromCenter = gl_PointCoord - vec2(0.5);
    float distance = length(fromCenter);
    // Soft round core with a faint halo instead of a hard square point.
    float core = smoothstep(0.5, 0.04, distance);
    float halo = smoothstep(0.5, 0.0, distance) * 0.35;
    float alpha = clamp(core + halo, 0.0, 1.0) * vTwinkle;
    if (alpha < 0.01) {
      discard;
    }
    gl_FragColor = vec4(vColor * vTwinkle, alpha);
  }
`;

export function createStarfield(): StarfieldResult {
  const group = new Group();
  group.name = "Procedural starfield with Milky Way";

  const skyStars = createStarPoints(buildSkyStars(), "Sky stars");
  const milkyWayStars = createStarPoints(
    buildMilkyWayStars(),
    "Milky Way band stars"
  );
  group.add(skyStars.points, milkyWayStars.points);

  for (const sprite of buildMilkyWayHaze()) {
    group.add(sprite);
  }

  return {
    group,
    update: (elapsedRealSeconds) => {
      skyStars.material.uniforms.uTime.value = elapsedRealSeconds;
      milkyWayStars.material.uniforms.uTime.value = elapsedRealSeconds;
    }
  };
}

interface StarBuffers {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  twinklePhases: Float32Array;
}

function createStarPoints(
  buffers: StarBuffers,
  name: string
): { points: Points; material: ShaderMaterial } {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(buffers.positions, 3));
  geometry.setAttribute("aColor", new BufferAttribute(buffers.colors, 3));
  geometry.setAttribute("aSize", new BufferAttribute(buffers.sizes, 1));
  geometry.setAttribute(
    "aTwinklePhase",
    new BufferAttribute(buffers.twinklePhases, 1)
  );

  const material = new ShaderMaterial({
    vertexShader: starVertexShader,
    fragmentShader: starFragmentShader,
    uniforms: {
      uTime: new Uniform(0),
      uPixelRatio: new Uniform(Math.min(window.devicePixelRatio, 2))
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending
  });

  const points = new Points(geometry, material);
  points.name = name;
  return { points, material };
}

function buildSkyStars(): StarBuffers {
  const random = seededRandom(42_4242);
  const starCount = 9_000;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);
  const twinklePhases = new Float32Array(starCount);

  for (let index = 0; index < starCount; index += 1) {
    const direction = randomDirection(random);
    const distance = SKY_RADIUS * (0.78 + random() * 0.22);
    positions[index * 3] = direction.x * distance;
    positions[index * 3 + 1] = direction.y * distance;
    positions[index * 3 + 2] = direction.z * distance;

    // Power-law magnitudes: most stars faint, a handful brilliant.
    const magnitude = Math.pow(random(), 5.2);
    const brightness = 0.32 + magnitude * 1.35;
    const color = starColorFromTemperature(random());
    colors[index * 3] = color.r * brightness;
    colors[index * 3 + 1] = color.g * brightness;
    colors[index * 3 + 2] = color.b * brightness;

    sizes[index] = 0.55 + magnitude * 3.4;
    twinklePhases[index] = random() * Math.PI * 2;
  }

  return { positions, colors, sizes, twinklePhases };
}

function buildMilkyWayStars(): StarBuffers {
  const random = seededRandom(77_1234);
  const starCount = 26_000;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);
  const twinklePhases = new Float32Array(starCount);
  const basis = galacticBasis();

  for (let index = 0; index < starCount; index += 1) {
    const alongBand = random() * Math.PI * 2;
    // Gaussian thickness keeps stars hugging the galactic plane, while the
    // bulge widens and brightens one stretch of the band like the real core.
    const bulge = Math.exp(-squared(angularDistance(alongBand, 1.1)) * 1.4);
    const thickness = SKY_RADIUS * (0.035 + 0.075 * bulge);
    const planarJitter = gaussian(random) * thickness;
    const verticalJitter = gaussian(random) * thickness;

    const direction = new Vector3()
      .addScaledVector(basis.bandX, Math.cos(alongBand))
      .addScaledVector(basis.bandY, Math.sin(alongBand))
      .multiplyScalar(SKY_RADIUS * (0.82 + random() * 0.18))
      .addScaledVector(basis.normal, verticalJitter)
      .addScaledVector(basis.bandX, planarJitter * 0.2);

    positions[index * 3] = direction.x;
    positions[index * 3 + 1] = direction.y;
    positions[index * 3 + 2] = direction.z;

    const magnitude = Math.pow(random(), 6.5);
    const brightness = (0.1 + magnitude * 0.5) * (0.7 + bulge * 0.9);
    const color = starColorFromTemperature(0.25 + random() * 0.6);
    colors[index * 3] = color.r * brightness;
    colors[index * 3 + 1] = color.g * brightness;
    colors[index * 3 + 2] = color.b * brightness;

    sizes[index] = 0.4 + magnitude * 1.7;
    twinklePhases[index] = random() * Math.PI * 2;
  }

  return { positions, colors, sizes, twinklePhases };
}

function buildMilkyWayHaze(): Sprite[] {
  const random = seededRandom(13_9090);
  const basis = galacticBasis();
  const sprites: Sprite[] = [];
  const texture = createHazeTexture();
  const tints = [
    new Color(0.78, 0.74, 0.66),
    new Color(0.62, 0.66, 0.78),
    new Color(0.74, 0.66, 0.58)
  ];

  for (let index = 0; index < 54; index += 1) {
    const alongBand = random() * Math.PI * 2;
    const bulge = Math.exp(-squared(angularDistance(alongBand, 1.1)) * 1.4);
    const offset = gaussian(random) * SKY_RADIUS * 0.03;

    const position = new Vector3()
      .addScaledVector(basis.bandX, Math.cos(alongBand))
      .addScaledVector(basis.bandY, Math.sin(alongBand))
      .multiplyScalar(SKY_RADIUS * 0.92)
      .addScaledVector(basis.normal, offset);

    const material = new SpriteMaterial({
      map: texture,
      color: tints[index % tints.length],
      transparent: true,
      opacity: 0.028 + 0.05 * bulge + random() * 0.012,
      blending: AdditiveBlending,
      depthWrite: false
    });

    const sprite = new Sprite(material);
    sprite.name = "Milky Way haze";
    sprite.position.copy(position);
    const size = SKY_RADIUS * (0.16 + random() * 0.2) * (1 + bulge * 0.8);
    sprite.scale.set(size, size * (0.45 + random() * 0.3), 1);
    sprites.push(sprite);
  }

  return sprites;
}

interface GalacticBasis {
  bandX: Vector3;
  bandY: Vector3;
  normal: Vector3;
}

function galacticBasis(): GalacticBasis {
  const normal = new Vector3(
    Math.sin(GALACTIC_TILT_RAD),
    Math.cos(GALACTIC_TILT_RAD),
    0
  ).normalize();
  const bandX = new Vector3(0, 0, 1).cross(normal).normalize();
  const bandY = new Vector3().crossVectors(normal, bandX).normalize();
  return { bandX, bandY, normal };
}

function starColorFromTemperature(temperature: number): Color {
  // 0 = cool red dwarf, 1 = hot blue-white. Approximate blackbody tints.
  const cool = new Color(1.0, 0.62, 0.42);
  const solar = new Color(1.0, 0.92, 0.78);
  const hot = new Color(0.72, 0.82, 1.0);

  if (temperature < 0.55) {
    return cool.clone().lerp(solar, temperature / 0.55);
  }

  return solar.clone().lerp(hot, (temperature - 0.55) / 0.45);
}

function randomDirection(random: () => number): Vector3 {
  const z = random() * 2 - 1;
  const theta = random() * Math.PI * 2;
  const radius = Math.sqrt(1 - z * z);
  return new Vector3(Math.cos(theta) * radius, z, Math.sin(theta) * radius);
}

function gaussian(random: () => number): number {
  const u = Math.max(random(), 1e-9);
  const v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v);
}

function angularDistance(a: number, b: number): number {
  const difference = Math.abs(a - b) % (Math.PI * 2);
  return difference > Math.PI ? Math.PI * 2 - difference : difference;
}

function squared(value: number): number {
  return value * value;
}

let cachedHazeTexture: CanvasTexture | undefined;

function createHazeTexture(): CanvasTexture {
  if (cachedHazeTexture) {
    return cachedHazeTexture;
  }

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("2D canvas context is unavailable for the haze texture.");
  }

  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
  gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.32)");
  gradient.addColorStop(0.75, "rgba(255, 255, 255, 0.08)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  cachedHazeTexture = new CanvasTexture(canvas);
  return cachedHazeTexture;
}
