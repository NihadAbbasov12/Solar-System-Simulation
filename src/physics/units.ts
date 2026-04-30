export const KM_PER_AU = 149_597_870.7;
export const SECONDS_PER_HOUR = 3_600;
export const SECONDS_PER_DAY = 86_400;
export const EARTH_YEAR_DAYS = 365.256_363_004;

// Orbital distances use this scale. Saturn's semi-major axis is about
// 9.539 AU, so its rendered orbit radius is about 171.7 scene units.
export const SCENE_UNITS_PER_AU = 18;

// The planet/ring system uses a separate local scale so Saturn is visible.
// One rendered Saturn equatorial radius equals one scene unit.
export const SATURN_EQUATORIAL_RADIUS_SCENE_UNITS = 1;

// Earth uses the same local-rendering approach at a terrestrial readable size.
export const EARTH_EQUATORIAL_RADIUS_SCENE_UNITS = 0.32;

export function auToKilometers(au: number): number {
  return au * KM_PER_AU;
}

export function auToSceneDistance(au: number): number {
  return au * SCENE_UNITS_PER_AU;
}

export function kilometersToSaturnLocalRadius(
  kilometers: number,
  saturnEquatorialRadiusKm: number
): number {
  return (
    (kilometers / saturnEquatorialRadiusKm) *
    SATURN_EQUATORIAL_RADIUS_SCENE_UNITS
  );
}

export function kilometersToEarthLocalRadius(
  kilometers: number,
  earthEquatorialRadiusKm: number
): number {
  return (
    (kilometers / earthEquatorialRadiusKm) *
    EARTH_EQUATORIAL_RADIUS_SCENE_UNITS
  );
}

export function actualSaturnRadiusIfOrbitScaleWereUsed(
  saturnEquatorialRadiusKm: number
): number {
  return auToSceneDistance(saturnEquatorialRadiusKm / KM_PER_AU);
}
