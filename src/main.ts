import "./style.css";
import { Clock, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createCamera } from "./scene/createCamera";
import { createComposer } from "./scene/createComposer";
import { createLights } from "./scene/createLights";
import { createRenderer } from "./scene/createRenderer";
import { createScene } from "./scene/createScene";
import { createStarfield } from "./scene/createStarfield";
import { createSun } from "./scene/createSun";
import { Earth } from "./earth/Earth";
import { EARTH_PHYSICAL } from "./earth/earthConstants";
import { Jupiter } from "./jupiter/Jupiter";
import { JUPITER_PHYSICAL } from "./jupiter/jupiterConstants";
import { Mars } from "./mars/Mars";
import { MARS_PHYSICAL } from "./mars/marsConstants";
import { Mercury } from "./mercury/Mercury";
import { MERCURY_PHYSICAL } from "./mercury/mercuryConstants";
import { Neptune } from "./neptune/Neptune";
import { NEPTUNE_PHYSICAL } from "./neptune/neptuneConstants";
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
import { SECONDS_PER_DAY } from "./physics/units";
import { easeInOutCubic } from "./utils/math";
import { createBodyLabels } from "./ui/bodyLabels";
import {
  createSimulationControls,
  type FocusMode
} from "./ui/controls";
import { createDebugPanel } from "./ui/debugPanel";
import { createInfoPanel } from "./ui/infoPanel";

const canvas = document.querySelector<HTMLCanvasElement>("#scene");
const uiRoot = document.querySelector<HTMLDivElement>("#ui-root");

if (!canvas || !uiRoot) {
  throw new Error("Required DOM roots are missing.");
}

const scene = createScene();
const camera = createCamera();
const renderer = createRenderer(canvas);
const { composer, setSize: setComposerSize } = createComposer(
  renderer,
  scene,
  camera
);
const lights = createLights();
const stars = createStarfield();
const sun = createSun();
const saturn = new Saturn();
const uranus = new Uranus();
const neptune = new Neptune();
const jupiter = new Jupiter();
const mars = new Mars();
const earth = new Earth();
const venus = new Venus();
const mercury = new Mercury();
const timeController = new TimeController(SIMULATION_EPOCH);
const clock = new Clock();

scene.add(
  lights.group,
  stars.group,
  sun.group,
  saturn.group,
  saturn.orbitPath,
  saturn.axisHelper,
  uranus.group,
  uranus.orbitPath,
  uranus.axisHelper,
  neptune.group,
  neptune.orbitPath,
  neptune.axisHelper,
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

// Compile every shader up front so no material stalls mid-flight the first
// time a body (notably the Sun) enters the camera frustum.
renderer.compile(scene, camera);

let saturnState = saturn.update(0);
let uranusState = uranus.update(0);
let neptuneState = neptune.update(0);
let jupiterState = jupiter.update(0);
let marsState = mars.update(0);
let earthState = earth.update(0);
let venusState = venus.update(0);
let mercuryState = mercury.update(0);
// Start on the whole-system overview: camera high above the ecliptic
// looking down at the Sun-centered origin.
const OVERVIEW_TARGET = new Vector3(0, 0, 0);
const OVERVIEW_OFFSET = new Vector3(0, 92, 245);
camera.position.copy(OVERVIEW_TARGET).add(OVERVIEW_OFFSET);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.055;
orbitControls.minDistance = 0.22;
orbitControls.maxDistance = 420;
orbitControls.target.copy(OVERVIEW_TARGET);

let debugEnabled = false;
let focusMode: FocusMode = "overview";
let lastCameraTarget = OVERVIEW_TARGET.clone();

const FOCUS_TRANSITION_SECONDS = 1.6;
let transitionElapsed = Number.POSITIVE_INFINITY;
const transitionFromTarget = new Vector3();
const transitionFromOffset = new Vector3();

const debugPanel = createDebugPanel();
const infoPanel = createInfoPanel();
const simulationControls = createSimulationControls(timeController, {
  onDebugChanged: (enabled) => {
    debugEnabled = enabled;
    saturn.setDebugVisible(enabled);
    uranus.setDebugVisible(enabled);
    neptune.setDebugVisible(enabled);
    jupiter.setDebugVisible(enabled);
    mars.setDebugVisible(enabled);
    earth.setDebugVisible(enabled);
    venus.setDebugVisible(enabled);
    mercury.setDebugVisible(enabled);
    debugPanel.setVisible(enabled);
  },
  onFocusModeChanged: (mode) => {
    focusMode = mode;
    beginFocusTransition();
  },
  onReset: () => {
    saturnState = saturn.update(0);
    uranusState = uranus.update(0);
    neptuneState = neptune.update(0);
    jupiterState = jupiter.update(0);
    marsState = mars.update(0);
    earthState = earth.update(0);
    venusState = venus.update(0);
    mercuryState = mercury.update(0);
    beginFocusTransition();
  }
});

const bodyLabels = createBodyLabels(
  [
    { id: "sun", getPosition: () => new Vector3() },
    { id: "mercury", getPosition: () => mercuryState.positionScene },
    { id: "venus", getPosition: () => venusState.positionScene },
    { id: "earth", getPosition: () => earthState.positionScene },
    { id: "mars", getPosition: () => marsState.positionScene },
    { id: "jupiter", getPosition: () => jupiterState.positionScene },
    { id: "saturn", getPosition: () => saturnState.positionScene },
    { id: "uranus", getPosition: () => uranusState.positionScene },
    { id: "neptune", getPosition: () => neptuneState.positionScene }
  ],
  (id) => {
    focusMode = id;
    simulationControls.setFocusMode(id);
    beginFocusTransition();
    syncInfoPanel();
  }
);

uiRoot.append(
  bodyLabels.element,
  simulationControls.element,
  infoPanel.element,
  debugPanel.element
);
syncInfoPanel();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  setComposerSize(window.innerWidth, window.innerHeight, pixelRatio);
});

