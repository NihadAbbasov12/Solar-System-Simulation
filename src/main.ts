import "./style.css";
import { Clock, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createCamera } from "./scene/createCamera";
import { createLights } from "./scene/createLights";
import { createRenderer } from "./scene/createRenderer";
import { createScene } from "./scene/createScene";
import { createStarfield } from "./scene/createStarfield";
import { Saturn } from "./saturn/Saturn";
import { SIMULATION_EPOCH } from "./saturn/saturnConstants";
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
const timeController = new TimeController(SIMULATION_EPOCH);
const clock = new Clock();

scene.add(lights.group, stars, saturn.group, saturn.orbitPath, saturn.axisHelper);

const initialState = saturn.update(0);
camera.position.copy(initialState.positionScene).add(new Vector3(0, 3.2, 9.2));

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.055;
orbitControls.minDistance = 2.6;
orbitControls.maxDistance = 420;
orbitControls.target.copy(initialState.positionScene);

let debugEnabled = false;
let focusMode: FocusMode = "saturn";
let lastCameraTarget = initialState.positionScene.clone();

const debugPanel = createDebugPanel();
const simulationControls = createSimulationControls(timeController, {
  onDebugChanged: (enabled) => {
    debugEnabled = enabled;
    saturn.setDebugVisible(enabled);
    debugPanel.setVisible(enabled);
  },
  onFocusModeChanged: (mode) => {
    focusMode = mode;
    const target = mode === "saturn" ? saturn.group.position : new Vector3();
    moveCameraTarget(target, true);
  },
  onReset: () => {
    const state = saturn.update(0);
    if (focusMode === "saturn") {
      moveCameraTarget(state.positionScene, true);
    }
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
  const state = saturn.update(timeController.getElapsedSeconds());

  if (focusMode === "saturn") {
    moveCameraTarget(state.positionScene, false);
  } else {
    moveCameraTarget(new Vector3(), false);
  }

  orbitControls.update();
  simulationControls.update();

  if (debugEnabled) {
    debugPanel.update(state, timeController);
  }

  renderer.render(scene, camera);
});

function moveCameraTarget(target: Vector3, jumpView: boolean): void {
  const targetDelta = target.clone().sub(lastCameraTarget);

  if (jumpView) {
    const viewOffset =
      focusMode === "saturn"
        ? new Vector3(0, 3.2, 9.2)
        : new Vector3(0, 92, 245);
    camera.position.copy(target).add(viewOffset);
  } else {
    camera.position.add(targetDelta);
  }

  orbitControls.target.copy(target);
  lastCameraTarget.copy(target);
}
