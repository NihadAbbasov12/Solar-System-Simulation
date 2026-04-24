import { describe, expect, it } from "vitest";
import { solveKeplerEquation, solveKeplerOrbit } from "./keplerSolver";
import { TAU } from "../utils/math";

describe("Kepler solver", () => {
  it("solves Kepler's equation with a small residual", () => {
    const eccentricity = 0.0565;
    const meanAnomaly = 2.3;
    const { eccentricAnomalyRad } = solveKeplerEquation(
      meanAnomaly,
      eccentricity
    );

    const residual =
      eccentricAnomalyRad -
      eccentricity * Math.sin(eccentricAnomalyRad) -
      meanAnomaly;

    expect(Math.abs(residual)).toBeLessThan(1e-9);
  });

  it("reduces to circular motion when eccentricity is zero", () => {
    const solution = solveKeplerOrbit(1.7, 0, 9.539);

    expect(solution.eccentricAnomalyRad).toBeCloseTo(1.7, 10);
    expect(solution.trueAnomalyRad).toBeCloseTo(1.7, 10);
    expect(solution.radiusAU).toBeCloseTo(9.539, 10);
  });

  it("returns perihelion and aphelion radii for an elliptical orbit", () => {
    const semiMajorAxisAU = 9.539;
    const eccentricity = 0.0565;
    const perihelion = solveKeplerOrbit(0, eccentricity, semiMajorAxisAU);
    const aphelion = solveKeplerOrbit(TAU / 2, eccentricity, semiMajorAxisAU);

    expect(perihelion.radiusAU).toBeCloseTo(
      semiMajorAxisAU * (1 - eccentricity),
      10
    );
    expect(aphelion.radiusAU).toBeCloseTo(
      semiMajorAxisAU * (1 + eccentricity),
      10
    );
  });
});
