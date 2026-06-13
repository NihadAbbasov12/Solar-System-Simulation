export type BodyId =
  | "sun"
  | "mercury"
  | "venus"
  | "earth"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune";

export interface BodyFacts {
  type: string;
  radius: string;
  rotation: string;
  orbit: string;
  distance: string;
  moons: string;
}

export interface BodyEntry {
  id: BodyId;
  label: string;
  accentColor: string;
  facts: BodyFacts;
}

export const BODY_CATALOG: readonly BodyEntry[] = [
  {
    id: "sun",
    label: "Sun",
    accentColor: "#ffd27d",
    facts: {
      type: "G2V yellow dwarf star",
      radius: "696,340 km",
      rotation: "25.4 d (equatorial)",
      orbit: "230 My around galaxy",
      distance: "0 AU",
      moons: "8 planets"
    }
  },
  {
    id: "mercury",
    label: "Mercury",
    accentColor: "#9c9489",
    facts: {
      type: "Rocky planet",
      radius: "2,439.7 km",
      rotation: "58.6 d",
      orbit: "88.0 d",
      distance: "0.39 AU",
      moons: "0"
    }
  },
  {
    id: "venus",
    label: "Venus",
    accentColor: "#e8c97e",
    facts: {
      type: "Rocky planet",
      radius: "6,051.8 km",
      rotation: "243 d, retrograde",
      orbit: "224.7 d",
      distance: "0.72 AU",
      moons: "0"
    }
  },
  {
    id: "earth",
    label: "Earth",
    accentColor: "#6fa8ff",
    facts: {
      type: "Rocky planet",
      radius: "6,371.0 km",
      rotation: "23.93 h",
      orbit: "365.25 d",
      distance: "1.00 AU",
      moons: "1"
    }
  },
  {
    id: "mars",
    label: "Mars",
    accentColor: "#e07a52",
    facts: {
      type: "Rocky planet",
      radius: "3,389.5 km",
      rotation: "24.62 h",
      orbit: "687.0 d",
      distance: "1.52 AU",
      moons: "2"
    }
  },
  {
    id: "jupiter",
    label: "Jupiter",
    accentColor: "#d9a06c",
    facts: {
      type: "Gas giant",
      radius: "69,911 km",
      rotation: "9.93 h",
      orbit: "11.86 y",
      distance: "5.20 AU",
      moons: "95"
    }
  },
  {
    id: "saturn",
    label: "Saturn",
    accentColor: "#e3c08a",
    facts: {
      type: "Gas giant",
      radius: "58,232 km",
      rotation: "10.66 h",
      orbit: "29.46 y",
      distance: "9.54 AU",
      moons: "146"
    }
  },
  {
    id: "uranus",
    label: "Uranus",
    accentColor: "#9fe0e3",
    facts: {
      type: "Ice giant",
      radius: "25,362 km",
      rotation: "17.24 h, retrograde",
      orbit: "84.0 y",
      distance: "19.19 AU",
      moons: "28"
    }
  },
  {
    id: "neptune",
    label: "Neptune",
    accentColor: "#6f8cff",
    facts: {
      type: "Ice giant",
      radius: "24,622 km",
      rotation: "16.11 h",
      orbit: "164.8 y",
      distance: "30.07 AU",
      moons: "16"
    }
  }
];

export function getBodyEntry(id: BodyId): BodyEntry {
  const entry = BODY_CATALOG.find((candidate) => candidate.id === id);

  if (!entry) {
    throw new Error(`Unknown body id: ${id}`);
  }

  return entry;
}
