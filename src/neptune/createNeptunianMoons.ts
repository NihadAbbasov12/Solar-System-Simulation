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
  NEPTUNE_DISTANT_MOON_VISUAL_RADIUS,
  NEPTUNE_DISTANT_MOONS,
  NEPTUNE_DISTANT_ORBIT_INNER_SCENE_RADIUS,
  NEPTUNE_DISTANT_ORBIT_OUTER_SCENE_RADIUS,
  NEPTUNE_MEDIUM_MOON_VISUAL_RADIUS,
  NEPTUNE_MOON_ORBITAL_PERIOD_SECONDS,
  NEPTUNE_MOON_VISUAL_RADIUS_BOOST,
  NEPTUNE_MOONS,
  NEPTUNE_PHYSICAL,
  NEPTUNE_SMALL_MOON_VISUAL_RADIUS,
  NEPTUNE_TRITON_VISUAL_RADIUS_BOOST,
  type NeptuneMoonDefinition
} from "./neptuneConstants";
import { solveKeplerOrbit } from "../physics/keplerSolver";
import { kilometersToNeptuneLocalRadius } from "../physics/units";
import { clamp, degToRad, TAU } from "../utils/math";

export interface NeptunianMoonEntry {
  definition: NeptuneMoonDefinition;
  orbitTiltGroup: Group;
  orbitPath: LineLoop;
  mesh: Mesh<SphereGeometry, MeshStandardMaterial>;
}

export interface NeptunianMoonsResult {
  regularGroup: Group;
  distantGroup: Group;
  entries: NeptunianMoonEntry[];
  update: (elapsedSimulationSeconds: number) => void;
  setDebugVisible: (visible: boolean) => void;
}

const DISTANT_MIN_DISTANCE_KM = Math.min(
  ...NEPTUNE_DISTANT_MOONS.map(
    (moon) => moon.semiMajorAxisKm * (1 - moon.eccentricity)
  )
);

const DISTANT_MAX_DISTANCE_KM = Math.max(
  ...NEPTUNE_DISTANT_MOONS.map(
    (moon) => moon.semiMajorAxisKm * (1 + moon.eccentricity)
  )
);

