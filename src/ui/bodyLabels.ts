import { Vector3, type PerspectiveCamera } from "three";
import { getBodyEntry, type BodyId } from "./bodyCatalog";

export interface BodyLabelSource {
  id: BodyId;
  getPosition: () => Vector3;
}

export interface BodyLabels {
  element: HTMLElement;
  update: (camera: PerspectiveCamera, focusedId: BodyId | undefined) => void;
  setVisible: (visible: boolean) => void;
}

const projected = new Vector3();

export function createBodyLabels(
  sources: readonly BodyLabelSource[],
  onSelect: (id: BodyId) => void
): BodyLabels {
  const container = document.createElement("div");
  container.className = "body-labels";
  container.setAttribute("aria-hidden", "false");

  const labels = sources.map((source) => {
    const entry = getBodyEntry(source.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "body-label";
    button.style.setProperty("--accent", entry.accentColor);

    const dot = document.createElement("span");
    dot.className = "body-label-dot";
    const text = document.createElement("span");
    text.className = "body-label-text";
    text.textContent = entry.label;
    button.append(dot, text);

    button.addEventListener("click", () => {
      onSelect(source.id);
    });

    container.append(button);
    return { source, button };
  });

  return {
    element: container,
    update: (camera, focusedId) => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      for (const { source, button } of labels) {
        const worldPosition = source.getPosition();
        projected.copy(worldPosition).project(camera);

        const isBehindCamera = projected.z > 1 || projected.z < -1;
        const x = (projected.x * 0.5 + 0.5) * width;
        const y = (-projected.y * 0.5 + 0.5) * height;
        const isOffScreen =
          x < -40 || x > width + 40 || y < -20 || y > height + 20;

        if (isBehindCamera || isOffScreen) {
          button.style.display = "none";
          continue;
        }

        const distance = camera.position.distanceTo(worldPosition);
        // The focused body's label hides when the camera is parked right on
        // top of it, so text does not float over the planet's face.
        if (source.id === focusedId && distance < 24) {
          button.style.display = "none";
          continue;
        }

        button.style.display = "";
        button.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -150%)`;
        button.classList.toggle("is-focused", source.id === focusedId);
      }
    },
    setVisible: (visible) => {
      container.style.display = visible ? "" : "none";
    }
  };
}
