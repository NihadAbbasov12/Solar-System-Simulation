import {
  EARTH_YEAR_DAYS,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR
} from "../physics/units";
import { degToRad, TAU } from "../utils/math";
import type { OrbitalElements } from "../physics/orbitalMechanics";

export const SATURN_PHYSICAL = {
  meanRadiusKm: 58_232,
  equatorialRadiusKm: 60_268,
  polarRadiusKm: 54_364,
  massKg: 5.683e26,
  rotationPeriodHours: 10.656,
  axialTiltDeg: 26.73,
  meanDensityGramsPerCubicCentimeter: 0.687,
  atmosphere: ["hydrogen", "helium"] as const
};

export const SATURN_ORBIT = {
  semiMajorAxisAU: 9.539,
  eccentricity: 0.0565,
  orbitalPeriodEarthYears: 29.457,
  orbitalInclinationDeg: 2.485,
  meanOrbitalVelocityKmPerSecond: 9.69
};

export const SATURN_ROTATION_PERIOD_SECONDS =
  SATURN_PHYSICAL.rotationPeriodHours * SECONDS_PER_HOUR;

export const SATURN_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND =
  TAU / SATURN_ROTATION_PERIOD_SECONDS;

export const SATURN_AXIAL_TILT_RAD = degToRad(SATURN_PHYSICAL.axialTiltDeg);

export const SATURN_POLAR_TO_EQUATORIAL_RATIO =
  SATURN_PHYSICAL.polarRadiusKm / SATURN_PHYSICAL.equatorialRadiusKm;

export const SATURN_ORBITAL_ELEMENTS: OrbitalElements = {
  semiMajorAxisAU: SATURN_ORBIT.semiMajorAxisAU,
  eccentricity: SATURN_ORBIT.eccentricity,
  inclinationRad: degToRad(SATURN_ORBIT.orbitalInclinationDeg),
  orbitalPeriodSeconds:
    SATURN_ORBIT.orbitalPeriodEarthYears * EARTH_YEAR_DAYS * SECONDS_PER_DAY,
  // Approximate J2000 phase. The orbit shape, tilt, and period use the
  // supplied physical constants; exact sky ephemerides would require SPICE/JPL.
  meanAnomalyAtEpochRad: degToRad(317.02)
};

export const SIMULATION_EPOCH = new Date("2000-01-01T12:00:00.000Z");

export interface RingBandDefinition {
  name: "D" | "C" | "B" | "A" | "F" | "G" | "E";
  innerRadiusKm: number;
  outerRadiusKm: number;
  opacity: number;
  colorInner: number;
  colorOuter: number;
  particleCount: number;
  gapCenterKm?: number;
  gapWidthKm?: number;
  gapDepth?: number;
}

// Ring extents are approximate radial distances from Saturn's center.
export const RING_BANDS: RingBandDefinition[] = [
  {
    name: "D",
    innerRadiusKm: 66_900,
    outerRadiusKm: 74_510,
    opacity: 0.12,
    colorInner: 0x998d77,
    colorOuter: 0xd0c1a5,
    particleCount: 900
  },
  {
    name: "C",
    innerRadiusKm: 74_658,
    outerRadiusKm: 92_000,
    opacity: 0.24,
    colorInner: 0x8f846f,
    colorOuter: 0xe0d7c2,
    particleCount: 2_500
  },
  {
    name: "B",
    innerRadiusKm: 92_000,
    outerRadiusKm: 117_580,
    opacity: 0.54,
    colorInner: 0xd9cab0,
    colorOuter: 0xf4ead5,
    particleCount: 5_600
  },
  {
    name: "A",
    innerRadiusKm: 122_170,
    outerRadiusKm: 136_775,
    opacity: 0.38,
    colorInner: 0xcabda7,
    colorOuter: 0xeee2c9,
    particleCount: 4_300,
    gapCenterKm: 133_590,
    gapWidthKm: 1_100,
    gapDepth: 0.82
  },
  {
    name: "F",
    innerRadiusKm: 139_826,
    outerRadiusKm: 140_612,
    opacity: 0.42,
    colorInner: 0xf2eadb,
    colorOuter: 0xffffff,
    particleCount: 1_200
  },
  {
    name: "G",
    innerRadiusKm: 166_000,
    outerRadiusKm: 174_000,
    opacity: 0.1,
    colorInner: 0x9aa1a1,
    colorOuter: 0xdbe4e3,
    particleCount: 1_200
  },
  {
    name: "E",
    innerRadiusKm: 180_000,
    outerRadiusKm: 480_000,
    opacity: 0.035,
    colorInner: 0xbac8cc,
    colorOuter: 0xf1fbff,
    particleCount: 2_800
  }
];
