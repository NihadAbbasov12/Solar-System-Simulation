import "./style.css";
import { Clock, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createCamera } from "./scene/createCamera";
import { createLights } from "./scene/createLights";
import { createRenderer } from "./scene/createRenderer";
import { createScene } from "./scene/createScene";
import { createStarfield } from "./scene/createStarfield";
import { Earth } from "./earth/Earth";
import { EARTH_PHYSICAL } from "./earth/earthConstants";
import { Jupiter } from "./jupiter/Jupiter";
import { JUPITER_PHYSICAL } from "./jupiter/jupiterConstants";
import { Mars } from "./mars/Mars";
import { MARS_PHYSICAL } from "./mars/marsConstants";
import { Mercury } from "./mercury/Mercury";
import { MERCURY_PHYSICAL } from "./mercury/mercuryConstants";
import { Saturn } from "./saturn/Saturn";
import {
  SATURN_PHYSICAL,
  SIMULATION_EPOCH
} from "./saturn/saturnConstants";
import { Uranus } from "./uranus/Uranus";
import { URANUS_PHYSICAL } from "./uranus/uranusConstants";
import { Venus } from "./venus/Venus";
import { VENUS_PHYSICAL } from "./venus/venusConstants";
import { TimeController } from "./physics/timeController";
import {
  createSimulationControls,
  type FocusMode
} from "./ui/controls";
import { createDebugPanel } from "./ui/debugPanel";

const canvas = document.querySelector<HTMLCanvasElement>("#scene");
const uiRoot = document.querySelector<HTMLDivElement>("#ui-root");

if (!canvas || !uiRoot) {
  throw new Error("Required DOM roots are missing.");
}

const scene = createScene();
const camera = createCamera();
const renderer = createRenderer(canvas);
const lights = createLights();
const stars = createStarfield();
const saturn = new Saturn();
const uranus = new Uranus();
const jupiter = new Jupiter();
const mars = new Mars();
const earth = new Earth();
const venus = new Venus();
const mercury = new Mercury();
const timeController = new TimeController(SIMULATION_EPOCH);
const clock = new Clock();

scene.add(
  lights.group,
  stars,
  saturn.group,
  saturn.orbitPath,
  saturn.axisHelper,
  uranus.group,
  uranus.orbitPath,
  uranus.axisHelper,
  jupiter.group,
  jupiter.orbitPath,
  jupiter.axisHelper,
  mars.group,
  mars.orbitPath,
  mars.axisHelper,
  earth.group,
  earth.orbitPath,
  earth.axisHelper,
  venus.group,
  venus.orbitPath,
  venus.axisHelper,
  mercury.group,
  mercury.orbitPath,
  mercury.axisHelper
);

let saturnState = saturn.update(0);
let uranusState = uranus.update(0);
let jupiterState = jupiter.update(0);
let marsState = mars.update(0);
let earthState = earth.update(0);
let venusState = venus.update(0);
let mercuryState = mercury.update(0);
camera.position.copy(saturnState.positionScene).add(new Vector3(0, 3.2, 9.2));

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.055;
orbitControls.minDistance = 0.22;
orbitControls.maxDistance = 420;
orbitControls.target.copy(saturnState.positionScene);

let debugEnabled = false;
let focusMode: FocusMode = "saturn";
let lastCameraTarget = saturnState.positionScene.clone();

const debugPanel = createDebugPanel();
const simulationControls = createSimulationControls(timeController, {
  onDebugChanged: (enabled) => {
    debugEnabled = enabled;
    saturn.setDebugVisible(enabled);
    uranus.setDebugVisible(enabled);
    jupiter.setDebugVisible(enabled);
    mars.setDebugVisible(enabled);
    earth.setDebugVisible(enabled);
    venus.setDebugVisible(enabled);
    mercury.setDebugVisible(enabled);
    debugPanel.setVisible(enabled);
  },
  onFocusModeChanged: (mode) => {
    focusMode = mode;
    moveCameraTarget(getFocusTarget(), true);
  },
  onReset: () => {
    saturnState = saturn.update(0);
    uranusState = uranus.update(0);
    jupiterState = jupiter.update(0);
    marsState = mars.update(0);
    earthState = earth.update(0);
    venusState = venus.update(0);
    mercuryState = mercury.update(0);
    moveCameraTarget(getFocusTarget(), true);
  }
});

