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
  MARS_MOON_ORBIT_VISUAL_COMPRESSION,
  MARS_MOON_VISUAL_RADIUS_BOOST,
  MARS_MOON_ORBITAL_PERIOD_SECONDS,
  MARS_PHYSICAL,
  MARTIAN_MOONS,
  type MartianMoonDefinition
} from "./marsConstants";
import { solveKeplerOrbit } from "../physics/keplerSolver";
import { kilometersToMarsLocalRadius } from "../physics/units";
import { degToRad, TAU } from "../utils/math";

export interface MartianMoonEntry {
  definition: MartianMoonDefinition;
  orbitTiltGroup: Group;
  orbitPath: LineLoop;
  mesh: Mesh<SphereGeometry, MeshStandardMaterial>;
  semiMajorAxisScene: number;
}

export interface MartianMoonsResult {
  group: Group;
  entries: MartianMoonEntry[];
  update: (elapsedSimulationSeconds: number) => void;
  setDebugVisible: (visible: boolean) => void;
}

export function createMartianMoons(): MartianMoonsResult {
  const group = new Group();
  group.name = "Martian moon systems";

  const entries = MARTIAN_MOONS.map(createMoonEntry);

  for (const entry of entries) {
    group.add(entry.orbitTiltGroup);
  }

  return {
    group,
    entries,
    update: (elapsedSimulationSeconds) => {
      for (const entry of entries) {
        updateMoonPosition(entry, elapsedSimulationSeconds);
      }
    },
    setDebugVisible: (visible) => {
      for (const entry of entries) {
        entry.orbitPath.visible = visible;
      }
    }
  };
}

function createMoonEntry(definition: MartianMoonDefinition): MartianMoonEntry {
  const orbitTiltGroup = new Group();
  orbitTiltGroup.name = `${definition.name} nearly equatorial orbit`;
  orbitTiltGroup.rotation.z = degToRad(definition.orbitalInclinationDeg);

  const semiMajorAxisScene =
    localRadiusFromKm(definition.semiMajorAxisKm) *
    MARS_MOON_ORBIT_VISUAL_COMPRESSION;
  const orbitPath = createMoonOrbitPath(definition, semiMajorAxisScene);
  orbitTiltGroup.add(orbitPath);

  const material = new MeshStandardMaterial({
    color: new Color(definition.color),
    roughness: 0.94,
    metalness: 0
  });

  const trueScaledRadius = localRadiusFromKm(definition.meanRadiusKm);
  const visualRadius = Math.max(
    trueScaledRadius * MARS_MOON_VISUAL_RADIUS_BOOST,
    0.025
  );
  const mesh = new Mesh(new SphereGeometry(visualRadius, 40, 20), material);
  mesh.name = `${definition.name} irregular moon`;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    meanRadiusKm: definition.meanRadiusKm,
    massKg: definition.massKg,
    meanDensityGramsPerCubicCentimeter:
      definition.meanDensityGramsPerCubicCentimeter,
    semiMajorAxisKm: definition.semiMajorAxisKm,
    eccentricity: definition.eccentricity,
    orbitalPeriodDays: definition.orbitalPeriodDays,
    feature: definition.feature,
    visualRadiusBoost: MARS_MOON_VISUAL_RADIUS_BOOST
  };
  orbitTiltGroup.add(mesh);

  const entry = {
    definition,
    orbitTiltGroup,
    orbitPath,
    mesh,
    semiMajorAxisScene
  };
  updateMoonPosition(entry, 0);

  return entry;
}

function updateMoonPosition(
  entry: MartianMoonEntry,
  elapsedSimulationSeconds: number
): void {
  const definition = entry.definition;
  const meanAnomalyRad =
    (degToRad(definition.meanAnomalyAtEpochDeg) +
      (elapsedSimulationSeconds / MARS_MOON_ORBITAL_PERIOD_SECONDS(
        definition.orbitalPeriodDays
      )) *
        TAU) %
    TAU;
  const kepler = solveKeplerOrbit(
    meanAnomalyRad,
    definition.eccentricity,
    entry.semiMajorAxisScene
  );

  entry.mesh.position.set(
    kepler.radiusAU * Math.cos(kepler.trueAnomalyRad),
    0,
    kepler.radiusAU * Math.sin(kepler.trueAnomalyRad)
  );
  entry.mesh.rotation.y = meanAnomalyRad * 0.5;
}

function createMoonOrbitPath(
  definition: MartianMoonDefinition,
  semiMajorAxisScene: number
): LineLoop {
  const points: Vector3[] = [];

  for (let index = 0; index < 260; index += 1) {
    const meanAnomalyRad = (index / 260) * TAU;
    const kepler = solveKeplerOrbit(
      meanAnomalyRad,
      definition.eccentricity,
      semiMajorAxisScene
    );
    points.push(
      new Vector3(
        kepler.radiusAU * Math.cos(kepler.trueAnomalyRad),
        0,
        kepler.radiusAU * Math.sin(kepler.trueAnomalyRad)
      )
    );
  }

  const geometry = new BufferGeometry().setFromPoints(points);
  const material = new LineBasicMaterial({
    color: new Color(definition.color),
    transparent: true,
    opacity: 0.26
  });

  const line = new LineLoop(geometry, material);
  line.name = `${definition.name} mean orbital path`;
  line.visible = false;
  return line;
}

function localRadiusFromKm(kilometers: number): number {
  return kilometersToMarsLocalRadius(
    kilometers,
    MARS_PHYSICAL.equatorialRadiusKm
  );
}
