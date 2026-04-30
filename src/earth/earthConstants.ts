import {
  EARTH_YEAR_DAYS,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR
} from "../physics/units";
import { degToRad, TAU } from "../utils/math";
import type { OrbitalElements } from "../physics/orbitalMechanics";

export const EARTH_DESCRIPTION =
  "A rocky terrestrial planet, third from the Sun, with a dense nitrogen-oxygen atmosphere over blue ocean basins. Continents, cloud systems, polar ice, mountain chains, and deserts share a surface continuously reshaped by weather, erosion, and plate tectonics. A strong magnetic field helps shield the planet, stable liquid water persists at the surface, and Earth remains the only confirmed world known to host life. Its single Moon raises ocean tides and helps stabilize the planet's axial behavior.";

export const EARTH_PHYSICAL = {
  meanRadiusKm: 6_371,
  equatorialRadiusKm: 6_378.137,
  polarRadiusKm: 6_356.752,
  massKg: 5.9722e24,
  rotationPeriodHours: 23.9345,
  axialTiltDeg: 23.44,
  meanDensityGramsPerCubicCentimeter: 5.514,
  atmosphere: ["nitrogen", "oxygen"] as const,
  moonCount: 1
};

export const EARTH_ORBIT = {
  semiMajorAxisAU: 1,
  eccentricity: 0.0167,
  orbitalPeriodEarthYears: 1,
  orbitalInclinationDeg: 0.00005,
  meanOrbitalVelocityKmPerSecond: 29.78
};

export const MOON_PHYSICAL = {
  meanRadiusKm: 1_737.4,
  semiMajorAxisKm: 384_399,
  orbitalPeriodDays: 27.321_661,
  orbitalInclinationDeg: 5.145,
  meanOrbitalVelocityKmPerSecond: 1.022
};

export const EARTH_ROTATION_PERIOD_SECONDS =
  EARTH_PHYSICAL.rotationPeriodHours * SECONDS_PER_HOUR;

export const EARTH_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND =
  TAU / EARTH_ROTATION_PERIOD_SECONDS;

export const EARTH_AXIAL_TILT_RAD = degToRad(EARTH_PHYSICAL.axialTiltDeg);

export const EARTH_POLAR_TO_EQUATORIAL_RATIO =
  EARTH_PHYSICAL.polarRadiusKm / EARTH_PHYSICAL.equatorialRadiusKm;

export const EARTH_ORBITAL_ELEMENTS: OrbitalElements = {
  semiMajorAxisAU: EARTH_ORBIT.semiMajorAxisAU,
  eccentricity: EARTH_ORBIT.eccentricity,
  inclinationRad: degToRad(EARTH_ORBIT.orbitalInclinationDeg),
  orbitalPeriodSeconds:
    EARTH_ORBIT.orbitalPeriodEarthYears * EARTH_YEAR_DAYS * SECONDS_PER_DAY,
  // Approximate J2000 phase aligned with the same epoch model used by Saturn.
  meanAnomalyAtEpochRad: degToRad(357.529)
};

export const MOON_ORBITAL_PERIOD_SECONDS =
  MOON_PHYSICAL.orbitalPeriodDays * SECONDS_PER_DAY;

export const MOON_ORBIT_ANGULAR_SPEED_RAD_PER_SECOND =
  TAU / MOON_ORBITAL_PERIOD_SECONDS;

export const MOON_ORBITAL_INCLINATION_RAD = degToRad(
  MOON_PHYSICAL.orbitalInclinationDeg
);

export const MOON_MEAN_ANOMALY_AT_EPOCH_RAD = degToRad(134.963);

// The lunar distance is compressed for readability against the app's existing
// solar orbit scale; physical period, radius ratio, and inclination are kept.
export const MOON_ORBIT_VISUAL_COMPRESSION = 0.18;
