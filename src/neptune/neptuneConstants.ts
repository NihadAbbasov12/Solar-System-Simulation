import {
  EARTH_YEAR_DAYS,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR
} from "../physics/units";
import type { OrbitalElements } from "../physics/orbitalMechanics";
import { degToRad, TAU } from "../utils/math";

export type NeptuneDataStatus =
  | "verified"
  | "approximate"
  | "inferred"
  | "provisional"
  | "unknown";
export type NeptuneMoonGroup =
  | "innerRegular"
  | "majorCaptured"
  | "transitional"
  | "outerIrregular";
export type NeptuneMoonStatus = "named" | "provisional";
export type NeptuneOrbitDirection = "prograde" | "retrograde";
export type NeptuneMoonModelDetail =
  | "detailedBody"
  | "mediumDetailBody"
  | "lightweightPoint";
export type NeptuneRingFamily = "mainNarrow" | "plateauDiffuse" | "adamsArc";

export interface NeptuneMoonDefinition {
  id: string;
  displayName: string;
  officialName?: string;
  provisionalDesignation?: string;
  status: NeptuneMoonStatus;
  statusCertainty: NeptuneDataStatus;
  group: NeptuneMoonGroup;
  orbitDirection: NeptuneOrbitDirection;
  semiMajorAxisKm: number;
  eccentricity: number;
  orbitalPeriodDays: number;
  orbitalInclinationDeg: number;
  meanAnomalyAtEpochDeg: number;
  color: number;
  meanRadiusKm?: number;
  meanDensityGramsPerCubicCentimeter?: number;
  orbitalCharacter: string;
  standoutFacts: string[];
  simulationImportance: string;
  modelDetail: NeptuneMoonModelDetail;
  provisionalNote?: string;
}

export interface NeptuneRingDefinition {
  name: "Galle" | "Leverrier" | "Lassell" | "Arago" | "Adams";
  family: NeptuneRingFamily;
  centerRadiusKm: number;
  physicalWidthKm: number;
  visualMinimumWidthKm: number;
  opacity: number;
  colorInner: number;
  colorOuter: number;
  particleCount: number;
  dataStatus: NeptuneDataStatus;
}

export interface NeptuneRingArcDefinition {
  id: "liberte" | "egalite" | "fraternite" | "courage";
  displayName: "Liberte" | "Egalite" | "Fraternite" | "Courage";
  ringName: "Adams";
  centerRadiusKm: number;
  visualWidthKm: number;
  centerAngleDeg: number;
  angularSpanDeg: number;
  opacity: number;
  colorInner: number;
  colorOuter: number;
  relativePlacement: string;
  nameStatus: NeptuneDataStatus;
  longitudeStatus: NeptuneDataStatus;
}

export const NEPTUNE_DESCRIPTION =
  "Neptune is a dense, distant ice giant with no solid visible surface: a muted blue-cyan atmosphere over a hot volatile-rich interior, faint dusty rings with Adams ring arcs, supersonic winds, transient dark vortices, and a moon system dominated by retrograde Triton.";

export const NEPTUNE_PHYSICAL = {
  name: "Neptune",
  class: "ice giant",
  meanRadiusKm: 24_622,
  equatorialRadiusKm: 24_764,
  polarRadiusKm: 24_341,
  massKg: 1.024_092e26,
  standardGravitationalParameterM3PerSecond2: 6.835_099_97e15,
  rotationPeriodHours: 16.11,
  axialTiltDeg: 28.32,
  meanDensityGramsPerCubicCentimeter: 1.638,
  surfaceGravityMetersPerSecondSquared: 11.15,
  escapeVelocityKmPerSecond: 23.56,
  geometricAlbedo: 0.41,
  bondAlbedo: 0.29,
  temperatureOneBarKelvin: 72,
  solarFluxWattsPerSquareMeter: 1.508,
  sunlightVsEarth: 0.0011,
  atmosphere: ["molecular hydrogen", "helium", "methane"] as const,
  moonCount: 16,
  namedMoonCount: 14,
  provisionalMoonCount: 2,
  hasTrueSolidSurface: false
};

