import { auToKilometers } from "./units";
import { solveKeplerOrbit } from "./keplerSolver";
import { normalizeRadians, TAU } from "../utils/math";

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export interface OrbitalElements {
  semiMajorAxisAU: number;
  eccentricity: number;
  inclinationRad: number;
  orbitalPeriodSeconds: number;
  meanAnomalyAtEpochRad: number;
}

export interface OrbitalState {
  meanAnomalyRad: number;
  eccentricAnomalyRad: number;
  trueAnomalyRad: number;
  radiusAU: number;
  distanceKm: number;
  positionAU: Vector3Like;
  iterations: number;
}

export function meanMotionRadPerSecond(orbitalPeriodSeconds: number): number {
  return TAU / orbitalPeriodSeconds;
}

export function meanAnomalyAtElapsedTime(
  elements: OrbitalElements,
  elapsedSeconds: number
): number {
  return normalizeRadians(
    elements.meanAnomalyAtEpochRad +
      meanMotionRadPerSecond(elements.orbitalPeriodSeconds) * elapsedSeconds
  );
}

export function calculateOrbitalState(
  elements: OrbitalElements,
  elapsedSeconds: number
): OrbitalState {
  const meanAnomalyRad = meanAnomalyAtElapsedTime(elements, elapsedSeconds);
  const kepler = solveKeplerOrbit(
    meanAnomalyRad,
    elements.eccentricity,
    elements.semiMajorAxisAU
  );

  // Perifocal coordinates with the Sun at one focus. The x-axis points to
  // perihelion. We rotate the orbital plane around x by the inclination.
  const orbitalPlaneX = kepler.radiusAU * Math.cos(kepler.trueAnomalyRad);
  const orbitalPlaneZ = kepler.radiusAU * Math.sin(kepler.trueAnomalyRad);
  const cosI = Math.cos(elements.inclinationRad);
  const sinI = Math.sin(elements.inclinationRad);

  return {
    meanAnomalyRad,
    eccentricAnomalyRad: kepler.eccentricAnomalyRad,
    trueAnomalyRad: kepler.trueAnomalyRad,
    radiusAU: kepler.radiusAU,
    distanceKm: auToKilometers(kepler.radiusAU),
    positionAU: {
      x: orbitalPlaneX,
      y: -orbitalPlaneZ * sinI,
      z: orbitalPlaneZ * cosI
    },
    iterations: kepler.iterations
  };
}

export function sampleOrbitPath(
  elements: OrbitalElements,
  samples = 720
): Vector3Like[] {
  const points: Vector3Like[] = [];

  for (let index = 0; index < samples; index += 1) {
    const meanAnomalyRad = (index / samples) * TAU;
    const kepler = solveKeplerOrbit(
      meanAnomalyRad,
      elements.eccentricity,
      elements.semiMajorAxisAU
    );
    const orbitalPlaneX = kepler.radiusAU * Math.cos(kepler.trueAnomalyRad);
    const orbitalPlaneZ = kepler.radiusAU * Math.sin(kepler.trueAnomalyRad);
    const cosI = Math.cos(elements.inclinationRad);
    const sinI = Math.sin(elements.inclinationRad);

    points.push({
      x: orbitalPlaneX,
      y: -orbitalPlaneZ * sinI,
      z: orbitalPlaneZ * cosI
    });
  }

  return points;
}
