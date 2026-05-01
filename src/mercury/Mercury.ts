import {
  ArrowHelper,
  BufferGeometry,
  Group,
  LineBasicMaterial,
  LineLoop,
  Quaternion,
  Vector3
} from "three";
import { createMercuryMesh } from "./createMercuryMesh";
import {
  MERCURY_AXIAL_TILT_RAD,
  MERCURY_ORBIT,
  MERCURY_ORBITAL_ELEMENTS,
  MERCURY_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND
} from "./mercuryConstants";
import { calculateOrbitalState, sampleOrbitPath, type OrbitalState } from "../physics/orbitalMechanics";
import { auToSceneDistance, SECONDS_PER_DAY } from "../physics/units";
import { TAU } from "../utils/math";

export interface MercuryUpdateState {
  orbitalState: OrbitalState;
  positionScene: Vector3;
  axisWorld: Vector3;
  sunDirectionWorld: Vector3;
  rotationAngleRad: number;
}

export class Mercury {
  readonly group = new Group();
  readonly orbitPath = createOrbitPath();
  readonly axisHelper = new ArrowHelper(
    new Vector3(0, 1, 0),
    new Vector3(),
    0.48,
    0xd8c09a,
    0.075,
    0.038
  );

  private readonly axialTiltGroup = new Group();
  private readonly mercuryMesh = createMercuryMesh();
  private readonly tempQuaternion = new Quaternion();
  private lastState: MercuryUpdateState | undefined;

  constructor() {
    this.group.name = "Mercury orbital body";
    this.axialTiltGroup.name = "Mercury axial tilt group";
    this.axialTiltGroup.rotation.z = MERCURY_AXIAL_TILT_RAD;
    this.axialTiltGroup.add(this.mercuryMesh.mesh);
    this.group.add(this.axialTiltGroup);

    this.orbitPath.visible = false;
    this.axisHelper.visible = false;
  }

  update(elapsedSimulationSeconds: number): MercuryUpdateState {
    const orbitalState = calculateOrbitalState(
      MERCURY_ORBITAL_ELEMENTS,
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
        MERCURY_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND) %
      TAU;
    this.mercuryMesh.mesh.rotation.y = rotationAngleRad;

    const axisWorld = new Vector3(0, 1, 0)
      .applyQuaternion(this.axialTiltGroup.getWorldQuaternion(this.tempQuaternion))
      .normalize();
    const sunDirectionWorld = new Vector3()
      .subVectors(new Vector3(0, 0, 0), positionScene)
      .normalize();

    this.updateShaderUniforms(
      elapsedSimulationSeconds,
      orbitalState,
      positionScene,
      axisWorld,
      sunDirectionWorld
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

  getLastState(): MercuryUpdateState | undefined {
    return this.lastState;
  }

  setDebugVisible(visible: boolean): void {
    this.orbitPath.visible = visible;
    this.axisHelper.visible = visible;
  }

  private updateShaderUniforms(
    elapsedSimulationSeconds: number,
    orbitalState: OrbitalState,
    positionScene: Vector3,
    axisWorld: Vector3,
    sunDirectionWorld: Vector3
  ): void {
    const shaderTimeDays = elapsedSimulationSeconds / SECONDS_PER_DAY;
    const solarIntensity =
      (MERCURY_ORBIT.semiMajorAxisAU / orbitalState.radiusAU) ** 2;
    const uniforms = this.mercuryMesh.material.uniforms;
    uniforms.uTime.value = shaderTimeDays;
    uniforms.uSolarIntensity.value = solarIntensity;
    uniforms.uSunDirectionWorld.value.copy(sunDirectionWorld);
    uniforms.uAxisWorld.value.copy(axisWorld);
    uniforms.uPlanetCenterWorld.value.copy(positionScene);
  }
}

function createOrbitPath(): LineLoop {
  const points = sampleOrbitPath(MERCURY_ORBITAL_ELEMENTS, 900).map(
    (point) =>
      new Vector3(
        auToSceneDistance(point.x),
        auToSceneDistance(point.y),
        auToSceneDistance(point.z)
      )
  );

  const geometry = new BufferGeometry().setFromPoints(points);
  const material = new LineBasicMaterial({
    color: 0xb6a07b,
    transparent: true,
    opacity: 0.42
  });

  const line = new LineLoop(geometry, material);
  line.name = "Mercury eccentric Keplerian orbital path";
  return line;
}