renderer.setAnimationLoop(() => {
  const deltaSeconds = Math.min(clock.getDelta(), 0.1);
  timeController.update(deltaSeconds);
  const elapsed = timeController.getElapsedSeconds();
  saturnState = saturn.update(elapsed);
  uranusState = uranus.update(elapsed);
  neptuneState = neptune.update(elapsed);
  jupiterState = jupiter.update(elapsed);
  marsState = mars.update(elapsed);
  earthState = earth.update(elapsed);
  venusState = venus.update(elapsed);
  mercuryState = mercury.update(elapsed);

  sun.update(elapsed / SECONDS_PER_DAY);
  stars.update(clock.getElapsedTime());

  updateCameraFollow(deltaSeconds);

  orbitControls.update();
  simulationControls.update();
  bodyLabels.update(camera, focusMode === "overview" ? undefined : focusMode);

  if (debugEnabled) {
    debugPanel.update(getDebugBodyState(), timeController);
  }

  composer.render();
});

function beginFocusTransition(): void {
  transitionElapsed = 0;
  transitionFromTarget.copy(orbitControls.target);
  transitionFromOffset.copy(camera.position).sub(orbitControls.target);
  syncInfoPanel();
}

function updateCameraFollow(deltaSeconds: number): void {
  const liveTarget = getFocusTarget();

  if (transitionElapsed < FOCUS_TRANSITION_SECONDS) {
    transitionElapsed += deltaSeconds;
    const progress = Math.min(
      transitionElapsed / FOCUS_TRANSITION_SECONDS,
      1
    );
    const eased = easeInOutCubic(progress);
    const blendedTarget = new Vector3().lerpVectors(
      transitionFromTarget,
      liveTarget,
      eased
    );
    const blendedOffset = new Vector3().lerpVectors(
      transitionFromOffset,
      getViewOffset(),
      eased
    );
    camera.position.copy(blendedTarget).add(blendedOffset);
    orbitControls.target.copy(blendedTarget);
    lastCameraTarget.copy(blendedTarget);
    return;
  }

  const targetDelta = liveTarget.clone().sub(lastCameraTarget);
  camera.position.add(targetDelta);
  orbitControls.target.copy(liveTarget);
  lastCameraTarget.copy(liveTarget);
}

function syncInfoPanel(): void {
  infoPanel.setBody(focusMode === "overview" ? undefined : focusMode);
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

  if (focusMode === "neptune") {
    return neptuneState.positionScene;
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

  if (focusMode === "neptune") {
    return new Vector3(0, 2.7, 8.0);
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

  if (focusMode === "sun") {
    return new Vector3(0, 5.5, 16.5);
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

  if (focusMode === "neptune") {
    return {
      name: "Neptune",
      updateState: neptuneState,
      rotationPeriodHours: NEPTUNE_PHYSICAL.rotationPeriodHours,
      visualizationMode: "Muted methane-blue atmosphere"
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
