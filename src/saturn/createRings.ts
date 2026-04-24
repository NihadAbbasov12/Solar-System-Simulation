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
  RING_BANDS,
  SATURN_PHYSICAL,
  type RingBandDefinition
} from "./saturnConstants";
import { ringFragmentShader, ringVertexShader } from "./saturnShaders";
import {
  kilometersToSaturnLocalRadius,
  SATURN_EQUATORIAL_RADIUS_SCENE_UNITS
} from "../physics/units";
import { lerp, seededRandom } from "../utils/math";

export interface RingMaterialEntry {
  band: RingBandDefinition;
  material: ShaderMaterial;
}

export interface RingsResult {
  group: Group;
  ringMaterials: RingMaterialEntry[];
}

export function createRings(): RingsResult {
  const group = new Group();
  group.name = "Saturn rings in equatorial plane";

  const ringMaterials: RingMaterialEntry[] = [];

  for (const band of RING_BANDS) {
    const innerRadius = localRadiusFromKm(band.innerRadiusKm);
    const outerRadius = localRadiusFromKm(band.outerRadiusKm);
    const geometry = new RingGeometry(innerRadius, outerRadius, 640, 36);

    // Three's RingGeometry starts in the XY plane. Saturn's local rotation
    // axis is +Y, so the rings must sit in the XZ equatorial plane.
    geometry.rotateX(-Math.PI / 2);
    geometry.computeVertexNormals();

    const material = createRingMaterial(band, innerRadius, outerRadius);
    const mesh = new Group();
    const ringMesh = new Mesh(geometry, material);
    ringMesh.name = `${band.name} ring band`;
    ringMesh.castShadow = true;
    ringMesh.receiveShadow = true;
    ringMesh.renderOrder = 10;
    mesh.add(ringMesh);
    group.add(mesh);
    ringMaterials.push({ band, material });
  }

  group.add(createRingParticleLayer());

  return { group, ringMaterials };
}

function createRingMaterial(
  band: RingBandDefinition,
  innerRadius: number,
  outerRadius: number
): ShaderMaterial {
  const gapRadius = band.gapCenterKm ? localRadiusFromKm(band.gapCenterKm) : 0;
  const gapWidth = band.gapWidthKm
    ? localRadiusFromKm(band.gapWidthKm)
    : 0;

  return new ShaderMaterial({
    vertexShader: ringVertexShader,
    fragmentShader: ringFragmentShader,
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uInnerRadius: new Uniform(innerRadius),
      uOuterRadius: new Uniform(outerRadius),
      uOpacity: new Uniform(band.opacity),
      uTime: new Uniform(0),
      uGapRadius: new Uniform(gapRadius),
      uGapWidth: new Uniform(gapWidth),
      uGapDepth: new Uniform(band.gapDepth ?? 0),
      uPlanetRadius: new Uniform(SATURN_EQUATORIAL_RADIUS_SCENE_UNITS),
      uColorInner: new Uniform(new Color(band.colorInner)),
      uColorOuter: new Uniform(new Color(band.colorOuter)),
      uSunDirectionWorld: new Uniform(new Vector3(1, 0, 0)),
      uPlanetCenterWorld: new Uniform(new Vector3(0, 0, 0))
    }
  });
}

function createRingParticleLayer(): Points<BufferGeometry, PointsMaterial> {
  const random = seededRandom(1_986_1112);
  const positions: number[] = [];
  const colors: number[] = [];

  for (const band of RING_BANDS) {
    const inner = localRadiusFromKm(band.innerRadiusKm);
    const outer = localRadiusFromKm(band.outerRadiusKm);
    const colorInner = new Color(band.colorInner);
    const colorOuter = new Color(band.colorOuter);

    for (let index = 0; index < band.particleCount; index += 1) {
      const radialT = random();
      const radius = Math.sqrt(lerp(inner * inner, outer * outer, radialT));
      const angle = random() * Math.PI * 2;
      const verticalScatter = (random() - 0.5) * 0.014;
      positions.push(
        Math.cos(angle) * radius,
        verticalScatter,
        Math.sin(angle) * radius
      );

      const color = colorInner.clone().lerp(colorOuter, radialT);
      const brightness = 0.72 + random() * 0.36;
      colors.push(color.r * brightness, color.g * brightness, color.b * brightness);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute("color", new BufferAttribute(new Float32Array(colors), 3));

  const material = new PointsMaterial({
    size: 0.018,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.42,
    vertexColors: true,
    blending: AdditiveBlending,
    depthWrite: false
  });

  const particles = new Points(geometry, material);
  particles.name = "Procedural ring particles";
  particles.renderOrder = 20;
  return particles;
}

function localRadiusFromKm(kilometers: number): number {
  return kilometersToSaturnLocalRadius(
    kilometers,
    SATURN_PHYSICAL.equatorialRadiusKm
  );
}
