import {
  EARTH_YEAR_DAYS,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR
} from "../physics/units";
import type { OrbitalElements } from "../physics/orbitalMechanics";
import { degToRad, TAU } from "../utils/math";

export type UranusMoonGroup = "major" | "inner" | "outerIrregular";
export type UranusMoonStatus = "official" | "provisional";
export type UranusOrbitDirection = "prograde" | "retrograde";
export type UranusRingFamily = "zetaDiffuse" | "mainNarrow" | "outerDust";

export interface UranusMoonDefinition {
  id: string;
  displayName: string;
  officialName?: string;
  provisionalDesignation?: string;
  status: UranusMoonStatus;
  group: UranusMoonGroup;
  orbitDirection: UranusOrbitDirection;
  semiMajorAxisKm: number;
  eccentricity: number;
  orbitalPeriodDays: number;
  orbitalInclinationDeg: number;
  meanAnomalyAtEpochDeg: number;
  color: number;
  presentation: string;
  meanRadiusKm?: number;
  meanDensityGramsPerCubicCentimeter?: number;
  descriptor?: string;
  geology?: string;
  possibleSubsurfaceOcean?: boolean;
  provisionalNote?: string;
}

export interface UranusRingDefinition {
  name:
    | "Zeta"
    | "6"
    | "5"
    | "4"
    | "Alpha"
    | "Beta"
    | "Eta"
    | "Gamma"
    | "Delta"
    | "Lambda"
    | "Epsilon"
    | "Nu"
    | "Mu";
  family: UranusRingFamily;
  centerRadiusKm: number;
  physicalWidthKm: number;
  visualMinimumWidthKm: number;
  opacity: number;
  colorInner: number;
  colorOuter: number;
  particleCount: number;
}

export const URANUS_DESCRIPTION =
  "Uranus is a pale cyan ice giant tipped almost onto its side, a fluid world without a true surface. Its muted methane haze, faint dark rings, offset magnetic field, and varied icy moons make the system quiet at first glance but dynamically strange in detail.";

export const URANUS_PHYSICAL = {
  name: "Uranus",
  class: "ice giant",
  meanRadiusKm: 25_362,
  equatorialRadiusKm: 25_559,
  polarRadiusKm: 24_973,
  massKg: 8.680_99e25,
  standardGravitationalParameterM3PerSecond2: 5.793_951_3e15,
  rotationPeriodHours: -17.239_92,
  axialTiltDeg: 97.77,
  meanDensityGramsPerCubicCentimeter: 1.27,
  surfaceGravityMetersPerSecondSquared: 8.87,
  escapeVelocityKmPerSecond: 21.38,
  geometricAlbedo: 0.51,
  atmosphere: ["hydrogen", "helium", "methane"] as const,
  moonCount: 29,
  namedMoonCount: 27,
  provisionalMoonCount: 2,
  hasTrueSolidSurface: false
};

export const URANUS_ORBIT = {
  semiMajorAxisAU: 19.189_164_64,
  eccentricity: 0.047_257_44,
  orbitalPeriodEarthYears: 84.016_846,
  orbitalPeriodDays: 84.016_846 * EARTH_YEAR_DAYS,
  orbitalInclinationDeg: 0.772_637_83,
  meanOrbitalVelocityKmPerSecond: 6.8
};

