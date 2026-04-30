import {
  EARTH_YEAR_DAYS,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR
} from "../physics/units";
import type { OrbitalElements } from "../physics/orbitalMechanics";
import { degToRad, TAU } from "../utils/math";

export const JUPITER_DESCRIPTION =
  "A rapidly rotating gas giant with no solid surface, striped ammonia-rich clouds, long-lived vortices, faint dust rings, a powerful magnetosphere, and 101 officially recognized moons as of March 2026.";

export const JUPITER_PHYSICAL = {
  meanRadiusKm: 69_904.5,
  equatorialRadiusKm: 71_488,
  polarRadiusKm: 66_842,
  massKg: 1.898_125e27,
  standardGravitationalParameterM3PerSecond2: 1.266_865_319e17,
  rotationPeriodHours: 9.925,
  axialTiltDeg: 3.13,
  meanDensityGramsPerCubicCentimeter: 1.3262,
  atmosphere: ["hydrogen", "helium"] as const,
  moonCount: 101,
  effectiveTemperatureK: 126.8,
  cloudTopTemperatureK: 128
};

export const JUPITER_ORBIT = {
  semiMajorAxisAU: 5.202_887,
  eccentricity: 0.048_386_24,
  orbitalPeriodEarthYears: 11.862_615,
  orbitalInclinationDeg: 1.304_396_95,
  meanOrbitalVelocityKmPerSecond: 13.0637
};

export const JUPITER_ROTATION_PERIOD_SECONDS =
  JUPITER_PHYSICAL.rotationPeriodHours * SECONDS_PER_HOUR;

export const JUPITER_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND =
  TAU / JUPITER_ROTATION_PERIOD_SECONDS;

export const JUPITER_AXIAL_TILT_RAD = degToRad(JUPITER_PHYSICAL.axialTiltDeg);

export const JUPITER_POLAR_TO_EQUATORIAL_RATIO =
  JUPITER_PHYSICAL.polarRadiusKm / JUPITER_PHYSICAL.equatorialRadiusKm;

export const JUPITER_ORBITAL_ELEMENTS: OrbitalElements = {
  semiMajorAxisAU: JUPITER_ORBIT.semiMajorAxisAU,
  eccentricity: JUPITER_ORBIT.eccentricity,
  inclinationRad: degToRad(JUPITER_ORBIT.orbitalInclinationDeg),
  orbitalPeriodSeconds:
    JUPITER_ORBIT.orbitalPeriodEarthYears * EARTH_YEAR_DAYS * SECONDS_PER_DAY,
  // JPL approximate planetary elements: mean longitude 34.39644051 deg minus
  // longitude of perihelion 14.72847983 deg at the shared J2000 epoch.
  meanAnomalyAtEpochRad: degToRad(19.66796068)
};

export interface JupiterRingBandDefinition {
  name: "halo" | "main" | "amalthea_gossamer" | "thebe_gossamer";
  innerRadiusKm: number;
  outerRadiusKm: number;
  opacity: number;
  color: number;
  particleCount: number;
}

// Faint dust ring regions, based on the canonical halo/main/gossamer split and
// bounded visually by the source-moon orbits used in the JPL satellite table.
export const JUPITER_RING_BANDS: JupiterRingBandDefinition[] = [
  {
    name: "halo",
    innerRadiusKm: 92_000,
    outerRadiusKm: 122_500,
    opacity: 0.045,
    color: 0xb0a282,
    particleCount: 900
  },
  {
    name: "main",
    innerRadiusKm: 122_500,
    outerRadiusKm: 129_000,
    opacity: 0.12,
    color: 0xd2c3a1,
    particleCount: 1_400
  },
  {
    name: "amalthea_gossamer",
    innerRadiusKm: 129_000,
    outerRadiusKm: 181_400,
    opacity: 0.036,
    color: 0xbba98a,
    particleCount: 1_500
  },
  {
    name: "thebe_gossamer",
    innerRadiusKm: 181_400,
    outerRadiusKm: 221_900,
    opacity: 0.024,
    color: 0xa59478,
    particleCount: 1_200
  }
];

export interface GalileanMoonDefinition {
  name: "Io" | "Europa" | "Ganymede" | "Callisto";
  meanRadiusKm: number;
  semiMajorAxisKm: number;
  orbitalPeriodDays: number;
  orbitalInclinationDeg: number;
  meanAnomalyAtEpochDeg: number;
  color: number;
}

export const GALILEAN_MOONS: GalileanMoonDefinition[] = [
  {
    name: "Io",
    meanRadiusKm: 1_821.49,
    semiMajorAxisKm: 421_800,
    orbitalPeriodDays: 1.762_732,
    orbitalInclinationDeg: 0,
    meanAnomalyAtEpochDeg: 330.9,
    color: 0xf0cf72
  },
  {
    name: "Europa",
    meanRadiusKm: 1_560.8,
    semiMajorAxisKm: 671_100,
    orbitalPeriodDays: 3.525_463,
    orbitalInclinationDeg: 0.5,
    meanAnomalyAtEpochDeg: 184,
    color: 0xd9d7c8
  },
  {
    name: "Ganymede",
    meanRadiusKm: 2_631.2,
    semiMajorAxisKm: 1_070_400,
    orbitalPeriodDays: 7.155_588,
    orbitalInclinationDeg: 0.2,
    meanAnomalyAtEpochDeg: 58.5,
    color: 0x9d8d7a
  },
  {
    name: "Callisto",
    meanRadiusKm: 2_410.3,
    semiMajorAxisKm: 1_882_700,
    orbitalPeriodDays: 16.690_44,
    orbitalInclinationDeg: 0.3,
    meanAnomalyAtEpochDeg: 309.1,
    color: 0x746b60
  }
];

// The real Galilean system is large compared with the planet. This mild
// compression preserves ordering and keeps Io outside the gossamer rings.
export const JUPITER_MOON_ORBIT_VISUAL_COMPRESSION = 0.72;

export const JUPITER_MOON_VISUAL_RADIUS_BOOST = 3.0;