export const NEPTUNE_ORBIT = {
  semiMajorAxisAU: 30.069_922_76,
  perihelionAU: 29.811_607_69,
  aphelionAU: 30.328_237_83,
  eccentricity: 0.008_590_48,
  orbitalPeriodEarthYears: 164.791_32,
  orbitalPeriodDays: 164.791_32 * EARTH_YEAR_DAYS,
  orbitalInclinationDeg: 1.770_043_47,
  meanOrbitalVelocityKmPerSecond: 5.43
};

export const NEPTUNE_DATA = {
  id: "neptune",
  name: "Neptune",
  type: "planet",
  classification: {
    primary: "ice giant",
    status: "verified" as NeptuneDataStatus,
    noSolidVisibleSurface: true
  },
  tags: [
    "ice giant",
    "outer solar system",
    "methane atmosphere",
    "faint rings",
    "Adams ring arcs",
    "Triton system"
  ],
  mass_kg: { value: NEPTUNE_PHYSICAL.massKg, status: "verified" },
  equatorial_radius_km: {
    value: NEPTUNE_PHYSICAL.equatorialRadiusKm,
    status: "verified"
  },
  mean_radius_km: {
    value: NEPTUNE_PHYSICAL.meanRadiusKm,
    status: "verified"
  },
  polar_radius_km: {
    value: NEPTUNE_PHYSICAL.polarRadiusKm,
    status: "verified"
  },
  diameter_km: {
    value: NEPTUNE_PHYSICAL.equatorialRadiusKm * 2,
    status: "verified",
    referenceLevel: "1 bar equator"
  },
  density_g_cm3: {
    value: NEPTUNE_PHYSICAL.meanDensityGramsPerCubicCentimeter,
    status: "verified"
  },
  gravity_m_s2: {
    value: NEPTUNE_PHYSICAL.surfaceGravityMetersPerSecondSquared,
    status: "approximate",
    referenceLevel: "equatorial 1 bar"
  },
  escape_velocity_km_s: {
    value: NEPTUNE_PHYSICAL.escapeVelocityKmPerSecond,
    status: "verified"
  },
  rotation_period_hours: {
    value: NEPTUNE_PHYSICAL.rotationPeriodHours,
    status: "verified",
    direction: "prograde"
  },
  orbital_period_days: {
    value: NEPTUNE_ORBIT.orbitalPeriodDays,
    status: "verified"
  },
  orbital_period_years: {
    value: NEPTUNE_ORBIT.orbitalPeriodEarthYears,
    status: "verified"
  },
  semi_major_axis_au: {
    value: NEPTUNE_ORBIT.semiMajorAxisAU,
    status: "verified"
  },
  perihelion_au: { value: NEPTUNE_ORBIT.perihelionAU, status: "approximate" },
  aphelion_au: { value: NEPTUNE_ORBIT.aphelionAU, status: "approximate" },
  eccentricity: { value: NEPTUNE_ORBIT.eccentricity, status: "verified" },
  inclination_deg: {
    value: NEPTUNE_ORBIT.orbitalInclinationDeg,
    status: "verified"
  },
  obliquity_deg: { value: NEPTUNE_PHYSICAL.axialTiltDeg, status: "verified" },
  mean_orbital_speed_km_s: {
    value: NEPTUNE_ORBIT.meanOrbitalVelocityKmPerSecond,
    status: "approximate"
  },
  albedo_geometric: {
    value: NEPTUNE_PHYSICAL.geometricAlbedo,
    status: "approximate",
    note: "Visible geometric albedo varies by source/filter convention."
  },
  temperature_1bar_k: {
    value: NEPTUNE_PHYSICAL.temperatureOneBarKelvin,
    status: "verified"
  },
  solar_flux_w_m2: {
    value: NEPTUNE_PHYSICAL.solarFluxWattsPerSquareMeter,
    status: "verified"
  },
  sunlight_vs_earth: {
    value: NEPTUNE_PHYSICAL.sunlightVsEarth,
    status: "approximate"
  },
  discovered_year: { value: 1846, status: "verified" },
  discovery_method: {
    value: "mathematical prediction followed by telescopic confirmation",
    status: "verified"
  },
  discovered_by: {
    value:
      "Johann Gottfried Galle and Heinrich Louis d'Arrest using Urbain Le Verrier's prediction",
    status: "verified"
  },
  first_close_mission: { value: "Voyager 2 flyby, 1989", status: "verified" },
  has_solid_surface: { value: false, status: "verified" },
  atmosphere: {
    status: "verified" as NeptuneDataStatus,
    bulkCompositionByVolume: {
      molecularHydrogenPercent: 80,
      heliumPercent: 19,
      methanePercent: 1.5
    },
    visualLayer:
      "Visible disk is atmosphere and haze, not terrain or a solid surface.",
    colorMechanism:
      "Methane absorbs red light; realistic renders should be muted deep blue to blue-cyan rather than saturated electric blue."
  },
  interior: {
    status: "inferred" as NeptuneDataStatus,
    model:
      "Hydrogen/helium envelope transitions into hot dense fluid rich in water, ammonia, and methane above a compact rock-rich core.",
    iceMeaning:
      "Ice giant refers to volatile-rich bulk composition, not ordinary frozen surface ice sheets."
  },
  weather: {
    status: "verified" as NeptuneDataStatus,
    windsKmPerHour: { value: 2_000, status: "approximate" },
    features: [
      "bright methane-ice clouds",
      "soft bands",
      "transient dark vortices",
      "fast zonal winds"
    ]
  },
  magnetosphere: {
    status: "verified" as NeptuneDataStatus,
    tiltFromRotationAxisDeg: { value: 47, status: "approximate" },
    fieldStrengthVsEarth: { value: 27, status: "approximate" },
    note: "Tilted, offset field creates a strongly time-variable magnetosphere."
  },
  rings: {
    status: "verified" as NeptuneDataStatus,
    mainCount: 5,
    arcs: ["Liberte", "Egalite", "Fraternite", "Courage"],
    note:
      "The rings are faint, dusty, narrow/patchy, and much less reflective than Saturn's broad icy rings."
  },
  moons: {
    status: "verified" as NeptuneDataStatus,
    knownCount: NEPTUNE_PHYSICAL.moonCount,
    namedCount: NEPTUNE_PHYSICAL.namedMoonCount,
    provisionalCount: NEPTUNE_PHYSICAL.provisionalMoonCount,
    majorSystemFeature: "Triton",
    provisionalDesignations: ["S/2002 N 5", "S/2021 N 1"]
  },
  visualization: {
    palette:
      "muted deep blue, blue-cyan, desaturated teal, white methane-ice clouds, low-opacity dark vortices",
    forbidden:
      "no rocky surface, no continents, no oceans, no coastlines, no electric-blue oversaturation"
  },
  simulation_notes: {
    noSurfaceConstraint:
      "Render the visible body as atmosphere. Do not attach terrain, elevation, biomes, oceans, or landable-surface systems to Neptune.",
    rings:
      "Adams arcs should be represented as faint clumps or partial arcs, not as a full bright Saturn-style band.",
    moons:
      "Render Triton as detailed, Proteus/Nereid as medium detail, and small inner/outer moons as lightweight bodies or points by LOD."
  },
  documentation_text: {
    shortCard:
      "Neptune is a distant ice giant with a muted methane-blue atmosphere, faint dusty rings, transient dark storms, and a moon system dominated by captured retrograde Triton.",
    uiTooltip:
      "Ice giant: no solid visible surface; faint rings and retrograde Triton.",
    developerComment:
      "Neptune visual layer is atmosphere only; keep rings faint and preserve all 16 known moons."
  }
} as const;

