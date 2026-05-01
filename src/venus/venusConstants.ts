import { SECONDS_PER_DAY } from "../physics/units";
import type { OrbitalElements } from "../physics/orbitalMechanics";
import { degToRad, TAU } from "../utils/math";

export const VENUS_DESCRIPTION =
  "An Earth-sized terrestrial planet hidden beneath a global sulfuric-acid cloud deck and a dense carbon-dioxide atmosphere. Venus has a dry basaltic surface, volcanic plains, deformed highlands, no moons, no rings, no intrinsic magnetic field, and surface conditions near 464 to 470 C under roughly 94 bar of pressure. Its clouds dominate visible-light views; radar or false-color scientific modes are required to study the surface from orbit.";

export const VENUS_PROFILE = {
  overview:
    "Venus is close to Earth in size and mass, but its climate and surface environment are radically different. A dense CO2 atmosphere, reflective sulfuric-acid clouds, and runaway greenhouse heating make the planet hotter at the surface than Mercury.",
  atmosphere:
    "More than 96 percent of the atmosphere is carbon dioxide, with about 3.5 percent nitrogen and trace gases. Multiple sulfuric-acid cloud layers hide the surface in visible light and create a bright, high-albedo disk with subtle UV-dark streaks.",
  surfaceAndGeology:
    "The surface is dry, rocky, and basalt-dominated. Vast volcanic plains are interrupted by Ishtar Terra, Aphrodite Terra, Maxwell Montes, coronae, tesserae, rifts, volcanic domes, and lava-plain provinces. Venus appears geologically young and may still be volcanically or tectonically active, but not through Earth-style plate tectonics.",
  rotationAndOrbit:
    "Venus orbits the Sun every 224.70 Earth days at about 0.72 AU. Its solid planet rotates extremely slowly and retrograde, with a 243.02-day sidereal rotation period and a 116.75-day solar day.",
  whyNotAnotherEarth:
    "Venus is Earth-sized, not Earth-like. Its ocean-free surface, dense greenhouse atmosphere, slow retrograde spin, weak induced solar-wind interaction, and crushing pressure produce a planet that is physically hostile despite familiar dimensions.",
  moonsAndRings:
    "Venus has no known moons and no rings. Quasi-satellite objects can share temporary orbital relationships with Venus, but they are not Venusian moons.",
  scientificVisualization:
    "Debug mode blends to a radar-inspired false-color topographic visualization. That mode is educational and non-visible-light; the standard rendering intentionally keeps the rocky surface hidden."
} as const;

export const VENUS_PHYSICAL = {
  planetType: "terrestrial rocky planet",
  meanRadiusKm: 6_051.8,
  equatorialRadiusKm: 6_051.8,
  polarRadiusKmApprox: 6_051.8,
  massKg: 4.867_31e24,
  meanDensityGramsPerCubicCentimeter: 5.243,
  surfaceGravityMetersPerSecondSquared: 8.87,
  escapeVelocityKmPerSecond: 10.36,
  siderealRotationDays: 243.02,
  solarDayDays: 116.75,
  // Venus' spin axis is nearly upside down, so the local +Y spin axis points
  // mostly opposite the orbital normal instead of using an Earth-like axis.
  axialTiltDeg: 177.36,
  rotationSense: "retrograde",
  geometricAlbedo: 0.689,
  surfaceTemperatureCelsius: 467,
  surfaceTemperatureRangeCelsius: [464, 470] as const,
  surfacePressureBar: 94,
  surfacePressureRangeBar: [93, 95] as const,
  atmosphere: ["carbon dioxide", "nitrogen", "trace gases"] as const,
  carbonDioxidePercent: 96.5,
  nitrogenPercentApprox: 3.5,
  cloudLayers: ["sulfuric acid"] as const,
  intrinsicMagneticField: "none",
  inducedMagnetosphere: true,
  moonCount: 0,
  ringCount: 0
};

export const VENUS_ORBIT = {
  meanDistanceFromSunKm: 108_210_000,
  semiMajorAxisAU: 0.723_332,
  eccentricity: 0.0068,
  orbitalPeriodDays: 224.7,
  orbitalInclinationDeg: 3.39
};

export const VENUS_ROTATION_PERIOD_SECONDS =
  VENUS_PHYSICAL.siderealRotationDays * SECONDS_PER_DAY;

export const VENUS_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND =
  TAU / VENUS_ROTATION_PERIOD_SECONDS;

export const VENUS_CLOUD_SUPER_ROTATION_PERIOD_DAYS = 4.2;

export const VENUS_CLOUD_SUPER_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND =
  TAU / (VENUS_CLOUD_SUPER_ROTATION_PERIOD_DAYS * SECONDS_PER_DAY);

export const VENUS_AXIAL_TILT_RAD = degToRad(VENUS_PHYSICAL.axialTiltDeg);

export const VENUS_POLAR_TO_EQUATORIAL_RATIO =
  VENUS_PHYSICAL.polarRadiusKmApprox / VENUS_PHYSICAL.equatorialRadiusKm;

export const VENUS_ORBITAL_ELEMENTS: OrbitalElements = {
  semiMajorAxisAU: VENUS_ORBIT.semiMajorAxisAU,
  eccentricity: VENUS_ORBIT.eccentricity,
  inclinationRad: degToRad(VENUS_ORBIT.orbitalInclinationDeg),
  orbitalPeriodSeconds: VENUS_ORBIT.orbitalPeriodDays * SECONDS_PER_DAY,
  // JPL approximate planetary elements: mean longitude 181.97909950 deg minus
  // longitude of perihelion 131.60246718 deg at the shared J2000 epoch.
  meanAnomalyAtEpochRad: degToRad(50.376_632_32)
};

export const VENUS_SURFACE_FEATURES = [
  {
    name: "Ishtar Terra",
    feature: "northern highland region"
  },
  {
    name: "Aphrodite Terra",
    feature: "large equatorial highland and deformation province"
  },
  {
    name: "Maxwell Montes",
    elevationKmApprox: 11,
    feature: "highest major mountain region on Venus"
  },
  {
    name: "coronae",
    feature: "large circular tectono-volcanic deformation structures"
  },
  {
    name: "tesserae",
    feature: "complexly deformed high-standing terrain"
  },
  {
    name: "rifts and volcanic domes",
    feature: "tectonic and volcanic structures embedded in basaltic plains"
  }
] as const;
