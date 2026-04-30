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
import { Saturn } from "./saturn/Saturn";
import {
  SATURN_PHYSICAL,
  SIMULATION_EPOCH
} from "./saturn/saturnConstants";
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
const jupiter = new Jupiter();
const earth = new Earth();
const timeController = new TimeController(SIMULATION_EPOCH);
const clock = new Clock();

scene.add(
  lights.group,
  stars,
  saturn.group,
  saturn.orbitPath,
  saturn.axisHelper,
  jupiter.group,
  jupiter.orbitPath,
  jupiter.axisHelper,
  earth.group,
  earth.orbitPath,
  earth.axisHelper
);

let saturnState = saturn.update(0);
let jupiterState = jupiter.update(0);
let earthState = earth.update(0);
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
    jupiter.setDebugVisible(enabled);
    earth.setDebugVisible(enabled);
    debugPanel.setVisible(enabled);
  },
  onFocusModeChanged: (mode) => {
    focusMode = mode;
    moveCameraTarget(getFocusTarget(), true);
  },
  onReset: () => {
    saturnState = saturn.update(0);
    jupiterState = jupiter.update(0);
    earthState = earth.update(0);
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
  jupiterState = jupiter.update(timeController.getElapsedSeconds());
  earthState = earth.update(timeController.getElapsedSeconds());

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

  if (focusMode === "jupiter") {
    return jupiterState.positionScene;
  }

  return new Vector3();
}

function getViewOffset(): Vector3 {
  if (focusMode === "saturn") {
    return new Vector3(0, 3.2, 9.2);
  }

  if (focusMode === "earth") {
    return new Vector3(0, 1.05, 2.85);
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

  return {
    name: "Saturn",
    updateState: saturnState,
    rotationPeriodHours: SATURN_PHYSICAL.rotationPeriodHours
  };
}