export function createNeptunianMoons(): NeptunianMoonsResult {
  const regularGroup = new Group();
  regularGroup.name = "Neptune inner moons and retrograde Triton";

  const distantGroup = new Group();
  distantGroup.name = "Neptune Nereid and distant irregular moons";

  const entries = NEPTUNE_MOONS.map(createMoonEntry);

  for (const entry of entries) {
    if (isDistantMoon(entry.definition)) {
      distantGroup.add(entry.orbitTiltGroup);
    } else {
      regularGroup.add(entry.orbitTiltGroup);
    }
  }

  return {
    regularGroup,
    distantGroup,
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

function createMoonEntry(definition: NeptuneMoonDefinition): NeptunianMoonEntry {
  const orbitTiltGroup = new Group();
  orbitTiltGroup.name = `${definition.displayName} ${definition.group} orbit plane`;
  orbitTiltGroup.rotation.z = degToRad(definition.orbitalInclinationDeg);

  const orbitPath = createMoonOrbitPath(definition);
  orbitTiltGroup.add(orbitPath);

  const material = new MeshStandardMaterial({
    color: new Color(definition.color),
    roughness: definition.modelDetail === "detailedBody" ? 0.78 : 0.92,
    metalness: 0
  });

  const mesh = new Mesh(
    new SphereGeometry(getVisualMoonRadius(definition), 40, 20),
    material
  );
  mesh.name = `${definition.displayName} Neptunian moon`;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    ...definition,
    visualRadiusSceneUnits: getVisualMoonRadius(definition),
    renderedOrbitScale: isDistantMoon(definition)
      ? "nonlinear compressed"
      : "true local"
  };
  orbitTiltGroup.add(mesh);

  const entry = { definition, orbitTiltGroup, orbitPath, mesh };
  updateMoonPosition(entry, 0);
  return entry;
}

function updateMoonPosition(
  entry: NeptunianMoonEntry,
  elapsedSimulationSeconds: number
): void {
  const definition = entry.definition;
  const direction = definition.orbitDirection === "retrograde" ? -1 : 1;
  const meanAnomalyRad =
    (degToRad(definition.meanAnomalyAtEpochDeg) +
      direction *
        (elapsedSimulationSeconds /
          NEPTUNE_MOON_ORBITAL_PERIOD_SECONDS(definition.orbitalPeriodDays)) *
        TAU) %
    TAU;

  const { radius, trueAnomalyRad } = solveMoonSceneOrbit(
    definition,
    meanAnomalyRad
  );
  entry.mesh.position.set(
    radius * Math.cos(trueAnomalyRad),
    0,
    radius * Math.sin(trueAnomalyRad)
  );
  entry.mesh.rotation.y = meanAnomalyRad * 0.28;
}

function createMoonOrbitPath(definition: NeptuneMoonDefinition): LineLoop {
  const points: Vector3[] = [];
  const samples = isDistantMoon(definition) ? 360 : 260;

  for (let index = 0; index < samples; index += 1) {
    const meanAnomalyRad = (index / samples) * TAU;
    const { radius, trueAnomalyRad } = solveMoonSceneOrbit(
      definition,
      meanAnomalyRad
    );
    points.push(
      new Vector3(
        radius * Math.cos(trueAnomalyRad),
        0,
        radius * Math.sin(trueAnomalyRad)
      )
    );
  }

  const geometry = new BufferGeometry().setFromPoints(points);
  const material = new LineBasicMaterial({
    color: getOrbitColor(definition),
    transparent: true,
    opacity: getOrbitOpacity(definition)
  });

  const line = new LineLoop(geometry, material);
  line.name = `${definition.displayName} mean orbital path`;
  line.visible = false;
  return line;
}

function solveMoonSceneOrbit(
  definition: NeptuneMoonDefinition,
  meanAnomalyRad: number
): { radius: number; trueAnomalyRad: number } {
  if (isDistantMoon(definition)) {
    const kepler = solveKeplerOrbit(
      meanAnomalyRad,
      definition.eccentricity,
      definition.semiMajorAxisKm
    );

    return {
      radius: distantDistanceToSceneRadius(kepler.radiusAU),
      trueAnomalyRad: kepler.trueAnomalyRad
    };
  }

  const kepler = solveKeplerOrbit(
    meanAnomalyRad,
    definition.eccentricity,
    localRadiusFromKm(definition.semiMajorAxisKm)
  );

  return {
    radius: kepler.radiusAU,
    trueAnomalyRad: kepler.trueAnomalyRad
  };
}

function distantDistanceToSceneRadius(distanceKm: number): number {
  const t = clamp(
    (distanceKm - DISTANT_MIN_DISTANCE_KM) /
      (DISTANT_MAX_DISTANCE_KM - DISTANT_MIN_DISTANCE_KM),
    0,
    1
  );
  return (
    NEPTUNE_DISTANT_ORBIT_INNER_SCENE_RADIUS +
    Math.sqrt(t) *
      (NEPTUNE_DISTANT_ORBIT_OUTER_SCENE_RADIUS -
        NEPTUNE_DISTANT_ORBIT_INNER_SCENE_RADIUS)
  );
}

function getVisualMoonRadius(definition: NeptuneMoonDefinition): number {
  if (definition.group === "majorCaptured" && definition.meanRadiusKm) {
    return Math.max(
      localRadiusFromKm(definition.meanRadiusKm) *
        NEPTUNE_TRITON_VISUAL_RADIUS_BOOST,
      0.07
    );
  }

  if (definition.modelDetail === "mediumDetailBody" && definition.meanRadiusKm) {
    return Math.max(
      localRadiusFromKm(definition.meanRadiusKm) *
        NEPTUNE_MOON_VISUAL_RADIUS_BOOST,
      NEPTUNE_MEDIUM_MOON_VISUAL_RADIUS
    );
  }

  if (definition.group === "outerIrregular") {
    return NEPTUNE_DISTANT_MOON_VISUAL_RADIUS;
  }

  return NEPTUNE_SMALL_MOON_VISUAL_RADIUS;
}

function getOrbitColor(definition: NeptuneMoonDefinition): Color {
  if (definition.group === "majorCaptured") {
    return new Color(0xded3c8);
  }

  if (definition.group === "transitional") {
    return new Color(0x9a8373);
  }

  if (definition.group === "outerIrregular") {
    return definition.orbitDirection === "retrograde"
      ? new Color(0x867168)
      : new Color(0x8f806d);
  }

  return new Color(0x5d8a91);
}

function getOrbitOpacity(definition: NeptuneMoonDefinition): number {
  if (definition.group === "majorCaptured") {
    return 0.24;
  }

  if (definition.group === "transitional") {
    return 0.16;
  }

  if (definition.group === "outerIrregular") {
    return 0.12;
  }

  return 0.15;
}

function isDistantMoon(definition: NeptuneMoonDefinition): boolean {
  return (
    definition.group === "transitional" ||
    definition.group === "outerIrregular"
  );
}

function localRadiusFromKm(kilometers: number): number {
  return kilometersToNeptuneLocalRadius(
    kilometers,
    NEPTUNE_PHYSICAL.equatorialRadiusKm
  );
}
