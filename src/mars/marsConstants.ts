import {
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR
} from "../physics/units";
import type { OrbitalElements } from "../physics/orbitalMechanics";
import { degToRad, TAU } from "../utils/math";

export const MARS_DESCRIPTION =
  "A cold terrestrial planet with a thin carbon-dioxide atmosphere, oxidized dust, basaltic plains, polar ice caps, giant volcanoes, canyon systems, seasonal dust activity, and two small irregular moons, Phobos and Deimos.";

export const MARS_PHYSICAL = {
  meanRadiusKm: 3_389.5,
  equatorialRadiusKm: 3_396.19,
  polarRadiusKm: 3_376.2,
  massKg: 6.416_91e23,
  rotationPeriodHours: 24.622_96,
  axialTiltDeg: 25.2,
  meanDensityGramsPerCubicCentimeter: 3.934,
  surfaceGravityMetersPerSecondSquared: 3.71,
  escapeVelocityKmPerSecond: 5.03,
  atmosphere: ["carbon dioxide", "nitrogen", "argon"] as const,
  moonCount: 2,
  meanSurfacePressureMillibar: 6,
  atmosphericScaleHeightKm: 10.605,
  effectiveTemperatureK: 210,
  geometricAlbedo: 0.15
};

export const MARS_ORBIT = {
  semiMajorAxisAU: 1.5237,
  eccentricity: 0.093_329,
  orbitalPeriodEarthYears: 1.880_85,
  orbitalPeriodDays: 686.98,
  orbitalInclinationDeg: 1.85,
  meanOrbitalVelocityKmPerSecond: 24.13
};

export const MARS_ROTATION_PERIOD_SECONDS =
  MARS_PHYSICAL.rotationPeriodHours * SECONDS_PER_HOUR;

export const MARS_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND =
  TAU / MARS_ROTATION_PERIOD_SECONDS;

export const MARS_AXIAL_TILT_RAD = degToRad(MARS_PHYSICAL.axialTiltDeg);

export const MARS_POLAR_TO_EQUATORIAL_RATIO =
  MARS_PHYSICAL.polarRadiusKm / MARS_PHYSICAL.equatorialRadiusKm;

export const MARS_ORBITAL_ELEMENTS: OrbitalElements = {
  semiMajorAxisAU: MARS_ORBIT.semiMajorAxisAU,
  eccentricity: MARS_ORBIT.eccentricity,
  inclinationRad: degToRad(MARS_ORBIT.orbitalInclinationDeg),
  orbitalPeriodSeconds: MARS_ORBIT.orbitalPeriodDays * SECONDS_PER_DAY,
  // JPL approximate planetary elements: mean longitude -4.55343205 deg minus
  // longitude of perihelion -23.94362959 deg at the shared J2000 epoch.
  meanAnomalyAtEpochRad: degToRad(19.390_197_54)
};

export interface MartianMoonDefinition {
  name: "Phobos" | "Deimos";
  meanRadiusKm: number;
  massKg: number;
  meanDensityGramsPerCubicCentimeter: number;
  semiMajorAxisKm: number;
  eccentricity: number;
  orbitalPeriodDays: number;
  orbitalInclinationDeg: number;
  meanAnomalyAtEpochDeg: number;
  color: number;
  feature: string;
}

export const MARTIAN_MOONS: MartianMoonDefinition[] = [
  {
    name: "Phobos",
    meanRadiusKm: 11.08,
    massKg: 1.06e16,
    meanDensityGramsPerCubicCentimeter: 1.872,
    semiMajorAxisKm: 9_375,
    eccentricity: 0.015,
    orbitalPeriodDays: 0.3187,
    orbitalInclinationDeg: 1.1,
    meanAnomalyAtEpochDeg: 92.4,
    color: 0x8a7668,
    feature: "Stickney crater, grooved regolith, inward tidal evolution"
  },
  {
    name: "Deimos",
    meanRadiusKm: 6.2,
    massKg: 1.44e15,
    meanDensityGramsPerCubicCentimeter: 1.471,
    semiMajorAxisKm: 23_457,
    eccentricity: 0,
    orbitalPeriodDays: 1.2625,
    orbitalInclinationDeg: 1.8,
    meanAnomalyAtEpochDeg: 296.2,
    color: 0x9b8d80,
    feature: "smooth regolith-mantled surface, slowly expanding orbit"
  }
];

export const MARS_MOON_ORBIT_VISUAL_COMPRESSION = 0.55;

export const MARS_MOON_VISUAL_RADIUS_BOOST = 42;

export const MARS_MOON_ORBITAL_PERIOD_SECONDS = (periodDays: number): number =>
  periodDays * SECONDS_PER_DAY;
