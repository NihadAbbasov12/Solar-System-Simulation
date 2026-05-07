import { describe, expect, it } from "vitest";
import {
  NEPTUNE_DATA,
  NEPTUNE_MOONS,
  NEPTUNE_PHYSICAL,
  NEPTUNE_RING_ARCS,
  NEPTUNE_RINGS
} from "./neptuneConstants";

describe("Neptune scientific data", () => {
  it("keeps the ice-giant and no-solid-surface constraints explicit", () => {
    expect(NEPTUNE_DATA.classification.primary).toBe("ice giant");
    expect(NEPTUNE_PHYSICAL.hasTrueSolidSurface).toBe(false);
    expect(NEPTUNE_DATA.has_solid_surface.value).toBe(false);
    expect(NEPTUNE_DATA.visualization.forbidden).toContain("no rocky surface");
  });

  it("represents the five main rings and the named Adams arcs", () => {
    expect(NEPTUNE_RINGS.map((ring) => ring.name)).toEqual([
      "Galle",
      "Leverrier",
      "Lassell",
      "Arago",
      "Adams"
    ]);
    expect(NEPTUNE_RING_ARCS.map((arc) => arc.displayName)).toEqual([
      "Liberte",
      "Egalite",
      "Fraternite",
      "Courage"
    ]);
    expect(NEPTUNE_RING_ARCS.every((arc) => arc.ringName === "Adams")).toBe(
      true
    );
  });

  it("keeps the current 16-moon catalog with provisional moons distinct", () => {
    expect(NEPTUNE_MOONS).toHaveLength(NEPTUNE_PHYSICAL.moonCount);

    const provisionalMoons = NEPTUNE_MOONS.filter(
      (moon) => moon.status === "provisional"
    );
    expect(provisionalMoons.map((moon) => moon.displayName)).toEqual([
      "S/2002 N 5",
      "S/2021 N 1"
    ]);
    expect(provisionalMoons.every((moon) => moon.officialName === undefined)).toBe(
      true
    );
  });

  it("marks Triton as a major retrograde captured moon", () => {
    const triton = NEPTUNE_MOONS.find((moon) => moon.id === "triton");

    expect(triton).toBeDefined();
    expect(triton?.group).toBe("majorCaptured");
    expect(triton?.orbitDirection).toBe("retrograde");
    expect(triton?.modelDetail).toBe("detailedBody");
    expect(triton?.standoutFacts.join(" ")).toContain("retrograde");
  });

  it("does not attach terrestrial geology to Neptune itself", () => {
    expect(NEPTUNE_DATA.interior.iceMeaning).toContain("not ordinary frozen");
    expect(NEPTUNE_DATA.simulation_notes.noSurfaceConstraint).toContain(
      "Do not attach terrain"
    );
  });
});
