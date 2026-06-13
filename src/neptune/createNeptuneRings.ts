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
  NEPTUNE_PHYSICAL,
  NEPTUNE_RING_ARCS,
  NEPTUNE_RINGS,
  type NeptuneRingArcDefinition,
  type NeptuneRingDefinition
} from "./neptuneConstants";
import {
  neptuneRingFragmentShader,
  neptuneRingVertexShader
} from "./neptuneShaders";
import {
  kilometersToNeptuneLocalRadius,
  NEPTUNE_EQUATORIAL_RADIUS_SCENE_UNITS
} from "../physics/units";
import { attachDistanceFade } from "../utils/distanceFade";
import { degToRad, lerp, seededRandom, TAU } from "../utils/math";

export interface NeptuneRingMaterialEntry {
  sourceName: string;
  material: ShaderMaterial;
}

export interface NeptuneRingsOptions {
  simplified?: boolean;
}

export interface NeptuneRingsResult {
  group: Group;
  ringMaterials: NeptuneRingMaterialEntry[];
}

export function createNeptuneRings(
  options: NeptuneRingsOptions = {}
): NeptuneRingsResult {
  const group = new Group();
  group.name = "Neptune faint rings and Adams arcs";

  const ringMaterials: NeptuneRingMaterialEntry[] = [];
  const radialSegments = options.simplified ? 220 : 520;
  const tubularSegments = options.simplified ? 5 : 10;

  for (const ring of NEPTUNE_RINGS) {
    const { innerRadius, outerRadius } = getVisualRingBounds(ring);
    const geometry = new RingGeometry(
      innerRadius,
      outerRadius,
      radialSegments,
      tubularSegments
    );

    geometry.rotateX(-Math.PI / 2);
    geometry.computeVertexNormals();

    const material = createRingMaterial(
      innerRadius,
      outerRadius,
      ring.opacity,
      ring.colorInner,
      ring.colorOuter
    );
    const mesh = new Mesh(geometry, material);
    mesh.name = `Neptune ${ring.name} ring`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.renderOrder = 16;
    mesh.userData = ring;
    group.add(mesh);
    ringMaterials.push({ sourceName: ring.name, material });
  }

  for (const arc of NEPTUNE_RING_ARCS) {
    const { innerRadius, outerRadius } = getArcRingBounds(arc);
    const thetaLength = degToRad(arc.angularSpanDeg);
    const thetaStart = degToRad(arc.centerAngleDeg) - thetaLength * 0.5;
    const geometry = new RingGeometry(
      innerRadius,
      outerRadius,
      options.simplified ? 48 : 96,
      5,
      thetaStart,
      thetaLength
    );

    geometry.rotateX(-Math.PI / 2);
    geometry.computeVertexNormals();

    const material = createRingMaterial(
      innerRadius,
      outerRadius,
      arc.opacity,
      arc.colorInner,
      arc.colorOuter
    );
    const mesh = new Mesh(geometry, material);
    mesh.name = `Neptune ${arc.displayName} Adams ring arc`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.renderOrder = 18;
    mesh.userData = arc;
    group.add(mesh);
    ringMaterials.push({ sourceName: arc.displayName, material });
  }

  group.add(createRingParticleLayer(options));
  return { group, ringMaterials };
}

function createRingMaterial(
  innerRadius: number,
  outerRadius: number,
  opacity: number,
  colorInner: number,
  colorOuter: number
): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader: neptuneRingVertexShader,
    fragmentShader: neptuneRingFragmentShader,
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uInnerRadius: new Uniform(innerRadius),
      uOuterRadius: new Uniform(outerRadius),
      uOpacity: new Uniform(opacity),
      uTime: new Uniform(0),
      uPlanetRadius: new Uniform(NEPTUNE_EQUATORIAL_RADIUS_SCENE_UNITS),
      uColorInner: new Uniform(new Color(colorInner)),
      uColorOuter: new Uniform(new Color(colorOuter)),
      uSunDirectionWorld: new Uniform(new Vector3(1, 0, 0)),
      uPlanetCenterWorld: new Uniform(new Vector3())
    }
  });
}

