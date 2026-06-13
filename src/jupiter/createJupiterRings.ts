import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  Points,
  PointsMaterial,
  RingGeometry
} from "three";
import {
  JUPITER_PHYSICAL,
  JUPITER_RING_BANDS,
  type JupiterRingBandDefinition
} from "./jupiterConstants";
import { kilometersToJupiterLocalRadius } from "../physics/units";
import { attachDistanceFade } from "../utils/distanceFade";
import { lerp, seededRandom } from "../utils/math";

export interface JupiterRingsResult {
  group: Group;
}

export function createJupiterRings(): JupiterRingsResult {
  const group = new Group();
  group.name = "Jupiter faint dust rings";

  for (const band of JUPITER_RING_BANDS) {
    const innerRadius = localRadiusFromKm(band.innerRadiusKm);
    const outerRadius = localRadiusFromKm(band.outerRadiusKm);
    const geometry = new RingGeometry(innerRadius, outerRadius, 360, 16);

    geometry.rotateX(-Math.PI / 2);
    geometry.computeVertexNormals();

    const material = new MeshBasicMaterial({
      color: band.color,
      transparent: true,
      opacity: band.opacity,
      side: DoubleSide,
      depthWrite: false,
      blending: AdditiveBlending
    });

    const mesh = new Mesh(geometry, material);
    mesh.name = `Jupiter ${band.name} ring`;
    mesh.renderOrder = 8;
    group.add(mesh);
  }

  group.add(createDustParticleLayer());

  return { group };
}

function createDustParticleLayer(): Points<BufferGeometry, PointsMaterial> {
  const random = seededRandom(1_979_0305);
  const positions: number[] = [];
  const colors: number[] = [];

  for (const band of JUPITER_RING_BANDS) {
    addBandParticles(band, random, positions, colors);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute("color", new BufferAttribute(new Float32Array(colors), 3));

  const material = new PointsMaterial({
    size: 0.015,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.28,
    vertexColors: true,
    blending: AdditiveBlending,
    depthWrite: false
  });

  const particles = new Points(geometry, material);
  particles.name = "Jupiter ring dust particles";
  particles.renderOrder = 12;
  attachDistanceFade(particles, material.opacity, 20, 60);
  return particles;
}

function addBandParticles(
  band: JupiterRingBandDefinition,
  random: () => number,
  positions: number[],
  colors: number[]
): void {
  const inner = localRadiusFromKm(band.innerRadiusKm);
  const outer = localRadiusFromKm(band.outerRadiusKm);
  const color = new Color(band.color);

  for (let index = 0; index < band.particleCount; index += 1) {
    const radialT = random();
    const radius = Math.sqrt(lerp(inner * inner, outer * outer, radialT));
    const angle = random() * Math.PI * 2;
    const verticalScatter = (random() - 0.5) * 0.08;

    positions.push(
      Math.cos(angle) * radius,
      verticalScatter,
      Math.sin(angle) * radius
    );

    const brightness = 0.55 + random() * 0.45;
    colors.push(color.r * brightness, color.g * brightness, color.b * brightness);
  }
}

function localRadiusFromKm(kilometers: number): number {
  return kilometersToJupiterLocalRadius(
    kilometers,
    JUPITER_PHYSICAL.equatorialRadiusKm
  );
}
