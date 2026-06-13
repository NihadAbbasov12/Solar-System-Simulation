import type { TimeController } from "../physics/timeController";
import { BODY_CATALOG, type BodyId } from "./bodyCatalog";

export type FocusMode = BodyId | "overview";

export interface SimulationControlsOptions {
  onDebugChanged: (enabled: boolean) => void;
  onFocusModeChanged: (mode: FocusMode) => void;
  onReset: () => void;
}

export interface SimulationControls {
  element: HTMLElement;
  update: () => void;
  getFocusMode: () => FocusMode;
  setFocusMode: (mode: FocusMode) => void;
}

export function createSimulationControls(
  timeController: TimeController,
  options: SimulationControlsOptions
): SimulationControls {
  const panel = document.createElement("section");
  panel.className = "control-panel";
  panel.setAttribute("aria-label", "Simulation controls");

  const title = document.createElement("div");
  title.className = "panel-title";
  title.innerHTML = "<h1>Solar System</h1><span>Keplerian model</span>";
  panel.append(title);

  const readout = document.createElement("div");
  readout.className = "time-readout";
  readout.innerHTML = `
    <div class="time-date" aria-label="Simulated date">-</div>
    <div class="time-status">-</div>
  `;
  const dateLine = readout.querySelector<HTMLElement>(".time-date")!;
  const statusLine = readout.querySelector<HTMLElement>(".time-status")!;
  panel.append(readout);

  const focusHeading = document.createElement("div");
  focusHeading.className = "section-heading";
  focusHeading.textContent = "Focus";
  panel.append(focusHeading);

  const focusGrid = document.createElement("div");
  focusGrid.className = "focus-grid";
  panel.append(focusGrid);

  const focusButtons = new Map<FocusMode, HTMLButtonElement>();

  const overviewButton = createFocusButton("System", "#cfd8dc");
  focusGrid.append(overviewButton);
  focusButtons.set("overview", overviewButton);

  for (const entry of BODY_CATALOG) {
    const button = createFocusButton(entry.label, entry.accentColor);
    focusGrid.append(button);
    focusButtons.set(entry.id, button);
  }

  const speedHeading = document.createElement("div");
  speedHeading.className = "section-heading";
  speedHeading.textContent = "Time scale";
  panel.append(speedHeading);

  const sliderBlock = document.createElement("label");
  sliderBlock.className = "slider-block";
  sliderBlock.innerHTML = `
    <span class="slider-label">
      <span>Simulation speed</span>
      <output>1x</output>
    </span>
  `;
  const speedOutput = sliderBlock.querySelector("output")!;
  const speedSlider = document.createElement("input");
  speedSlider.type = "range";
  speedSlider.min = "0";
  speedSlider.max = "8";
  speedSlider.step = "0.01";
  speedSlider.value = "0";
  sliderBlock.append(speedSlider);
  const speedHint = document.createElement("div");
  speedHint.className = "speed-hint";
  sliderBlock.append(speedHint);
  panel.append(sliderBlock);

  const buttonRow = document.createElement("div");
  buttonRow.className = "control-row";
  const pauseButton = createActionButton("Pause");
  const realTimeButton = createActionButton("Real time");
  const resetButton = createActionButton("Reset");
  const debugButton = createActionButton("Debug");
  debugButton.setAttribute("aria-pressed", "false");
  buttonRow.append(pauseButton, realTimeButton, resetButton, debugButton);
  panel.append(buttonRow);

  let debugEnabled = false;
  let focusMode: FocusMode = "saturn";

  for (const [mode, button] of focusButtons) {
    button.addEventListener("click", () => {
      focusMode = mode;
      options.onFocusModeChanged(mode);
      update();
    });
  }

  pauseButton.addEventListener("click", () => {
    timeController.togglePaused();
    update();
  });

  realTimeButton.addEventListener("click", () => {
    timeController.setRealTime();
    speedSlider.value = "0";
    update();
  });

  resetButton.addEventListener("click", () => {
    timeController.reset();
    options.onReset();
    update();
  });

  debugButton.addEventListener("click", () => {
    debugEnabled = !debugEnabled;
    debugButton.setAttribute("aria-pressed", String(debugEnabled));
    options.onDebugChanged(debugEnabled);
    update();
  });

  speedSlider.addEventListener("input", () => {
    const speed = Math.pow(10, Number(speedSlider.value));
    timeController.setSpeedMultiplier(speed);
    update();
  });

  function update(): void {
    pauseButton.textContent = timeController.isPaused() ? "Resume" : "Pause";
    const multiplier = timeController.getSpeedMultiplier();
    speedOutput.textContent = formatMultiplier(multiplier);
    speedHint.textContent = `1 s real time = ${formatSimulatedSpan(multiplier)}`;

    dateLine.textContent = formatSimulatedDate(
      timeController.getSimulatedDate()
    );
    const mode = timeController.isPaused()
      ? "Paused"
      : multiplier === 1
        ? "Real-time"
        : "Accelerated";
    statusLine.textContent = mode;
    statusLine.dataset.state = mode.toLowerCase();

    for (const [buttonMode, button] of focusButtons) {
      button.setAttribute("aria-pressed", String(buttonMode === focusMode));
    }
  }

  update();

  return {
    element: panel,
    update,
    getFocusMode: () => focusMode,
    setFocusMode: (mode) => {
      focusMode = mode;
      update();
    }
  };
}

function createFocusButton(
  label: string,
  accentColor: string
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "focus-button";
  button.setAttribute("aria-pressed", "false");
  button.style.setProperty("--accent", accentColor);

  const dot = document.createElement("span");
  dot.className = "focus-dot";
  const text = document.createElement("span");
  text.textContent = label;
  button.append(dot, text);
  return button;
}

function createActionButton(label: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "control-button";
  button.textContent = label;
  return button;
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

function formatSimulatedDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = MONTH_NAMES[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${day} ${month} ${year} ${hours}:${minutes}:${seconds} UTC`;
}

function formatSimulatedSpan(multiplier: number): string {
  const seconds = multiplier;

  if (seconds < 60) {
    return `${seconds.toFixed(seconds === 1 ? 0 : 1)} s`;
  }

  if (seconds < 3_600) {
    return `${(seconds / 60).toFixed(1)} min`;
  }

  if (seconds < 86_400) {
    return `${(seconds / 3_600).toFixed(1)} h`;
  }

  if (seconds < 31_557_600) {
    return `${(seconds / 86_400).toFixed(1)} d`;
  }

  return `${(seconds / 31_557_600).toFixed(2)} y`;
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
