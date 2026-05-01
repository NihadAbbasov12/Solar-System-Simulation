import {
  ArrowHelper,
  BufferGeometry,
  Group,
  LineBasicMaterial,
  LineLoop,
  Quaternion,
  Vector3
} from "three";
import { createMarsMesh } from "./createMarsMesh";
import { createMartianMoons, type MartianMoonsResult } from "./createMartianMoons";
import {
  MARS_AXIAL_TILT_RAD,
  MARS_ORBITAL_ELEMENTS,
  MARS_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND
} from "./marsConstants";
import { calculateOrbitalState, sampleOrbitPath, type OrbitalState } from "../physics/orbitalMechanics";
import { auToSceneDistance, SECONDS_PER_DAY } from "../physics/units";
import { TAU } from "../utils/math";

export interface MarsUpdateState {
  orbitalState: OrbitalState;
  positionScene: Vector3;
  axisWorld: Vector3;
  sunDirectionWorld: Vector3;
  rotationAngleRad: number;
}

export class Mars {
  readonly group = new Group();
  readonly orbitPath = createOrbitPath();
  readonly axisHelper = new ArrowHelper(
    new Vector3(0, 1, 0),
    new Vector3(),
    0.85,
    0xff9a5b,
    0.14,
    0.07
  );

  private readonly axialTiltGroup = new Group();
  private readonly marsMesh = createMarsMesh();
  private readonly moons: MartianMoonsResult = createMartianMoons();
  private readonly tempQuaternion = new Quaternion();
  private lastState: MarsUpdateState | undefined;

  constructor() {
    this.group.name = "Mars orbital body";
    this.axialTiltGroup.name = "Mars axial tilt group";
    this.axialTiltGroup.rotation.z = MARS_AXIAL_TILT_RAD;
    this.axialTiltGroup.add(this.marsMesh.mesh);
    this.axialTiltGroup.add(this.moons.group);
    this.group.add(this.axialTiltGroup);

    this.orbitPath.visible = false;
    this.axisHelper.visible = false;
    this.moons.setDebugVisible(false);
  }

  update(elapsedSimulationSeconds: number): MarsUpdateState {
    const orbitalState = calculateOrbitalState(
      MARS_ORBITAL_ELEMENTS,
      elapsedSimulationSeconds
    );
    const positionScene = new Vector3(
      auToSceneDistance(orbitalState.positionAU.x),
      auToSceneDistance(orbitalState.positionAU.y),
      auToSceneDistance(orbitalState.positionAU.z)
    );
    this.group.position.copy(positionScene);

    const rotationAngleRad =
      (elapsedSimulationSeconds *
        MARS_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND) %
      TAU;
    this.marsMesh.mesh.rotation.y = rotationAngleRad;
    this.moons.update(elapsedSimulationSeconds);

    const axisWorld = new Vector3(0, 1, 0)
      .applyQuaternion(this.axialTiltGroup.getWorldQuaternion(this.tempQuaternion))
      .normalize();
    const sunDirectionWorld = new Vector3()
      .subVectors(new Vector3(0, 0, 0), positionScene)
      .normalize();

    this.updateShaderUniforms(
      elapsedSimulationSeconds,
      axisWorld,
      sunDirectionWorld,
      positionScene
    );

    this.axisHelper.position.copy(positionScene);
    this.axisHelper.setDirection(axisWorld);

    this.lastState = {
      orbitalState,
      positionScene,
      axisWorld,
      sunDirectionWorld,
      rotationAngleRad
    };

    return this.lastState;
  }

  getLastState(): MarsUpdateState | undefined {
    return this.lastState;
  }

  setDebugVisible(visible: boolean): void {
    this.orbitPath.visible = visible;
    this.axisHelper.visible = visible;
    this.moons.setDebugVisible(visible);
  }

  private updateShaderUniforms(
    elapsedSimulationSeconds: number,
    axisWorld: Vector3,
    sunDirectionWorld: Vector3,
    positionScene: Vector3
  ): void {
    const shaderTimeDays = elapsedSimulationSeconds / SECONDS_PER_DAY;
    const uniforms = this.marsMesh.material.uniforms;
    uniforms.uTime.value = shaderTimeDays;
    uniforms.uSunDirectionWorld.value.copy(sunDirectionWorld);
    uniforms.uAxisWorld.value.copy(axisWorld);
    uniforms.uPlanetCenterWorld.value.copy(positionScene);
  }
}

function createOrbitPath(): LineLoop {
  const points = sampleOrbitPath(MARS_ORBITAL_ELEMENTS, 900).map(
    (point) =>
      new Vector3(
        auToSceneDistance(point.x),
        auToSceneDistance(point.y),
        auToSceneDistance(point.z)
      )
  );

  const geometry = new BufferGeometry().setFromPoints(points);
  const material = new LineBasicMaterial({
    color: 0xd06a3a,
    transparent: true,
    opacity: 0.34
  });

  const line = new LineLoop(geometry, material);
  line.name = "Mars Keplerian orbital path";
  return line;
}