uiRoot.append(simulationControls.element, debugPanel.element);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setAnimationLoop(() => {
  const deltaSeconds = Math.min(clock.getDelta(), 0.1);
  timeController.update(deltaSeconds);
  saturnState = saturn.update(timeController.getElapsedSeconds());
  uranusState = uranus.update(timeController.getElapsedSeconds());
  jupiterState = jupiter.update(timeController.getElapsedSeconds());
  marsState = mars.update(timeController.getElapsedSeconds());
  earthState = earth.update(timeController.getElapsedSeconds());
  venusState = venus.update(timeController.getElapsedSeconds());
  mercuryState = mercury.update(timeController.getElapsedSeconds());

  moveCameraTarget(getFocusTarget(), false);

  orbitControls.update();
  simulationControls.update();

  if (debugEnabled) {
    debugPanel.update(getDebugBodyState(), timeController);
  }

  renderer.render(scene, camera);
});

function moveCameraTarget(target: Vector3, jumpView: boolean): void {
  const targetDelta = target.clone().sub(lastCameraTarget);

  if (jumpView) {
    camera.position.copy(target).add(getViewOffset());
  } else {
    camera.position.add(targetDelta);
  }

  orbitControls.target.copy(target);
  lastCameraTarget.copy(target);
}

function getFocusTarget(): Vector3 {
  if (focusMode === "saturn") {
    return saturnState.positionScene;
  }

  if (focusMode === "earth") {
    return earthState.positionScene;
  }

  if (focusMode === "venus") {
    return venusState.positionScene;
  }

  if (focusMode === "mercury") {
    return mercuryState.positionScene;
  }

  if (focusMode === "mars") {
    return marsState.positionScene;
  }

  if (focusMode === "uranus") {
    return uranusState.positionScene;
  }

  if (focusMode === "jupiter") {
    return jupiterState.positionScene;
  }

  return new Vector3();
}

function getViewOffset(): Vector3 {
  if (focusMode === "saturn") {
    return new Vector3(0, 3.2, 9.2);
  }

  if (focusMode === "uranus") {
    return new Vector3(0, 2.8, 8.2);
  }

  if (focusMode === "earth") {
    return new Vector3(0, 1.05, 2.85);
  }

  if (focusMode === "venus") {
    return new Vector3(0, 0.98, 2.65);
  }

  if (focusMode === "mercury") {
    return new Vector3(0, 0.52, 1.42);
  }

  if (focusMode === "mars") {
    return new Vector3(0, 0.78, 2.08);
  }

  if (focusMode === "jupiter") {
    return new Vector3(0, 4.2, 12.6);
  }

  return new Vector3(0, 92, 245);
}

function getDebugBodyState() {
  if (focusMode === "earth") {
    return {
      name: "Earth",
      updateState: earthState,
      rotationPeriodHours: EARTH_PHYSICAL.rotationPeriodHours
    };
  }

  if (focusMode === "jupiter") {
    return {
      name: "Jupiter",
      updateState: jupiterState,
      rotationPeriodHours: JUPITER_PHYSICAL.rotationPeriodHours
    };
  }

  if (focusMode === "uranus") {
    return {
      name: "Uranus",
      updateState: uranusState,
      rotationPeriodHours: Math.abs(URANUS_PHYSICAL.rotationPeriodHours),
      rotationSense: "retrograde" as const,
      visualizationMode: "Visible methane haze"
    };
  }

  if (focusMode === "mercury") {
    return {
      name: "Mercury",
      updateState: mercuryState,
      rotationPeriodHours: MERCURY_PHYSICAL.siderealRotationDays * 24,
      visualizationMode: "Visible light"
    };
  }

  if (focusMode === "venus") {
    return {
      name: "Venus",
      updateState: venusState,
      rotationPeriodHours: VENUS_PHYSICAL.siderealRotationDays * 24,
      rotationSense: "retrograde" as const,
      visualizationMode: debugEnabled
        ? "Radar topography (false color)"
        : "Visible sulfuric-acid clouds"
    };
  }

  if (focusMode === "mars") {
    return {
      name: "Mars",
      updateState: marsState,
      rotationPeriodHours: MARS_PHYSICAL.rotationPeriodHours
    };
  }

  return {
    name: "Saturn",
    updateState: saturnState,
    rotationPeriodHours: SATURN_PHYSICAL.rotationPeriodHours
  };
}
