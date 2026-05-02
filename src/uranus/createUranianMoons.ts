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
  URANUS_INNER_MOON_VISUAL_RADIUS,
  URANUS_IRREGULAR_MOON_VISUAL_RADIUS,
  URANUS_IRREGULAR_ORBIT_INNER_SCENE_RADIUS,
  URANUS_IRREGULAR_ORBIT_OUTER_SCENE_RADIUS,
  URANUS_MAJOR_MOON_VISUAL_RADIUS_BOOST,
  URANUS_MOON_ORBITAL_PERIOD_SECONDS,
  URANUS_MOONS,
  URANUS_OUTER_IRREGULAR_MOONS,
  URANUS_PHYSICAL,
  type UranusMoonDefinition
} from "./uranusConstants";
import { solveKeplerOrbit } from "../physics/keplerSolver";
import { kilometersToUranusLocalRadius } from "../physics/units";
import { clamp, degToRad, TAU } from "../utils/math";

export interface UranianMoonEntry {
  definition: UranusMoonDefinition;
  orbitTiltGroup: Group;
  orbitPath: LineLoop;
  mesh: Mesh<SphereGeometry, MeshStandardMaterial>;
}

export interface UranianMoonsResult {
  regularGroup: Group;
  irregularGroup: Group;
  entries: UranianMoonEntry[];
  update: (elapsedSimulationSeconds: number) => void;
  setDebugVisible: (visible: boolean) => void;
}

const IRREGULAR_MIN_DISTANCE_KM = Math.min(
  ...URANUS_OUTER_IRREGULAR_MOONS.map(
    (moon) => moon.semiMajorAxisKm * (1 - moon.eccentricity)
  )
);

const IRREGULAR_MAX_DISTANCE_KM = Math.max(
  ...URANUS_OUTER_IRREGULAR_MOONS.map(
    (moon) => moon.semiMajorAxisKm * (1 + moon.eccentricity)
  )
);

export function createUranianMoons(): UranianMoonsResult {
  const regularGroup = new Group();
  regularGroup.name = "Uranus regular moons in equatorial plane";

  const irregularGroup = new Group();
  irregularGroup.name = "Uranus distant irregular moons";

  const entries = URANUS_MOONS.map(createMoonEntry);

  for (const entry of entries) {
    if (entry.definition.group === "outerIrregular") {
      irregularGroup.add(entry.orbitTiltGroup);
    } else {
      regularGroup.add(entry.orbitTiltGroup);
    }
  }

  return {
    regularGroup,
    irregularGroup,
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

function createMoonEntry(definition: UranusMoonDefinition): UranianMoonEntry {
  const orbitTiltGroup = new Group();
  orbitTiltGroup.name = `${definition.displayName} ${definition.group} orbit plane`;
  orbitTiltGroup.rotation.z = degToRad(definition.orbitalInclinationDeg);

  const orbitPath = createMoonOrbitPath(definition);
  orbitTiltGroup.add(orbitPath);

  const material = new MeshStandardMaterial({
    color: new Color(definition.color),
    roughness: definition.group === "major" ? 0.86 : 0.94,
    metalness: 0
  });

  const mesh = new Mesh(
    new SphereGeometry(getVisualMoonRadius(definition), 36, 18),
    material
  );
  mesh.name = `${definition.displayName} Uranian moon`;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    ...definition,
    visualRadiusSceneUnits: getVisualMoonRadius(definition),
    renderedOrbitScale:
      definition.group === "outerIrregular" ? "nonlinear compressed" : "true local"
  };
  orbitTiltGroup.add(mesh);

  const entry = { definition, orbitTiltGroup, orbitPath, mesh };
  updateMoonPosition(entry, 0);
  return entry;
}

function updateMoonPosition(
  entry: UranianMoonEntry,
  elapsedSimulationSeconds: number
): void {
  const definition = entry.definition;
  const direction = definition.orbitDirection === "retrograde" ? -1 : 1;
  const meanAnomalyRad =
    (degToRad(definition.meanAnomalyAtEpochDeg) +
      direction *
        (elapsedSimulationSeconds / URANUS_MOON_ORBITAL_PERIOD_SECONDS(
          definition.orbitalPeriodDays
        )) *
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
  entry.mesh.rotation.y = meanAnomalyRad * 0.35;
}

function createMoonOrbitPath(definition: UranusMoonDefinition): LineLoop {
  const points: Vector3[] = [];
  const samples = definition.group === "outerIrregular" ? 340 : 260;

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
  definition: UranusMoonDefinition,
  meanAnomalyRad: number
): { radius: number; trueAnomalyRad: number } {
  if (definition.group === "outerIrregular") {
    const kepler = solveKeplerOrbit(
      meanAnomalyRad,
      definition.eccentricity,
      definition.semiMajorAxisKm
    );

    return {
      radius: irregularDistanceToSceneRadius(kepler.radiusAU),
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

function irregularDistanceToSceneRadius(distanceKm: number): number {
  const t = clamp(
    (distanceKm - IRREGULAR_MIN_DISTANCE_KM) /
      (IRREGULAR_MAX_DISTANCE_KM - IRREGULAR_MIN_DISTANCE_KM),
    0,
    1
  );
  return (
    URANUS_IRREGULAR_ORBIT_INNER_SCENE_RADIUS +
    Math.sqrt(t) *
      (URANUS_IRREGULAR_ORBIT_OUTER_SCENE_RADIUS -
        URANUS_IRREGULAR_ORBIT_INNER_SCENE_RADIUS)
  );
}

function getVisualMoonRadius(definition: UranusMoonDefinition): number {
  if (definition.meanRadiusKm) {
    return Math.max(
      localRadiusFromKm(definition.meanRadiusKm) *
        URANUS_MAJOR_MOON_VISUAL_RADIUS_BOOST,
      0.026
    );
  }

  if (definition.group === "outerIrregular") {
    return URANUS_IRREGULAR_MOON_VISUAL_RADIUS;
  }

  return URANUS_INNER_MOON_VISUAL_RADIUS;
}

function getOrbitColor(definition: UranusMoonDefinition): Color {
  if (definition.group === "major") {
    return new Color(definition.color).lerp(new Color(0xa9e7e6), 0.35);
  }

  if (definition.group === "outerIrregular") {
    return new Color(0x8f806e);
  }

  return new Color(0x5b8d91);
}

function getOrbitOpacity(definition: UranusMoonDefinition): number {
  if (definition.group === "major") {
    return 0.24;
  }

  if (definition.group === "outerIrregular") {
    return 0.13;
  }

  return 0.15;
}

function localRadiusFromKm(kilometers: number): number {
  return kilometersToUranusLocalRadius(
    kilometers,
    URANUS_PHYSICAL.equatorialRadiusKm
  );
}