export const URANUS_DATA = {
  name: URANUS_PHYSICAL.name,
  type: "planet",
  class: URANUS_PHYSICAL.class,
  description: URANUS_DESCRIPTION,
  radii: {
    mean: { value: URANUS_PHYSICAL.meanRadiusKm, unit: "km" },
    equatorial: { value: URANUS_PHYSICAL.equatorialRadiusKm, unit: "km" },
    polar: { value: URANUS_PHYSICAL.polarRadiusKm, unit: "km" }
  },
  mass: { value: URANUS_PHYSICAL.massKg, unit: "kg" },
  density: {
    value: URANUS_PHYSICAL.meanDensityGramsPerCubicCentimeter,
    unit: "g/cm^3"
  },
  gravity: {
    value: URANUS_PHYSICAL.surfaceGravityMetersPerSecondSquared,
    unit: "m/s^2"
  },
  escapeVelocity: {
    value: URANUS_PHYSICAL.escapeVelocityKmPerSecond,
    unit: "km/s"
  },
  axialTilt: { value: URANUS_PHYSICAL.axialTiltDeg, unit: "deg" },
  rotationPeriod: {
    value: URANUS_PHYSICAL.rotationPeriodHours,
    unit: "hours",
    direction: "retrograde"
  },
  orbit: {
    orbitalPeriod: {
      value: URANUS_ORBIT.orbitalPeriodEarthYears,
      unit: "Earth years"
    },
    semiMajorAxis: { value: URANUS_ORBIT.semiMajorAxisAU, unit: "AU" },
    eccentricity: URANUS_ORBIT.eccentricity,
    inclination: { value: URANUS_ORBIT.orbitalInclinationDeg, unit: "deg" }
  },
  atmosphereSummary:
    "Hydrogen and helium dominate the atmosphere; methane absorbs red light and gives Uranus its restrained blue-green color. Observed clouds are sparse but can brighten near seasonal changes.",
  ringSummary:
    "A 13-ring system of narrow, dark, low-reflectivity rings plus faint dusty outer rings. The rings lie in Uranus' steeply tilted equatorial plane rather than forming Saturn-like broad bright bands.",
  magnetosphereSummary:
    "The magnetic axis is strongly tilted from the rotation axis and offset from the planet center, producing an asymmetric magnetosphere and auroras that do not align neatly with the poles.",
  scientificNotes: {
    iceGiant: true,
    trueSolidSurface: false,
    rotation: "retrograde",
    seasons:
      "The 97.77 deg axial tilt gives Uranus extreme seasons, with each pole spending about a quarter of the Uranian year in continuous sunlight or darkness.",
    magnetosphere:
      "The field is highly tilted and offset, so the magnetosphere is lopsided rather than dipole-aligned.",
    interior:
      "Most mass is modeled as hot dense fluid rich in water, methane, and ammonia above a compact rock-rich core; this is not a landable crust.",
    moonOceanNote:
      "Ariel, Umbriel, Titania, and Oberon may retain briny subsurface oceans; Miranda is likely too small."
  }
} as const;

export const URANUS_ROTATION_PERIOD_SECONDS =
  URANUS_PHYSICAL.rotationPeriodHours * SECONDS_PER_HOUR;

export const URANUS_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND =
  TAU / URANUS_ROTATION_PERIOD_SECONDS;

export const URANUS_AXIAL_TILT_RAD = degToRad(URANUS_PHYSICAL.axialTiltDeg);

export const URANUS_POLAR_TO_EQUATORIAL_RATIO =
  URANUS_PHYSICAL.polarRadiusKm / URANUS_PHYSICAL.equatorialRadiusKm;

export const URANUS_ORBITAL_ELEMENTS: OrbitalElements = {
  semiMajorAxisAU: URANUS_ORBIT.semiMajorAxisAU,
  eccentricity: URANUS_ORBIT.eccentricity,
  inclinationRad: degToRad(URANUS_ORBIT.orbitalInclinationDeg),
  orbitalPeriodSeconds:
    URANUS_ORBIT.orbitalPeriodEarthYears * EARTH_YEAR_DAYS * SECONDS_PER_DAY,
  // JPL approximate planetary elements: mean longitude 313.23810451 deg minus
  // longitude of perihelion 170.95427630 deg at the shared J2000 epoch.
  meanAnomalyAtEpochRad: degToRad(142.283_828_21)
};