export const NEPTUNE_ROTATION_PERIOD_SECONDS =
  NEPTUNE_PHYSICAL.rotationPeriodHours * SECONDS_PER_HOUR;

export const NEPTUNE_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND =
  TAU / NEPTUNE_ROTATION_PERIOD_SECONDS;

export const NEPTUNE_AXIAL_TILT_RAD = degToRad(NEPTUNE_PHYSICAL.axialTiltDeg);

export const NEPTUNE_POLAR_TO_EQUATORIAL_RATIO =
  NEPTUNE_PHYSICAL.polarRadiusKm / NEPTUNE_PHYSICAL.equatorialRadiusKm;

export const NEPTUNE_ORBITAL_ELEMENTS: OrbitalElements = {
  semiMajorAxisAU: NEPTUNE_ORBIT.semiMajorAxisAU,
  eccentricity: NEPTUNE_ORBIT.eccentricity,
  inclinationRad: degToRad(NEPTUNE_ORBIT.orbitalInclinationDeg),
  orbitalPeriodSeconds:
    NEPTUNE_ORBIT.orbitalPeriodEarthYears * EARTH_YEAR_DAYS * SECONDS_PER_DAY,
  // JPL approximate planetary elements: mean longitude -55.12002969 deg minus
  // longitude of perihelion 44.96476227 deg at the shared J2000 epoch.
  meanAnomalyAtEpochRad: degToRad(259.915_208_04)
};

