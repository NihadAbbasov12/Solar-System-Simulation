import { describe, expect, it } from "vitest";
import {
  URANUS_DATA,
  URANUS_MOONS,
  URANUS_PHYSICAL,
  URANUS_RINGS
} from "./uranusConstants";

describe("Uranus scientific data", () => {
  it("keeps the ice-giant physical constraints explicit", () => {
    expect(URANUS_DATA.class).toBe("ice giant");
    expect(URANUS_PHYSICAL.hasTrueSolidSurface).toBe(false);
    expect(URANUS_PHYSICAL.axialTiltDeg).toBeCloseTo(97.77, 2);
    expect(URANUS_PHYSICAL.rotationPeriodHours).toBeLessThan(0);
    expect(URANUS_DATA.rotationPeriod.direction).toBe("retrograde");
  });

  it("represents all 13 rings in increasing distance order", () => {
    expect(URANUS_RINGS.map((ring) => ring.name)).toEqual([
      "Zeta",
      "6",
      "5",
      "4",
      "Alpha",
      "Beta",
      "Eta",
      "Gamma",
      "Delta",
      "Lambda",
      "Epsilon",
      "Nu",
      "Mu"
    ]);
    expect(URANUS_RINGS.every((ring) => ring.opacity <= 0.16)).toBe(true);
  });

  it("keeps named and provisional moons distinct", () => {
    expect(URANUS_MOONS).toHaveLength(URANUS_PHYSICAL.moonCount);

    const provisionalMoons = URANUS_MOONS.filter(
      (moon) => moon.status === "provisional"
    );
    expect(provisionalMoons.map((moon) => moon.displayName)).toEqual([
      "S/2025 U 1",
      "S/2023 U 1"
    ]);
    expect(provisionalMoons.every((moon) => moon.officialName === undefined)).toBe(
      true
    );
  });

  it("places geology on the major moons, not Uranus itself", () => {
    const geologyText = URANUS_MOONS.filter((moon) => moon.group === "major")
      .map((moon) => moon.geology)
      .join(" ");

    expect(geologyText).toContain("coronae");
    expect(geologyText).toContain("tectonic");
    expect(geologyText).toContain("heavily cratered");
    expect(URANUS_DATA.scientificNotes.interior).toContain("not a landable");
  });
});