export const URANUS_RINGS: UranusRingDefinition[] = [
  {
    name: "Zeta",
    family: "zetaDiffuse",
    centerRadiusKm: 38_000,
    physicalWidthKm: 3_500,
    visualMinimumWidthKm: 3_500,
    opacity: 0.028,
    colorInner: 0x101817,
    colorOuter: 0x263331,
    particleCount: 500
  },
  {
    name: "6",
    family: "mainNarrow",
    centerRadiusKm: 41_837,
    physicalWidthKm: 3,
    visualMinimumWidthKm: 160,
    opacity: 0.075,
    colorInner: 0x111314,
    colorOuter: 0x2a2e2f,
    particleCount: 220
  },
  {
    name: "5",
    family: "mainNarrow",
    centerRadiusKm: 42_235,
    physicalWidthKm: 4,
    visualMinimumWidthKm: 160,
    opacity: 0.078,
    colorInner: 0x111314,
    colorOuter: 0x2d3132,
    particleCount: 220
  },
  {
    name: "4",
    family: "mainNarrow",
    centerRadiusKm: 42_571,
    physicalWidthKm: 4,
    visualMinimumWidthKm: 160,
    opacity: 0.08,
    colorInner: 0x111414,
    colorOuter: 0x303536,
    particleCount: 220
  },
  {
    name: "Alpha",
    family: "mainNarrow",
    centerRadiusKm: 44_718,
    physicalWidthKm: 8,
    visualMinimumWidthKm: 180,
    opacity: 0.11,
    colorInner: 0x141717,
    colorOuter: 0x383d3e,
    particleCount: 320
  },
  {
    name: "Beta",
    family: "mainNarrow",
    centerRadiusKm: 45_661,
    physicalWidthKm: 9,
    visualMinimumWidthKm: 180,
    opacity: 0.11,
    colorInner: 0x151818,
    colorOuter: 0x3a4040,
    particleCount: 340
  },
  {
    name: "Eta",
    family: "mainNarrow",
    centerRadiusKm: 47_176,
    physicalWidthKm: 6,
    visualMinimumWidthKm: 170,
    opacity: 0.082,
    colorInner: 0x12191a,
    colorOuter: 0x334143,
    particleCount: 260
  },
  {
    name: "Gamma",
    family: "mainNarrow",
    centerRadiusKm: 47_627,
    physicalWidthKm: 4,
    visualMinimumWidthKm: 170,
    opacity: 0.1,
    colorInner: 0x111718,
    colorOuter: 0x364041,
    particleCount: 300
  },
  {
    name: "Delta",
    family: "mainNarrow",
    centerRadiusKm: 48_300,
    physicalWidthKm: 7,
    visualMinimumWidthKm: 180,
    opacity: 0.095,
    colorInner: 0x121719,
    colorOuter: 0x343f41,
    particleCount: 300
  },
  {
    name: "Lambda",
    family: "mainNarrow",
    centerRadiusKm: 50_024,
    physicalWidthKm: 2,
    visualMinimumWidthKm: 150,
    opacity: 0.058,
    colorInner: 0x101719,
    colorOuter: 0x2c383c,
    particleCount: 180
  },
  {
    name: "Epsilon",
    family: "mainNarrow",
    centerRadiusKm: 51_149,
    physicalWidthKm: 60,
    visualMinimumWidthKm: 260,
    opacity: 0.16,
    colorInner: 0x171b1b,
    colorOuter: 0x4a5050,
    particleCount: 620
  },
  {
    name: "Nu",
    family: "outerDust",
    centerRadiusKm: 67_300,
    physicalWidthKm: 3_800,
    visualMinimumWidthKm: 3_800,
    opacity: 0.034,
    colorInner: 0x2d1d1b,
    colorOuter: 0x67493e,
    particleCount: 460
  },
  {
    name: "Mu",
    family: "outerDust",
    centerRadiusKm: 97_700,
    physicalWidthKm: 17_000,
    visualMinimumWidthKm: 17_000,
    opacity: 0.026,
    colorInner: 0x21323a,
    colorOuter: 0x52707c,
    particleCount: 560
  }
];