export const NEPTUNE_RINGS: NeptuneRingDefinition[] = [
  {
    name: "Galle",
    family: "mainNarrow",
    centerRadiusKm: 41_900,
    physicalWidthKm: 15,
    visualMinimumWidthKm: 260,
    opacity: 0.026,
    colorInner: 0x30363b,
    colorOuter: 0x56646b,
    particleCount: 260,
    dataStatus: "verified"
  },
  {
    name: "Leverrier",
    family: "mainNarrow",
    centerRadiusKm: 53_200,
    physicalWidthKm: 15,
    visualMinimumWidthKm: 260,
    opacity: 0.052,
    colorInner: 0x394047,
    colorOuter: 0x75838a,
    particleCount: 340,
    dataStatus: "verified"
  },
  {
    name: "Lassell",
    family: "plateauDiffuse",
    centerRadiusKm: 55_400,
    physicalWidthKm: 4_000,
    visualMinimumWidthKm: 4_000,
    opacity: 0.014,
    colorInner: 0x24323a,
    colorOuter: 0x5d6d73,
    particleCount: 420,
    dataStatus: "approximate"
  },
  {
    name: "Arago",
    family: "mainNarrow",
    centerRadiusKm: 57_600,
    physicalWidthKm: 100,
    visualMinimumWidthKm: 260,
    opacity: 0.028,
    colorInner: 0x334047,
    colorOuter: 0x68777e,
    particleCount: 260,
    dataStatus: "approximate"
  },
  {
    name: "Adams",
    family: "mainNarrow",
    centerRadiusKm: 62_930,
    physicalWidthKm: 50,
    visualMinimumWidthKm: 300,
    opacity: 0.066,
    colorInner: 0x3b4149,
    colorOuter: 0x839098,
    particleCount: 520,
    dataStatus: "verified"
  }
];

