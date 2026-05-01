import { SECONDS_PER_DAY } from "../physics/units";
import type { OrbitalElements } from "../physics/orbitalMechanics";
import { degToRad, TAU } from "../utils/math";

export const MERCURY_DESCRIPTION =
  "The smallest planet and the innermost major body orbiting the Sun: a dense, iron-rich terrestrial world with a huge metallic core, a thin rocky shell, an almost airless exosphere, ancient cratered terrain, broad volcanic plains, contractional lobate scarps, bright hollows, and water ice preserved only inside permanently shadowed polar craters. Mercury has no moons, no rings, no clouds, and almost no seasonal behavior because its axial tilt is effectively zero.";

export const MERCURY_PROFILE = {
  overview:
    "Mercury is a compact terrestrial planet dominated by rock at the surface and metal inside. Its proximity to the Sun, high orbital eccentricity, and lack of a real atmosphere make it a world of severe illumination and temperature contrast.",
  composition:
    "The planet is unusually metal-rich for its size. A massive iron-rich core occupies about 85 percent of Mercury's radius, beneath a comparatively thin silicate mantle and crust.",
  internalStructure:
    "The core radius is modeled at about 2,074 km, leaving roughly 400 km of rocky outer shell. Evidence from Mercury's magnetic field and rotation state is consistent with at least part of the core remaining molten.",
  orbitAndRotation:
    "Mercury follows a fast, eccentric 87.969-day orbit at 0.387 AU and rotates every 58.646 Earth days, preserving the characteristic 3:2 spin-orbit resonance. Its 0.035 degree axial tilt is treated as effectively seasonless.",
  exosphere:
    "Mercury does not have a normal atmosphere. Its tenuous exosphere is supplied by sputtering, micrometeoroid impacts, and surface release, so no clouds or thick haze are rendered.",
  geology:
    "The surface combines dense ancient impact cratering, smoother volcanic plains, long lobate scarps from global contraction, bright hollows, Caloris Basin, and Rachmaninoff Basin.",
  magneticField:
    "Mercury has a weak intrinsic magnetic field, far weaker than Earth's, which is represented as data rather than an exaggerated visual shield.",
  temperatureExtremes:
    "Airless daysides can reach about 430 C, while nightsides can fall near -180 C. The variation is driven mainly by solar distance and lack of atmospheric heat transport.",
  polarIce:
    "Radar-bright water ice can survive in permanently shadowed polar crater floors despite Mercury's small distance from the Sun.",
  moons: "None.",
  rings: "None."
} as const;

export const MERCURY_PHYSICAL = {
  meanRadiusKm: 2_439.4,
  equatorialRadiusKm: 2_440.53,
  polarRadiusKmApprox: 2_439.4,
  massKg: 3.301_03e23,
  densityGramsPerCubicCentimeter: 5.4289,
  surfaceGravityMetersPerSecondSquared: 3.7,
  escapeVelocityKmPerSecond: 4.25,
  siderealRotationDays: 58.6462,
  solarDayDays: 175.9421,
  axialTiltDeg: 0.035,
  geometricAlbedo: 0.106,
  coreRadiusKm: 2_074,
  rockyShellThicknessKmApprox: 400,
  coreRadiusFraction: 0.85,
  maxSurfaceTemperatureCelsiusDay: 430,
  minSurfaceTemperatureCelsiusNight: -180,
  solarIrradianceMinWattsPerSquareMeter: 6_272,
  solarIrradianceMaxWattsPerSquareMeter: 14_448,
  exosphere: ["sodium", "oxygen", "hydrogen", "helium", "potassium"] as const,
  moonCount: 0,
  ringCount: 0
};

export const MERCURY_ORBIT = {
  semiMajorAxisAU: 0.387_099_27,
  eccentricity: 0.205_635_93,
  orbitalPeriodDays: 87.969_257,
  orbitalInclinationDeg: 7.004_979,
  averageDistanceFromSunKm: 57_900_000,
  perihelionKm: 46_001_200,
  aphelionKm: 69_816_900,
  meanOrbitalVelocityKmPerSecond: 47.36
};

export const MERCURY_ROTATION_PERIOD_SECONDS =
  MERCURY_PHYSICAL.siderealRotationDays * SECONDS_PER_DAY;

export const MERCURY_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND =
  TAU / MERCURY_ROTATION_PERIOD_SECONDS;

export const MERCURY_AXIAL_TILT_RAD = degToRad(MERCURY_PHYSICAL.axialTiltDeg);

export const MERCURY_POLAR_TO_EQUATORIAL_RATIO =
  MERCURY_PHYSICAL.polarRadiusKmApprox / MERCURY_PHYSICAL.equatorialRadiusKm;

export const MERCURY_ORBITAL_ELEMENTS: OrbitalElements = {
  semiMajorAxisAU: MERCURY_ORBIT.semiMajorAxisAU,
  eccentricity: MERCURY_ORBIT.eccentricity,
  inclinationRad: degToRad(MERCURY_ORBIT.orbitalInclinationDeg),
  orbitalPeriodSeconds: MERCURY_ORBIT.orbitalPeriodDays * SECONDS_PER_DAY,
  // JPL approximate planetary elements: mean longitude 252.25032350 deg minus
  // longitude of perihelion 77.45779628 deg at the shared J2000 epoch.
  meanAnomalyAtEpochRad: degToRad(174.792_527_22)
};

export const MERCURY_LANDMARKS = [
  {
    name: "Caloris Basin",
    diameterKm: 1_550,
    feature: "large multiring impact basin and volcanic-plains province"
  },
  {
    name: "Rachmaninoff Basin",
    diameterKm: 306,
    feature: "double-ring basin with smooth interior plains"
  },
  {
    name: "lobate scarps",
    feature: "long cliffs produced as Mercury cooled and globally contracted"
  },
  {
    name: "hollows",
    feature: "bright, irregular, shallow depressions linked to volatile loss"
  },
  {
    name: "polar ice",
    feature: "water ice protected in permanently shadowed crater floors"
  }
] as const;
