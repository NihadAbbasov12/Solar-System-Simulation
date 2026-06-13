import { getBodyEntry, type BodyId } from "./bodyCatalog";

export interface InfoPanel {
  element: HTMLElement;
  setBody: (id: BodyId | undefined) => void;
}

const FACT_ROWS: ReadonlyArray<{
  key: keyof ReturnType<typeof factsOf>;
  label: string;
}> = [
  { key: "type", label: "Type" },
  { key: "radius", label: "Mean radius" },
  { key: "rotation", label: "Rotation" },
  { key: "orbit", label: "Orbital period" },
  { key: "distance", label: "Distance" },
  { key: "moons", label: "Moons" }
];

function factsOf(id: BodyId) {
  return getBodyEntry(id).facts;
}

export function createInfoPanel(): InfoPanel {
  const panel = document.createElement("section");
  panel.className = "info-panel";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Selected body facts");

  const title = document.createElement("div");
  title.className = "info-title";
  const dot = document.createElement("span");
  dot.className = "info-dot";
  const heading = document.createElement("h2");
  title.append(dot, heading);
  panel.append(title);

  const grid = document.createElement("dl");
  grid.className = "info-grid";
  panel.append(grid);

  const cells = new Map<string, HTMLElement>();

  for (const row of FACT_ROWS) {
    const dt = document.createElement("dt");
    dt.textContent = row.label;
    const dd = document.createElement("dd");
    dd.textContent = "-";
    grid.append(dt, dd);
    cells.set(row.key, dd);
  }

  return {
    element: panel,
    setBody: (id) => {
      if (!id) {
        panel.hidden = true;
        return;
      }

      const entry = getBodyEntry(id);
      panel.hidden = false;
      heading.textContent = entry.label;
      dot.style.background = entry.accentColor;
      dot.style.boxShadow = `0 0 10px ${entry.accentColor}`;

      for (const row of FACT_ROWS) {
        cells.get(row.key)!.textContent = entry.facts[row.key];
      }
    }
  };
}