export const NEPTUNE_RING_ARCS: NeptuneRingArcDefinition[] = [
  {
    id: "liberte",
    displayName: "Liberte",
    ringName: "Adams",
    centerRadiusKm: 62_900,
    visualWidthKm: 460,
    centerAngleDeg: 12,
    angularSpanDeg: 13,
    opacity: 0.15,
    colorInner: 0x7f8c94,
    colorOuter: 0xc4d4db,
    relativePlacement: "leading Adams arc",
    nameStatus: "verified",
    longitudeStatus: "inferred"
  },
  {
    id: "egalite",
    displayName: "Egalite",
    ringName: "Adams",
    centerRadiusKm: 62_900,
    visualWidthKm: 520,
    centerAngleDeg: 31,
    angularSpanDeg: 18,
    opacity: 0.17,
    colorInner: 0x84939a,
    colorOuter: 0xd0e0e5,
    relativePlacement: "central/equidistant Adams arc complex",
    nameStatus: "verified",
    longitudeStatus: "inferred"
  },
  {
    id: "fraternite",
    displayName: "Fraternite",
    ringName: "Adams",
    centerRadiusKm: 62_900,
    visualWidthKm: 520,
    centerAngleDeg: 55,
    angularSpanDeg: 15,
    opacity: 0.14,
    colorInner: 0x78878f,
    colorOuter: 0xbdcdd4,
    relativePlacement: "following Adams arc",
    nameStatus: "verified",
    longitudeStatus: "inferred"
  },
  {
    id: "courage",
    displayName: "Courage",
    ringName: "Adams",
    centerRadiusKm: 62_900,
    visualWidthKm: 430,
    centerAngleDeg: 85,
    angularSpanDeg: 10,
    opacity: 0.11,
    colorInner: 0x6e7c84,
    colorOuter: 0xaebec6,
    relativePlacement: "separate Adams arc",
    nameStatus: "verified",
    longitudeStatus: "inferred"
  }
];