function createRingParticleLayer(
  options: NeptuneRingsOptions
): Points<BufferGeometry, PointsMaterial> {
  const random = seededRandom(1_989_0825);
  const positions: number[] = [];
  const colors: number[] = [];

  for (const ring of NEPTUNE_RINGS) {
    const particleCount = options.simplified
      ? Math.max(55, Math.floor(ring.particleCount * 0.42))
      : ring.particleCount;
    addRingParticles(ring, particleCount, random, positions, colors);
  }

  for (const arc of NEPTUNE_RING_ARCS) {
    const particleCount = options.simplified ? 70 : 170;
    addArcParticles(arc, particleCount, random, positions, colors);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute("color", new BufferAttribute(new Float32Array(colors), 3));

  const material = new PointsMaterial({
    size: 0.010,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.22,
    vertexColors: true,
    blending: AdditiveBlending,
    depthWrite: false
  });

  const particles = new Points(geometry, material);
  particles.name = "Neptune sparse ring and arc particles";
  particles.renderOrder = 22;
  attachDistanceFade(particles, material.opacity, 14, 45);
  return particles;
}

function addRingParticles(
  ring: NeptuneRingDefinition,
  particleCount: number,
  random: () => number,
  positions: number[],
  colors: number[]
): void {
  const { innerRadius, outerRadius } = getVisualRingBounds(ring);
  const colorInner = new Color(ring.colorInner);
  const colorOuter = new Color(ring.colorOuter);
  const verticalScale = ring.family === "plateauDiffuse" ? 0.018 : 0.006;

  for (let index = 0; index < particleCount; index += 1) {
    const radialT = random();
    const radius = Math.sqrt(lerp(innerRadius * innerRadius, outerRadius * outerRadius, radialT));
    const angle = random() * TAU;
    const verticalScatter = (random() - 0.5) * verticalScale;

    positions.push(
      Math.cos(angle) * radius,
      verticalScatter,
      Math.sin(angle) * radius
    );

    const color = colorInner.clone().lerp(colorOuter, radialT);
    const brightness =
      ring.name === "Adams" ? 0.50 + random() * 0.32 : 0.34 + random() * 0.28;
    colors.push(color.r * brightness, color.g * brightness, color.b * brightness);
  }
}

function addArcParticles(
  arc: NeptuneRingArcDefinition,
  particleCount: number,
  random: () => number,
  positions: number[],
  colors: number[]
): void {
  const { innerRadius, outerRadius } = getArcRingBounds(arc);
  const colorInner = new Color(arc.colorInner);
  const colorOuter = new Color(arc.colorOuter);
  const centerAngle = degToRad(arc.centerAngleDeg);
  const angularSpan = degToRad(arc.angularSpanDeg);

  for (let index = 0; index < particleCount; index += 1) {
    const radialT = random();
    const radius = Math.sqrt(lerp(innerRadius * innerRadius, outerRadius * outerRadius, radialT));
    const angle = centerAngle + (random() - 0.5) * angularSpan;
    const verticalScatter = (random() - 0.5) * 0.007;

    positions.push(
      Math.cos(angle) * radius,
      verticalScatter,
      Math.sin(angle) * radius
    );

    const color = colorInner.clone().lerp(colorOuter, radialT);
    const brightness = 0.58 + random() * 0.36;
    colors.push(color.r * brightness, color.g * brightness, color.b * brightness);
  }
}

function getVisualRingBounds(ring: NeptuneRingDefinition): {
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

function getArcRingBounds(arc: NeptuneRingArcDefinition): {
  innerRadius: number;
  outerRadius: number;
} {
  const innerRadiusKm = arc.centerRadiusKm - arc.visualWidthKm * 0.5;
  const outerRadiusKm = arc.centerRadiusKm + arc.visualWidthKm * 0.5;

  return {
    innerRadius: localRadiusFromKm(innerRadiusKm),
    outerRadius: localRadiusFromKm(outerRadiusKm)
  };
}

function localRadiusFromKm(kilometers: number): number {
  return kilometersToNeptuneLocalRadius(
    kilometers,
    NEPTUNE_PHYSICAL.equatorialRadiusKm
  );
}