export const URANUS_MOONS: UranusMoonDefinition[] = [
  {
    id: "miranda",
    displayName: "Miranda",
    officialName: "Miranda",
    status: "official",
    group: "major",
    orbitDirection: "prograde",
    meanRadiusKm: 235.8,
    meanDensityGramsPerCubicCentimeter: 1.178,
    semiMajorAxisKm: 129_846,
    eccentricity: 0.001,
    orbitalPeriodDays: 1.413_479,
    orbitalInclinationDeg: 4.4,
    meanAnomalyAtEpochDeg: 73,
    color: 0xa9aaa4,
    presentation: "patchwork icy major moon",
    descriptor: "Bizarre patchwork terrain, coronae, and giant fault canyons.",
    geology:
      "Patchwork icy terrain with coronae, scarps, and enormous fault canyons.",
    possibleSubsurfaceOcean: false
  },
  {
    id: "ariel",
    displayName: "Ariel",
    officialName: "Ariel",
    status: "official",
    group: "major",
    orbitDirection: "prograde",
    meanRadiusKm: 578.9,
    meanDensityGramsPerCubicCentimeter: 1.539,
    semiMajorAxisKm: 190_929,
    eccentricity: 0.001,
    orbitalPeriodDays: 2.520_379,
    orbitalInclinationDeg: 0,
    meanAnomalyAtEpochDeg: 193.5,
    color: 0xc9cbc5,
    presentation: "bright tectonically renewed major moon",
    descriptor: "Bright, tectonically renewed icy surface.",
    geology: "Relatively bright surface crossed by tectonic valleys and chasms.",
    possibleSubsurfaceOcean: true
  },
  {
    id: "umbriel",
    displayName: "Umbriel",
    officialName: "Umbriel",
    status: "official",
    group: "major",
    orbitDirection: "prograde",
    meanRadiusKm: 584.7,
    meanDensityGramsPerCubicCentimeter: 1.523,
    semiMajorAxisKm: 265_986,
    eccentricity: 0.004,
    orbitalPeriodDays: 4.144_177,
    orbitalInclinationDeg: 0.1,
    meanAnomalyAtEpochDeg: 253,
    color: 0x696b68,
    presentation: "dark ancient major moon",
    descriptor: "Dark, ancient, and heavily cratered.",
    geology: "Old, dark, heavily cratered icy crust with little obvious renewal.",
    possibleSubsurfaceOcean: true
  },
  {
    id: "titania",
    displayName: "Titania",
    officialName: "Titania",
    status: "official",
    group: "major",
    orbitDirection: "prograde",
    meanRadiusKm: 788.9,
    meanDensityGramsPerCubicCentimeter: 1.653,
    semiMajorAxisKm: 436_298,
    eccentricity: 0.002,
    orbitalPeriodDays: 8.705_869,
    orbitalInclinationDeg: 0.1,
    meanAnomalyAtEpochDeg: 68.1,
    color: 0xb1ada4,
    presentation: "largest tectonic major moon",
    descriptor: "Largest Uranian moon, cut by large tectonic fault valleys.",
    geology: "Icy crust broken by large fault valleys and tectonic scarps.",
    possibleSubsurfaceOcean: true
  },
  {
    id: "oberon",
    displayName: "Oberon",
    officialName: "Oberon",
    status: "official",
    group: "major",
    orbitDirection: "prograde",
    meanRadiusKm: 761.4,
    meanDensityGramsPerCubicCentimeter: 1.664,
    semiMajorAxisKm: 583_511,
    eccentricity: 0.002,
    orbitalPeriodDays: 13.463_237,
    orbitalInclinationDeg: 0.1,
    meanAnomalyAtEpochDeg: 143.6,
    color: 0x8a837b,
    presentation: "rugged cratered major moon",
    descriptor: "Heavily cratered and rugged, with large relief.",
    geology: "Rugged, heavily cratered icy surface with high-relief landforms.",
    possibleSubsurfaceOcean: true
  },
  {
    id: "cordelia",
    displayName: "Cordelia",
    officialName: "Cordelia",
    status: "official",
    group: "inner",
    orbitDirection: "prograde",
    semiMajorAxisKm: 49_755,
    eccentricity: 0,
    orbitalPeriodDays: 0.3347,
    orbitalInclinationDeg: 0.2,
    meanAnomalyAtEpochDeg: 287.4,
    color: 0x6f7472,
    presentation: "inner regular ring-adjacent moon"
  },
  {
    id: "ophelia",
    displayName: "Ophelia",
    officialName: "Ophelia",
    status: "official",
    group: "inner",
    orbitDirection: "prograde",
    semiMajorAxisKm: 53_765,
    eccentricity: 0.011,
    orbitalPeriodDays: 0.3764,
    orbitalInclinationDeg: 0.2,
    meanAnomalyAtEpochDeg: 213.4,
    color: 0x707674,
    presentation: "inner regular ring-adjacent moon"
  },
  {
    id: "s2025-u1",
    displayName: "S/2025 U 1",
    provisionalDesignation: "S/2025 U 1",
    status: "provisional",
    group: "inner",
    orbitDirection: "prograde",
    semiMajorAxisKm: 57_844,
    eccentricity: 0.039,
    orbitalPeriodDays: 0.4201,
    orbitalInclinationDeg: 4,
    meanAnomalyAtEpochDeg: 275.6,
    color: 0x65706f,
    presentation: "provisional small inner moon",
    provisionalNote:
      "Announced from Webb observations; no IAU-approved name is assigned."
  },
  {
    id: "bianca",
    displayName: "Bianca",
    officialName: "Bianca",
    status: "official",
    group: "inner",
    orbitDirection: "prograde",
    semiMajorAxisKm: 59_170,
    eccentricity: 0.006,
    orbitalPeriodDays: 0.4347,
    orbitalInclinationDeg: 2.3,
    meanAnomalyAtEpochDeg: 109.1,
    color: 0x727977,
    presentation: "inner regular moon"
  },
  {
    id: "cressida",
    displayName: "Cressida",
    officialName: "Cressida",
    status: "official",
    group: "inner",
    orbitDirection: "prograde",
    semiMajorAxisKm: 61_770,
    eccentricity: 0.004,
    orbitalPeriodDays: 0.4639,
    orbitalInclinationDeg: 1.8,
    meanAnomalyAtEpochDeg: 0.5,
    color: 0x767d7b,
    presentation: "inner regular moon"
  },
  {
    id: "desdemona",
    displayName: "Desdemona",
    officialName: "Desdemona",
    status: "official",
    group: "inner",
    orbitDirection: "prograde",
    semiMajorAxisKm: 62_663,
    eccentricity: 0.007,
    orbitalPeriodDays: 0.4736,
    orbitalInclinationDeg: 3.1,
    meanAnomalyAtEpochDeg: 230,
    color: 0x747a78,
    presentation: "inner regular moon"
  },
  {
    id: "juliet",
    displayName: "Juliet",
    officialName: "Juliet",
    status: "official",
    group: "inner",
    orbitDirection: "prograde",
    semiMajorAxisKm: 64_362,
    eccentricity: 0.006,
    orbitalPeriodDays: 0.4931,
    orbitalInclinationDeg: 3,
    meanAnomalyAtEpochDeg: 319.8,
    color: 0x78807d,
    presentation: "inner regular moon"
  },
  {
    id: "portia",
    displayName: "Portia",
    officialName: "Portia",
    status: "official",
    group: "inner",
    orbitDirection: "prograde",
    semiMajorAxisKm: 66_101,
    eccentricity: 0.004,
    orbitalPeriodDays: 0.5132,
    orbitalInclinationDeg: 2.7,
    meanAnomalyAtEpochDeg: 310.1,
    color: 0x7c8380,
    presentation: "inner regular moon"
  },
  {
    id: "rosalind",
    displayName: "Rosalind",
    officialName: "Rosalind",
    status: "official",
    group: "inner",
    orbitDirection: "prograde",
    semiMajorAxisKm: 69_930,
    eccentricity: 0.003,
    orbitalPeriodDays: 0.5583,
    orbitalInclinationDeg: 1.7,
    meanAnomalyAtEpochDeg: 287.7,
    color: 0x7f8582,
    presentation: "inner regular moon"
  },
  {
    id: "cupid",
    displayName: "Cupid",
    officialName: "Cupid",
    status: "official",
    group: "inner",
    orbitDirection: "prograde",
    semiMajorAxisKm: 74_396,
    eccentricity: 0.007,
    orbitalPeriodDays: 0.6125,
    orbitalInclinationDeg: 2,
    meanAnomalyAtEpochDeg: 3.3,
    color: 0x757e7d,
    presentation: "inner regular moon"
  },
  {
    id: "belinda",
    displayName: "Belinda",
    officialName: "Belinda",
    status: "official",
    group: "inner",
    orbitDirection: "prograde",
    semiMajorAxisKm: 75_258,
    eccentricity: 0.002,
    orbitalPeriodDays: 0.6236,
    orbitalInclinationDeg: 1.4,
    meanAnomalyAtEpochDeg: 226.4,
    color: 0x818682,
    presentation: "inner regular moon"
  },
  {
    id: "perdita",
    displayName: "Perdita",
    officialName: "Perdita",
    status: "official",
    group: "inner",
    orbitDirection: "prograde",
    semiMajorAxisKm: 76_418,
    eccentricity: 0.005,
    orbitalPeriodDays: 0.6382,
    orbitalInclinationDeg: 1.6,
    meanAnomalyAtEpochDeg: 168,
    color: 0x747d7c,
    presentation: "inner regular moon"
  },
  {
    id: "puck",
    displayName: "Puck",
    officialName: "Puck",
    status: "official",
    group: "inner",
    orbitDirection: "prograde",
    semiMajorAxisKm: 86_007,
    eccentricity: 0.009,
    orbitalPeriodDays: 0.7618,
    orbitalInclinationDeg: 1.1,
    meanAnomalyAtEpochDeg: 264.1,
    color: 0x909089,
    presentation: "larger inner regular moon"
  },
  {
    id: "mab",
    displayName: "Mab",
    officialName: "Mab",
    status: "official",
    group: "inner",
    orbitDirection: "prograde",
    semiMajorAxisKm: 97_737,
    eccentricity: 0.006,
    orbitalPeriodDays: 0.9229,
    orbitalInclinationDeg: 1.8,
    meanAnomalyAtEpochDeg: 250.8,
    color: 0x828985,
    presentation: "inner moon associated with the outer dusty ring region"
  },
  {
    id: "francisco",
    displayName: "Francisco",
    officialName: "Francisco",
    status: "official",
    group: "outerIrregular",
    orbitDirection: "retrograde",
    semiMajorAxisKm: 4_275_700,
    eccentricity: 0.144,
    orbitalPeriodDays: 267,
    orbitalInclinationDeg: 146.8,
    meanAnomalyAtEpochDeg: 288.4,
    color: 0x8b8179,
    presentation: "distant irregular moon"
  },
  {
    id: "caliban",
    displayName: "Caliban",
    officialName: "Caliban",
    status: "official",
    group: "outerIrregular",
    orbitDirection: "retrograde",
    semiMajorAxisKm: 7_167_000,
    eccentricity: 0.2,
    orbitalPeriodDays: 580,
    orbitalInclinationDeg: 141.4,
    meanAnomalyAtEpochDeg: 241.2,
    color: 0x766f69,
    presentation: "distant irregular moon"
  },
  {
    id: "stephano",
    displayName: "Stephano",
    officialName: "Stephano",
    status: "official",
    group: "outerIrregular",
    orbitDirection: "retrograde",
    semiMajorAxisKm: 7_951_400,
    eccentricity: 0.235,
    orbitalPeriodDays: 677,
    orbitalInclinationDeg: 143.6,
    meanAnomalyAtEpochDeg: 164.4,
    color: 0x7d756d,
    presentation: "distant irregular moon"
  },
  {
    id: "s2023-u1",
    displayName: "S/2023 U 1",
    provisionalDesignation: "S/2023 U 1",
    status: "provisional",
    group: "outerIrregular",
    orbitDirection: "retrograde",
    semiMajorAxisKm: 7_976_600,
    eccentricity: 0.25,
    orbitalPeriodDays: 681,
    orbitalInclinationDeg: 143.9,
    meanAnomalyAtEpochDeg: 101.8,
    color: 0x716b65,
    presentation: "provisional distant irregular moon",
    provisionalNote:
      "Provisional Uranian irregular; no IAU-approved name is assigned."
  },
  {
    id: "trinculo",
    displayName: "Trinculo",
    officialName: "Trinculo",
    status: "official",
    group: "outerIrregular",
    orbitDirection: "retrograde",
    semiMajorAxisKm: 8_502_600,
    eccentricity: 0.22,
    orbitalPeriodDays: 749,
    orbitalInclinationDeg: 167.1,
    meanAnomalyAtEpochDeg: 55.6,
    color: 0x81786f,
    presentation: "distant irregular moon"
  },
  {
    id: "sycorax",
    displayName: "Sycorax",
    officialName: "Sycorax",
    status: "official",
    group: "outerIrregular",
    orbitDirection: "retrograde",
    semiMajorAxisKm: 12_193_200,
    eccentricity: 0.52,
    orbitalPeriodDays: 1_286,
    orbitalInclinationDeg: 157,
    meanAnomalyAtEpochDeg: 332.1,
    color: 0x6b665f,
    presentation: "distant irregular moon"
  },
  {
    id: "margaret",
    displayName: "Margaret",
    officialName: "Margaret",
    status: "official",
    group: "outerIrregular",
    orbitDirection: "prograde",
    semiMajorAxisKm: 14_425_000,
    eccentricity: 0.642,
    orbitalPeriodDays: 1_655,
    orbitalInclinationDeg: 60.5,
    meanAnomalyAtEpochDeg: 115.9,
    color: 0x918575,
    presentation: "distant high-eccentricity irregular moon"
  },
  {
    id: "prospero",
    displayName: "Prospero",
    officialName: "Prospero",
    status: "official",
    group: "outerIrregular",
    orbitDirection: "retrograde",
    semiMajorAxisKm: 16_221_000,
    eccentricity: 0.441,
    orbitalPeriodDays: 1_974,
    orbitalInclinationDeg: 149.4,
    meanAnomalyAtEpochDeg: 197.6,
    color: 0x746d65,
    presentation: "distant irregular moon"
  },
  {
    id: "setebos",
    displayName: "Setebos",
    officialName: "Setebos",
    status: "official",
    group: "outerIrregular",
    orbitDirection: "retrograde",
    semiMajorAxisKm: 17_519_800,
    eccentricity: 0.579,
    orbitalPeriodDays: 2_215,
    orbitalInclinationDeg: 153.9,
    meanAnomalyAtEpochDeg: 148,
    color: 0x6f6962,
    presentation: "distant irregular moon"
  },
  {
    id: "ferdinand",
    displayName: "Ferdinand",
    officialName: "Ferdinand",
    status: "official",
    group: "outerIrregular",
    orbitDirection: "retrograde",
    semiMajorAxisKm: 20_421_400,
    eccentricity: 0.395,
    orbitalPeriodDays: 2_788,
    orbitalInclinationDeg: 169.2,
    meanAnomalyAtEpochDeg: 172.3,
    color: 0x797068,
    presentation: "outermost represented irregular moon"
  }
];

export const URANUS_MAJOR_MOONS = URANUS_MOONS.filter(
  (moon) => moon.group === "major"
);

export const URANUS_INNER_MOONS = URANUS_MOONS.filter(
  (moon) => moon.group === "inner"
);

export const URANUS_OUTER_IRREGULAR_MOONS = URANUS_MOONS.filter(
  (moon) => moon.group === "outerIrregular"
);

export const URANUS_REGULAR_MOON_VISUAL_RADIUS_BOOST = 4.4;
export const URANUS_MAJOR_MOON_VISUAL_RADIUS_BOOST = 4.0;
export const URANUS_SMALL_MOON_VISUAL_RADIUS = 0.016;
export const URANUS_INNER_MOON_VISUAL_RADIUS = 0.013;
export const URANUS_IRREGULAR_MOON_VISUAL_RADIUS = 0.02;
export const URANUS_IRREGULAR_ORBIT_INNER_SCENE_RADIUS = 17.4;
export const URANUS_IRREGULAR_ORBIT_OUTER_SCENE_RADIUS = 28.5;

export const URANUS_MOON_ORBITAL_PERIOD_SECONDS = (
  periodDays: number
): number => periodDays * SECONDS_PER_DAY;