export const NEPTUNE_MOONS: NeptuneMoonDefinition[] = [
  {
    id: "naiad",
    displayName: "Naiad",
    officialName: "Naiad",
    status: "named",
    statusCertainty: "verified",
    group: "innerRegular",
    orbitDirection: "prograde",
    meanRadiusKm: 29,
    meanDensityGramsPerCubicCentimeter: 1.2511,
    semiMajorAxisKm: 48_200,
    eccentricity: 0,
    orbitalPeriodDays: 0.293_98,
    orbitalInclinationDeg: 4.7,
    meanAnomalyAtEpochDeg: 89.7,
    color: 0x6e7476,
    orbitalCharacter: "prograde, close-in, near-circular regular orbit",
    standoutFacts: ["innermost known Neptunian moon", "ring-region moon"],
    simulationImportance: "lightweight inner moon for scale and ring context",
    modelDetail: "lightweightPoint"
  },
  {
    id: "thalassa",
    displayName: "Thalassa",
    officialName: "Thalassa",
    status: "named",
    statusCertainty: "verified",
    group: "innerRegular",
    orbitDirection: "prograde",
    meanRadiusKm: 40,
    meanDensityGramsPerCubicCentimeter: 1.3184,
    semiMajorAxisKm: 50_100,
    eccentricity: 0,
    orbitalPeriodDays: 0.311_078,
    orbitalInclinationDeg: 0.2,
    meanAnomalyAtEpochDeg: 165.7,
    color: 0x747b7c,
    orbitalCharacter: "prograde, close-in, near-circular regular orbit",
    standoutFacts: ["small inner moon", "part of the compact regular system"],
    simulationImportance: "lightweight inner moon for orbital crowding",
    modelDetail: "lightweightPoint"
  },
  {
    id: "despina",
    displayName: "Despina",
    officialName: "Despina",
    status: "named",
    statusCertainty: "verified",
    group: "innerRegular",
    orbitDirection: "prograde",
    meanRadiusKm: 74,
    meanDensityGramsPerCubicCentimeter: 1.0304,
    semiMajorAxisKm: 52_500,
    eccentricity: 0,
    orbitalPeriodDays: 0.334_656,
    orbitalInclinationDeg: 0,
    meanAnomalyAtEpochDeg: 125.1,
    color: 0x6d7475,
    orbitalCharacter: "prograde, near-circular inner regular orbit",
    standoutFacts: ["inner regular moon", "orbits near the Leverrier ring"],
    simulationImportance: "ring-context moon",
    modelDetail: "lightweightPoint"
  },
  {
    id: "galatea",
    displayName: "Galatea",
    officialName: "Galatea",
    status: "named",
    statusCertainty: "verified",
    group: "innerRegular",
    orbitDirection: "prograde",
    meanRadiusKm: 79,
    meanDensityGramsPerCubicCentimeter: 1.3777,
    semiMajorAxisKm: 62_000,
    eccentricity: 0,
    orbitalPeriodDays: 0.428_744,
    orbitalInclinationDeg: 0,
    meanAnomalyAtEpochDeg: 86.7,
    color: 0x788081,
    orbitalCharacter: "prograde, near-circular orbit just inward of Adams",
    standoutFacts: ["associated with confinement of Adams ring arcs"],
    simulationImportance: "important ring-arc context moon",
    modelDetail: "lightweightPoint"
  },
  {
    id: "larissa",
    displayName: "Larissa",
    officialName: "Larissa",
    status: "named",
    statusCertainty: "verified",
    group: "innerRegular",
    orbitDirection: "prograde",
    meanRadiusKm: 96,
    meanDensityGramsPerCubicCentimeter: 1.0303,
    semiMajorAxisKm: 73_500,
    eccentricity: 0.001,
    orbitalPeriodDays: 0.554_989,
    orbitalInclinationDeg: 0.2,
    meanAnomalyAtEpochDeg: 165.5,
    color: 0x808381,
    orbitalCharacter: "prograde, low-eccentricity inner regular orbit",
    standoutFacts: ["larger inner regular moon"],
    simulationImportance: "visible inner-system scale marker",
    modelDetail: "lightweightPoint"
  },
  {
    id: "hippocamp",
    displayName: "Hippocamp",
    officialName: "Hippocamp",
    status: "named",
    statusCertainty: "verified",
    group: "innerRegular",
    orbitDirection: "prograde",
    meanRadiusKm: 17,
    semiMajorAxisKm: 105_300,
    eccentricity: 0.001,
    orbitalPeriodDays: 0.950_39,
    orbitalInclinationDeg: 0.3,
    meanAnomalyAtEpochDeg: 286.5,
    color: 0x697173,
    orbitalCharacter: "prograde, tiny regular moon between Larissa and Proteus",
    standoutFacts: ["small moon discovered in Hubble data", "near Proteus"],
    simulationImportance: "lightweight moon preserving complete 16-moon count",
    modelDetail: "lightweightPoint"
  },
  {
    id: "proteus",
    displayName: "Proteus",
    officialName: "Proteus",
    status: "named",
    statusCertainty: "verified",
    group: "innerRegular",
    orbitDirection: "prograde",
    meanRadiusKm: 208,
    meanDensityGramsPerCubicCentimeter: 1.0269,
    semiMajorAxisKm: 117_600,
    eccentricity: 0,
    orbitalPeriodDays: 1.122_315,
    orbitalInclinationDeg: 0,
    meanAnomalyAtEpochDeg: 276.8,
    color: 0x85847d,
    orbitalCharacter: "prograde, outer regular moon",
    standoutFacts: ["largest regular inner moon", "irregularly shaped icy body"],
    simulationImportance: "medium-detail moon outside the main ring system",
    modelDetail: "mediumDetailBody"
  },
  {
    id: "triton",
    displayName: "Triton",
    officialName: "Triton",
    status: "named",
    statusCertainty: "verified",
    group: "majorCaptured",
    orbitDirection: "retrograde",
    meanRadiusKm: 1_352.6,
    meanDensityGramsPerCubicCentimeter: 2.0649,
    semiMajorAxisKm: 354_800,
    eccentricity: 0,
    orbitalPeriodDays: 5.876_994,
    orbitalInclinationDeg: 157.3,
    meanAnomalyAtEpochDeg: 63,
    color: 0xd7cec2,
    orbitalCharacter: "large retrograde, inclined captured-moon orbit",
    standoutFacts: [
      "only large moon with a retrograde orbit",
      "thin nitrogen atmosphere",
      "Voyager 2 observed geyser-like plumes"
    ],
    simulationImportance: "primary detailed moon and science highlight",
    modelDetail: "detailedBody"
  },
  {
    id: "nereid",
    displayName: "Nereid",
    officialName: "Nereid",
    status: "named",
    statusCertainty: "verified",
    group: "transitional",
    orbitDirection: "prograde",
    meanRadiusKm: 170,
    semiMajorAxisKm: 5_513_900,
    eccentricity: 0.751,
    orbitalPeriodDays: 360.133_039,
    orbitalInclinationDeg: 5.1,
    meanAnomalyAtEpochDeg: 318.5,
    color: 0x8f8175,
    orbitalCharacter: "highly eccentric prograde outer orbit",
    standoutFacts: ["extreme eccentricity", "likely dynamically disturbed"],
    simulationImportance: "medium-detail transition from regular to irregular system",
    modelDetail: "mediumDetailBody"
  },
  {
    id: "halimede",
    displayName: "Halimede",
    officialName: "Halimede",
    status: "named",
    statusCertainty: "verified",
    group: "outerIrregular",
    orbitDirection: "retrograde",
    meanRadiusKm: 30,
    semiMajorAxisKm: 16_590_500,
    eccentricity: 0.521,
    orbitalPeriodDays: 1_879,
    orbitalInclinationDeg: 119.6,
    meanAnomalyAtEpochDeg: 135.8,
    color: 0x756b66,
    orbitalCharacter: "distant retrograde irregular orbit",
    standoutFacts: ["outer captured irregular moon"],
    simulationImportance: "lightweight distant irregular moon",
    modelDetail: "lightweightPoint"
  },
  {
    id: "sao",
    displayName: "Sao",
    officialName: "Sao",
    status: "named",
    statusCertainty: "verified",
    group: "outerIrregular",
    orbitDirection: "prograde",
    meanRadiusKm: 20,
    semiMajorAxisKm: 22_239_900,
    eccentricity: 0.296,
    orbitalPeriodDays: 2_919,
    orbitalInclinationDeg: 50.2,
    meanAnomalyAtEpochDeg: 178.5,
    color: 0x7f766b,
    orbitalCharacter: "distant inclined prograde irregular orbit",
    standoutFacts: ["member of the Sao-like prograde grouping"],
    simulationImportance: "lightweight prograde irregular moon",
    modelDetail: "lightweightPoint"
  },
  {
    id: "s2002-n5",
    displayName: "S/2002 N 5",
    provisionalDesignation: "S/2002 N 5",
    status: "provisional",
    statusCertainty: "provisional",
    group: "outerIrregular",
    orbitDirection: "prograde",
    meanRadiusKm: 11.5,
    semiMajorAxisKm: 23_414_700,
    eccentricity: 0.433,
    orbitalPeriodDays: 3_151,
    orbitalInclinationDeg: 46.3,
    meanAnomalyAtEpochDeg: 303.2,
    color: 0x746e66,
    orbitalCharacter: "distant inclined prograde irregular orbit",
    standoutFacts: [
      "provisional designation retained",
      "similar orbit to Sao and Laomedeia"
    ],
    simulationImportance: "required for complete current 16-moon catalog",
    modelDetail: "lightweightPoint",
    provisionalNote:
      "No IAU-approved permanent name is assigned in the project baseline."
  },
  {
    id: "laomedeia",
    displayName: "Laomedeia",
    officialName: "Laomedeia",
    status: "named",
    statusCertainty: "verified",
    group: "outerIrregular",
    orbitDirection: "prograde",
    meanRadiusKm: 20,
    semiMajorAxisKm: 23_499_900,
    eccentricity: 0.419,
    orbitalPeriodDays: 3_168,
    orbitalInclinationDeg: 36.9,
    meanAnomalyAtEpochDeg: 248.1,
    color: 0x82786d,
    orbitalCharacter: "distant inclined prograde irregular orbit",
    standoutFacts: ["Sao-like prograde irregular grouping"],
    simulationImportance: "lightweight prograde irregular moon",
    modelDetail: "lightweightPoint"
  },
  {
    id: "psamathe",
    displayName: "Psamathe",
    officialName: "Psamathe",
    status: "named",
    statusCertainty: "verified",
    group: "outerIrregular",
    orbitDirection: "retrograde",
    meanRadiusKm: 20,
    semiMajorAxisKm: 47_646_600,
    eccentricity: 0.413,
    orbitalPeriodDays: 9_149,
    orbitalInclinationDeg: 127.8,
    meanAnomalyAtEpochDeg: 183.2,
    color: 0x726b65,
    orbitalCharacter: "very distant retrograde irregular orbit",
    standoutFacts: ["Neso-like retrograde grouping"],
    simulationImportance: "lightweight outer retrograde moon",
    modelDetail: "lightweightPoint"
  },
  {
    id: "neso",
    displayName: "Neso",
    officialName: "Neso",
    status: "named",
    statusCertainty: "verified",
    group: "outerIrregular",
    orbitDirection: "retrograde",
    meanRadiusKm: 30,
    semiMajorAxisKm: 49_897_800,
    eccentricity: 0.455,
    orbitalPeriodDays: 9_805,
    orbitalInclinationDeg: 128.4,
    meanAnomalyAtEpochDeg: 13.8,
    color: 0x776f68,
    orbitalCharacter: "very distant retrograde irregular orbit",
    standoutFacts: ["one of Neptune's farthest named moons"],
    simulationImportance: "lightweight outer-system scale marker",
    modelDetail: "lightweightPoint"
  },
  {
    id: "s2021-n1",
    displayName: "S/2021 N 1",
    provisionalDesignation: "S/2021 N 1",
    status: "provisional",
    statusCertainty: "provisional",
    group: "outerIrregular",
    orbitDirection: "retrograde",
    meanRadiusKm: 7,
    semiMajorAxisKm: 50_700_200,
    eccentricity: 0.503,
    orbitalPeriodDays: 10_043,
    orbitalInclinationDeg: 135.2,
    meanAnomalyAtEpochDeg: 237.1,
    color: 0x6b6661,
    orbitalCharacter: "outermost very distant retrograde irregular orbit",
    standoutFacts: [
      "provisional designation retained",
      "similar orbit to Psamathe and Neso",
      "longest known Neptunian moon period in this baseline"
    ],
    simulationImportance: "required for complete current 16-moon catalog",
    modelDetail: "lightweightPoint",
    provisionalNote:
      "No IAU-approved permanent name is assigned in the project baseline."
  }
];

