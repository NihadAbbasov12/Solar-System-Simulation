import type { TimeController } from "../physics/timeController";

export type FocusMode = "saturn" | "jupiter" | "mars" | "earth" | "sun";

export interface SimulationControlsOptions {
  onDebugChanged: (enabled: boolean) => void;
  onFocusModeChanged: (mode: FocusMode) => void;
  onReset: () => void;
}

export interface SimulationControls {
  element: HTMLElement;
  update: () => void;
  getFocusMode: () => FocusMode;
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

  const buttonRow = document.createElement("div");
  buttonRow.className = "control-row";

  const pauseButton = createButton("Pause");
  const realTimeButton = createButton("Real Time");
  const resetButton = createButton("Reset");
  const focusButton = createButton("Focus Jupiter");
  const debugButton = createButton("Debug");
  debugButton.setAttribute("aria-pressed", "false");

  buttonRow.append(
    pauseButton,
    realTimeButton,
    resetButton,
    focusButton,
    debugButton
  );
  panel.append(buttonRow);

  const sliderBlock = document.createElement("label");
  sliderBlock.className = "slider-block";
  sliderBlock.innerHTML = `
    <span class="slider-label">
      <span>Simulation speed</span>
      <output>1x</output>
    </span>
  `;
  const speedOutput = sliderBlock.querySelector("output");
  const speedSlider = document.createElement("input");
  speedSlider.type = "range";
  speedSlider.min = "0";
  speedSlider.max = "8";
  speedSlider.step = "0.01";
  speedSlider.value = "0";
  sliderBlock.append(speedSlider);
  panel.append(sliderBlock);

  const modeLine = document.createElement("div");
  modeLine.className = "mode-line";
  panel.append(modeLine);

  let debugEnabled = false;
  let focusMode: FocusMode = "saturn";

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

  focusButton.addEventListener("click", () => {
    focusMode = getNextFocusMode(focusMode);
    focusButton.textContent = `Focus ${getNextFocusLabel(focusMode)}`;
    options.onFocusModeChanged(focusMode);
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

    if (speedOutput) {
      speedOutput.textContent = formatMultiplier(multiplier);
    }

    const mode = timeController.isPaused()
      ? "Paused"
      : multiplier === 1
        ? "Real-time"
        : "Accelerated";
    modeLine.textContent = `${mode} | Camera target: ${getFocusLabel(focusMode)}`;
  }

  update();

  return {
    element: panel,
    update,
    getFocusMode: () => focusMode
  };
}

function getNextFocusMode(mode: FocusMode): FocusMode {
  if (mode === "saturn") {
    return "jupiter";
  }

  if (mode === "jupiter") {
    return "mars";
  }

  if (mode === "mars") {
    return "earth";
  }

  if (mode === "earth") {
    return "sun";
  }

  return "saturn";
}

function getFocusLabel(mode: FocusMode): string {
  if (mode === "saturn") {
    return "Saturn";
  }

  if (mode === "jupiter") {
    return "Jupiter";
  }

  if (mode === "mars") {
    return "Mars";
  }

  if (mode === "earth") {
    return "Earth";
  }

  return "Sun";
}

function getNextFocusLabel(mode: FocusMode): string {
  return getFocusLabel(getNextFocusMode(mode));
}

function createButton(label: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "control-button";
  button.textContent = label;
  return button;
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
