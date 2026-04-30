import type { Vector3 } from "three";
import { radToDeg } from "../utils/math";
import type { OrbitalState } from "../physics/orbitalMechanics";
import type { TimeController } from "../physics/timeController";

export interface DebugUpdateState {
  orbitalState: OrbitalState;
  positionScene: Vector3;
  axisWorld: Vector3;
  sunDirectionWorld: Vector3;
  rotationAngleRad: number;
}

export interface DebugBodyState {
  name: string;
  updateState: DebugUpdateState;
  rotationPeriodHours: number;
}

export interface DebugPanel {
  element: HTMLElement;
  setVisible: (visible: boolean) => void;
  update: (bodyState: DebugBodyState, timeController: TimeController) => void;
}

export function createDebugPanel(): DebugPanel {
  const panel = document.createElement("section");
  panel.className = "debug-panel";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Debug readout");

  const title = document.createElement("div");
  title.className = "panel-title";
  title.innerHTML = "<h2>Debug</h2><span>live state</span>";
  panel.append(title);

  const grid = document.createElement("dl");
  grid.className = "debug-grid";
  panel.append(grid);

  const rows = new Map<string, HTMLElement>();
  addRow(grid, rows, "Body", "body");
  addRow(grid, rows, "Sim date", "date");
  addRow(grid, rows, "Orbit angle", "trueAnomaly");
  addRow(grid, rows, "Mean anomaly", "meanAnomaly");
  addRow(grid, rows, "Distance", "distance");
  addRow(grid, rows, "Rotation speed", "rotation");
  addRow(grid, rows, "Speed", "speed");
  addRow(grid, rows, "Axis vector", "axis");
  addRow(grid, rows, "Kepler iterations", "iterations");

  return {
    element: panel,
    setVisible: (visible) => {
      panel.hidden = !visible;
    },
    update: (bodyState, timeController) => {
      const state = bodyState.updateState;
      rows.get("body")!.textContent = bodyState.name;
      rows.get("date")!.textContent = timeController
        .getSimulatedDate()
        .toISOString()
        .replace(".000Z", "Z");
      rows.get("trueAnomaly")!.textContent = `${radToDeg(
        state.orbitalState.trueAnomalyRad
      ).toFixed(2)} deg`;
      rows.get("meanAnomaly")!.textContent = `${radToDeg(
        state.orbitalState.meanAnomalyRad
      ).toFixed(2)} deg`;
      rows.get("distance")!.textContent = `${state.orbitalState.radiusAU.toFixed(
        3
      )} AU`;
      rows.get("rotation")!.textContent = `${bodyState.rotationPeriodHours.toFixed(
        3
      )} h / spin`;
      rows.get("speed")!.textContent = `${formatMultiplier(
        timeController.getSpeedMultiplier()
      )}${timeController.isPaused() ? " paused" : ""}`;
      rows.get("axis")!.textContent = `${state.axisWorld.x.toFixed(
        2
      )}, ${state.axisWorld.y.toFixed(2)}, ${state.axisWorld.z.toFixed(2)}`;
      rows.get("iterations")!.textContent = String(state.orbitalState.iterations);
    }
  };
}

function addRow(
  grid: HTMLElement,
  rows: Map<string, HTMLElement>,
  label: string,
  key: string
): void {
  const dt = document.createElement("dt");
  dt.textContent = label;
  const dd = document.createElement("dd");
  dd.textContent = "-";
  grid.append(dt, dd);
  rows.set(key, dd);
}

function formatMultiplier(multiplier: number): string {
  if (multiplier < 1_000) {
    return `${multiplier.toFixed(multiplier === 1 ? 0 : 1)}x`;
  }

  if (multiplier < 1_000_000) {
    return `${Math.round(multiplier).toLocaleString()}x`;
  }

  return `${multiplier.toExponential(2)}x`;
}
