import {
  BufferGeometry,
  Color,
  Group,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3
} from "three";
import {
  GALILEAN_MOONS,
  JUPITER_MOON_ORBIT_VISUAL_COMPRESSION,
  JUPITER_MOON_VISUAL_RADIUS_BOOST,
  JUPITER_PHYSICAL,
  type GalileanMoonDefinition
} from "./jupiterConstants";
import {
  kilometersToJupiterLocalRadius,
  SECONDS_PER_DAY
} from "../physics/units";
import { degToRad, TAU } from "../utils/math";

export interface GalileanMoonEntry {
  definition: GalileanMoonDefinition;
  pivot: Group;
  orbitPath: LineLoop;
  mesh: Mesh<SphereGeometry, MeshStandardMaterial>;
}

export interface GalileanMoonsResult {
  group: Group;
  entries: GalileanMoonEntry[];
  update: (elapsedSimulationSeconds: number) => void;
  setDebugVisible: (visible: boolean) => void;
}

export function createGalileanMoons(): GalileanMoonsResult {
  const group = new Group();
  group.name = "Galilean moon systems";

  const entries = GALILEAN_MOONS.map((definition) => {
    const entry = createMoonEntry(definition);
    group.add(entry.orbitPath.parent ?? entry.orbitPath);
    return entry;
  });

  return {
    group,
    entries,
    update: (elapsedSimulationSeconds) => {
      for (const entry of entries) {
        const angle =
          (degToRad(entry.definition.meanAnomalyAtEpochDeg) +
            elapsedSimulationSeconds *
              (TAU /
                (entry.definition.orbitalPeriodDays * SECONDS_PER_DAY))) %
          TAU;
        entry.pivot.rotation.y = angle;
      }
    },
    setDebugVisible: (visible) => {
      for (const entry of entries) {
        entry.orbitPath.visible = visible;
      }
    }
  };
}

function createMoonEntry(definition: GalileanMoonDefinition): GalileanMoonEntry {
  const orbitTiltGroup = new Group();
  orbitTiltGroup.name = `${definition.name} local Laplace-plane tilt`;
  orbitTiltGroup.rotation.z = degToRad(definition.orbitalInclinationDeg);

  const orbitRadius =
    localRadiusFromKm(definition.semiMajorAxisKm) *
    JUPITER_MOON_ORBIT_VISUAL_COMPRESSION;
  const orbitPath = createMoonOrbitPath(definition, orbitRadius);
  orbitTiltGroup.add(orbitPath);

  const pivot = new Group();
  pivot.name = `${definition.name} orbital pivot`;
  orbitTiltGroup.add(pivot);

  const material = new MeshStandardMaterial({
    color: new Color(definition.color),
    roughness: 0.82,
    metalness: 0.0
  });
  const trueScaledRadius = localRadiusFromKm(definition.meanRadiusKm);
  const visualRadius = Math.max(
    trueScaledRadius * JUPITER_MOON_VISUAL_RADIUS_BOOST,
    0.05
  );
  const mesh = new Mesh(new SphereGeometry(visualRadius, 48, 24), material);
  mesh.name = `${definition.name} visual moon`;
  mesh.position.set(orbitRadius, 0, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    meanRadiusKm: definition.meanRadiusKm,
    semiMajorAxisKm: definition.semiMajorAxisKm,
    orbitalPeriodDays: definition.orbitalPeriodDays,
    visualRadiusBoost: JUPITER_MOON_VISUAL_RADIUS_BOOST
  };
  pivot.add(mesh);

  return { definition, pivot, orbitPath, mesh };
}

function createMoonOrbitPath(
  definition: GalileanMoonDefinition,
  radius: number
): LineLoop {
  const points: Vector3[] = [];

  for (let index = 0; index < 280; index += 1) {
    const angle = (index / 280) * TAU;
    points.push(new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }

  const geometry = new BufferGeometry().setFromPoints(points);
  const material = new LineBasicMaterial({
    color: new Color(definition.color),
    transparent: true,
    opacity: 0.2
  });

  const line = new LineLoop(geometry, material);
  line.name = `${definition.name} mean orbital path`;
  line.visible = false;
  return line;
}

function localRadiusFromKm(kilometers: number): number {
  return kilometersToJupiterLocalRadius(
    kilometers,
    JUPITER_PHYSICAL.equatorialRadiusKm
  );
}
