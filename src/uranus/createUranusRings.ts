import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  Points,
  PointsMaterial,
  RingGeometry,
  ShaderMaterial,
  Uniform,
  Vector3
} from "three";
import {
  URANUS_PHYSICAL,
  URANUS_RINGS,
  type UranusRingDefinition
} from "./uranusConstants";
import {
  uranusRingFragmentShader,
  uranusRingVertexShader
} from "./uranusShaders";
import {
  kilometersToUranusLocalRadius,
  URANUS_EQUATORIAL_RADIUS_SCENE_UNITS
} from "../physics/units";
import { lerp, seededRandom } from "../utils/math";

export interface UranusRingMaterialEntry {
  ring: UranusRingDefinition;
  material: ShaderMaterial;
}

export interface UranusRingsOptions {
  simplified?: boolean;
}

export interface UranusRingsResult {
  group: Group;
  ringMaterials: UranusRingMaterialEntry[];
}

export function createUranusRings(
  options: UranusRingsOptions = {}
): UranusRingsResult {
  const group = new Group();
  group.name = "Uranus dark narrow rings in tilted equatorial plane";

  const ringMaterials: UranusRingMaterialEntry[] = [];
  const radialSegments = options.simplified ? 240 : 560;
  const tubularSegments = options.simplified ? 6 : 12;

  for (const ring of URANUS_RINGS) {
    const { innerRadius, outerRadius } = getVisualRingBounds(ring);
    const geometry = new RingGeometry(
      innerRadius,
      outerRadius,
      radialSegments,
      tubularSegments
    );

    geometry.rotateX(-Math.PI / 2);
    geometry.computeVertexNormals();

    const material = createRingMaterial(ring, innerRadius, outerRadius);
    const mesh = new Mesh(geometry, material);
    mesh.name = `Uranus ${ring.name} ring`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.renderOrder = 14;
    mesh.userData = {
      name: ring.name,
      family: ring.family,
      centerRadiusKm: ring.centerRadiusKm,
      physicalWidthKm: ring.physicalWidthKm,
      visualMinimumWidthKm: ring.visualMinimumWidthKm
    };
    group.add(mesh);
    ringMaterials.push({ ring, material });
  }

  group.add(createRingParticleLayer(options));
  return { group, ringMaterials };
}

function createRingMaterial(
  ring: UranusRingDefinition,
  innerRadius: number,
  outerRadius: number
): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: uranusRingVertexShader,
    fragmentShader: uranusRingFragmentShader,
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uInnerRadius: new Uniform(innerRadius),
      uOuterRadius: new Uniform(outerRadius),
      uOpacity: new Uniform(ring.opacity),
      uTime: new Uniform(0),
      uPlanetRadius: new Uniform(URANUS_EQUATORIAL_RADIUS_SCENE_UNITS),
      uColorInner: new Uniform(new Color(ring.colorInner)),
      uColorOuter: new Uniform(new Color(ring.colorOuter)),
      uSunDirectionWorld: new Uniform(new Vector3(1, 0, 0)),
      uPlanetCenterWorld: new Uniform(new Vector3())
    }
  });
}

function createRingParticleLayer(
  options: UranusRingsOptions
): Points<BufferGeometry, PointsMaterial> {
  const random = seededRandom(1_986_0124);
  const positions: number[] = [];
  const colors: number[] = [];

  for (const ring of URANUS_RINGS) {
    const particleCount = options.simplified
      ? Math.max(60, Math.floor(ring.particleCount * 0.42))
      : ring.particleCount;
    addRingParticles(ring, particleCount, random, positions, colors);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute("color", new BufferAttribute(new Float32Array(colors), 3));

  const material = new PointsMaterial({
    size: 0.011,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.24,
    vertexColors: true,
    blending: AdditiveBlending,
    depthWrite: false
  });

  const particles = new Points(geometry, material);
  particles.name = "Uranus sparse ring particles";
  particles.renderOrder = 18;
  return particles;
}

function addRingParticles(
  ring: UranusRingDefinition,
  particleCount: number,
  random: () => number,
  positions: number[],
  colors: number[]
): void {
  const { innerRadius, outerRadius } = getVisualRingBounds(ring);
  const colorInner = new Color(ring.colorInner);
  const colorOuter = new Color(ring.colorOuter);
  const verticalScale = ring.family === "outerDust" ? 0.018 : 0.006;

  for (let index = 0; index < particleCount; index += 1) {
    const radialT = random();
    const radius = Math.sqrt(lerp(innerRadius * innerRadius, outerRadius * outerRadius, radialT));
    const angle = random() * Math.PI * 2;
    const verticalScatter = (random() - 0.5) * verticalScale;

    positions.push(
      Math.cos(angle) * radius,
      verticalScatter,
      Math.sin(angle) * radius
    );

    const color = colorInner.clone().lerp(colorOuter, radialT);
    const brightness = ring.family === "mainNarrow"
      ? 0.62 + random() * 0.3
      : 0.4 + random() * 0.28;
    colors.push(color.r * brightness, color.g * brightness, color.b * brightness);
  }
}

function getVisualRingBounds(ring: UranusRingDefinition): {
  innerRadius: number;
  outerRadius: number;
} {
  const visibleWidthKm = Math.max(
    ring.physicalWidthKm,
    ring.visualMinimumWidthKm
  );
  const innerRadiusKm = ring.centerRadiusKm - visibleWidthKm * 0.5;
  const outerRadiusKm = ring.centerRadiusKm + visibleWidthKm * 0.5;

  return {
    innerRadius: localRadiusFromKm(innerRadiusKm),
    outerRadius: localRadiusFromKm(outerRadiusKm)
  };
}

function localRadiusFromKm(kilometers: number): number {
  return kilometersToUranusLocalRadius(
    kilometers,
    URANUS_PHYSICAL.equatorialRadiusKm
  );
}