export const NEPTUNE_TRITON = NEPTUNE_MOONS.find(
  (moon) => moon.id === "triton"
)!;

export const NEPTUNE_REGULAR_AND_TRITON_MOONS = NEPTUNE_MOONS.filter(
  (moon) => moon.group === "innerRegular" || moon.group === "majorCaptured"
);

export const NEPTUNE_DISTANT_MOONS = NEPTUNE_MOONS.filter(
  (moon) => moon.group === "transitional" || moon.group === "outerIrregular"
);

export const NEPTUNE_MOON_VISUAL_RADIUS_BOOST = 3.0;
export const NEPTUNE_TRITON_VISUAL_RADIUS_BOOST = 2.55;
export const NEPTUNE_SMALL_MOON_VISUAL_RADIUS = 0.013;
export const NEPTUNE_MEDIUM_MOON_VISUAL_RADIUS = 0.023;
export const NEPTUNE_DISTANT_MOON_VISUAL_RADIUS = 0.018;
export const NEPTUNE_DISTANT_ORBIT_INNER_SCENE_RADIUS = 15.2;
export const NEPTUNE_DISTANT_ORBIT_OUTER_SCENE_RADIUS = 31.5;

export const NEPTUNE_MOON_ORBITAL_PERIOD_SECONDS = (
  periodDays: number
): number => periodDays * SECONDS_PER_DAY;
