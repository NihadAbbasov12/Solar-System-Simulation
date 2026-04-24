import { normalizeRadians } from "../utils/math";

export interface KeplerSolution {
  meanAnomalyRad: number;
  eccentricAnomalyRad: number;
  trueAnomalyRad: number;
  radiusAU: number;
  iterations: number;
}

export interface KeplerSolveOptions {
  tolerance?: number;
  maxIterations?: number;
}

export function solveKeplerEquation(
  meanAnomalyRad: number,
  eccentricity: number,
  options: KeplerSolveOptions = {}
): { eccentricAnomalyRad: number; iterations: number } {
  if (eccentricity < 0 || eccentricity >= 1) {
    throw new RangeError("This solver expects elliptical orbits with 0 <= e < 1.");
  }

  const tolerance = options.tolerance ?? 1e-10;
  const maxIterations = options.maxIterations ?? 30;
  const meanAnomaly = normalizeRadians(meanAnomalyRad);

  // Newton-Raphson solves M = E - e * sin(E). For Saturn's modest
  // eccentricity this converges in a few iterations.
  let eccentricAnomaly =
    eccentricity < 0.8 ? meanAnomaly : Math.PI * Math.sign(Math.sin(meanAnomaly));

  if (eccentricAnomaly === 0) {
    eccentricAnomaly = meanAnomaly;
  }

  let iterations = 0;
  for (; iterations < maxIterations; iterations += 1) {
    const residual =
      eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly;
    const derivative = 1 - eccentricity * Math.cos(eccentricAnomaly);
    const delta = residual / derivative;
    eccentricAnomaly -= delta;

    if (Math.abs(delta) < tolerance) {
      break;
    }
  }

  return {
    eccentricAnomalyRad: normalizeRadians(eccentricAnomaly),
    iterations: iterations + 1
  };
}

export function eccentricToTrueAnomaly(
  eccentricAnomalyRad: number,
  eccentricity: number
): number {
  const cosE = Math.cos(eccentricAnomalyRad);
  const sinE = Math.sin(eccentricAnomalyRad);
  const trueAnomaly = Math.atan2(
    Math.sqrt(1 - eccentricity * eccentricity) * sinE,
    cosE - eccentricity
  );

  return normalizeRadians(trueAnomaly);
}

export function solveKeplerOrbit(
  meanAnomalyRad: number,
  eccentricity: number,
  semiMajorAxisAU: number,
  options?: KeplerSolveOptions
): KeplerSolution {
  const meanAnomaly = normalizeRadians(meanAnomalyRad);
  const { eccentricAnomalyRad, iterations } = solveKeplerEquation(
    meanAnomaly,
    eccentricity,
    options
  );
  const trueAnomalyRad = eccentricToTrueAnomaly(
    eccentricAnomalyRad,
    eccentricity
  );
  const radiusAU =
    semiMajorAxisAU * (1 - eccentricity * Math.cos(eccentricAnomalyRad));

  return {
    meanAnomalyRad: meanAnomaly,
    eccentricAnomalyRad,
    trueAnomalyRad,
    radiusAU,
    iterations
  };
}
