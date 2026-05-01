import {
  ArrowHelper,
  BufferGeometry,
  Group,
  LineBasicMaterial,
  LineLoop,
  Quaternion,
  Vector3
} from "three";
import { createVenusMesh } from "./createVenusMesh";
import {
  VENUS_AXIAL_TILT_RAD,
  VENUS_CLOUD_SUPER_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND,
  VENUS_ORBITAL_ELEMENTS,
  VENUS_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND
} from "./venusConstants";
import { calculateOrbitalState, sampleOrbitPath, type OrbitalState } from "../physics/orbitalMechanics";
import { auToSceneDistance, SECONDS_PER_DAY } from "../physics/units";
import { TAU } from "../utils/math";

export interface VenusUpdateState {
  orbitalState: OrbitalState;
  positionScene: Vector3;
  axisWorld: Vector3;
  sunDirectionWorld: Vector3;
  rotationAngleRad: number;
}

export class Venus {
  readonly group = new Group();
  readonly orbitPath = createOrbitPath();
  readonly axisHelper = new ArrowHelper(
    new Vector3(0, 1, 0),
    new Vector3(),
    1.05,
    0xf3dc95,
    0.16,
    0.08
  );

  private readonly axialTiltGroup = new Group();
  private readonly venusMesh = createVenusMesh();
  private readonly tempQuaternion = new Quaternion();
  private lastState: VenusUpdateState | undefined;

  constructor() {
    this.group.name = "Venus orbital body";
    this.axialTiltGroup.name = "Venus retrograde axial tilt group";
    this.axialTiltGroup.rotation.z = VENUS_AXIAL_TILT_RAD;
    this.axialTiltGroup.add(this.venusMesh.mesh);
    this.group.add(this.axialTiltGroup);

    this.orbitPath.visible = false;
    this.axisHelper.visible = false;
  }

  update(elapsedSimulationSeconds: number): VenusUpdateState {
    const orbitalState = calculateOrbitalState(
      VENUS_ORBITAL_ELEMENTS,
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
        VENUS_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND) %
      TAU;
    this.venusMesh.mesh.rotation.y = rotationAngleRad;

    const axisWorld = new Vector3(0, 1, 0)
      .applyQuaternion(this.axialTiltGroup.getWorldQuaternion(this.tempQuaternion))
      .normalize();
    const sunDirectionWorld = new Vector3()
      .subVectors(new Vector3(0, 0, 0), positionScene)
      .normalize();

    this.updateShaderUniforms(
      elapsedSimulationSeconds,
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

  getLastState(): VenusUpdateState | undefined {
    return this.lastState;
  }

  setDebugVisible(visible: boolean): void {
    this.orbitPath.visible = visible;
    this.axisHelper.visible = visible;
    this.venusMesh.material.uniforms.uRadarBlend.value = visible ? 1 : 0;
  }

  private updateShaderUniforms(
    elapsedSimulationSeconds: number,
    sunDirectionWorld: Vector3
  ): void {
    const shaderTimeDays = elapsedSimulationSeconds / SECONDS_PER_DAY;
    const cloudLongitudeOffset =
      (elapsedSimulationSeconds *
        VENUS_CLOUD_SUPER_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND) %
      TAU;
    const uniforms = this.venusMesh.material.uniforms;
    uniforms.uTime.value = shaderTimeDays;
    uniforms.uCloudLongitudeOffset.value = cloudLongitudeOffset;
    uniforms.uSunDirectionWorld.value.copy(sunDirectionWorld);
  }
}

function createOrbitPath(): LineLoop {
  const points = sampleOrbitPath(VENUS_ORBITAL_ELEMENTS, 900).map(
    (point) =>
      new Vector3(
        auToSceneDistance(point.x),
        auToSceneDistance(point.y),
        auToSceneDistance(point.z)
      )
  );

  const geometry = new BufferGeometry().setFromPoints(points);
  const material = new LineBasicMaterial({
    color: 0xe4cc7a,
    transparent: true,
    opacity: 0.38
  });

  const line = new LineLoop(geometry, material);
  line.name = "Venus low-eccentricity Keplerian orbital path";
  return line;
}
