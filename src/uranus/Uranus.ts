import {
  ArrowHelper,
  BufferGeometry,
  Group,
  LineBasicMaterial,
  LineLoop,
  Quaternion,
  Vector3
} from "three";
import { createUranianMoons, type UranianMoonsResult } from "./createUranianMoons";
import { createUranusMesh } from "./createUranusMesh";
import {
  createUranusRings,
  type UranusRingMaterialEntry
} from "./createUranusRings";
import {
  URANUS_AXIAL_TILT_RAD,
  URANUS_DATA,
  URANUS_ORBITAL_ELEMENTS,
  URANUS_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND
} from "./uranusConstants";
import {
  calculateOrbitalState,
  sampleOrbitPath,
  type OrbitalState
} from "../physics/orbitalMechanics";
import { auToSceneDistance, SECONDS_PER_DAY } from "../physics/units";
import { TAU } from "../utils/math";

export interface UranusUpdateState {
  orbitalState: OrbitalState;
  positionScene: Vector3;
  axisWorld: Vector3;
  sunDirectionWorld: Vector3;
  rotationAngleRad: number;
}

export class Uranus {
  readonly group = new Group();
  readonly orbitPath = createOrbitPath();
  readonly axisHelper = new ArrowHelper(
    new Vector3(0, 1, 0),
    new Vector3(),
    2.45,
    0x86eef0,
    0.34,
    0.16
  );

  private readonly axialTiltGroup = new Group();
  private readonly uranusMesh = createUranusMesh();
  private readonly rings = createUranusRings();
  private readonly moons: UranianMoonsResult = createUranianMoons();
  private readonly tempQuaternion = new Quaternion();
  private lastState: UranusUpdateState | undefined;

  constructor() {
    this.group.name = "Uranus orbital body";
    this.group.userData = URANUS_DATA;
    this.axialTiltGroup.name = "Uranus 97.77 degree axial tilt group";
    this.axialTiltGroup.rotation.z = URANUS_AXIAL_TILT_RAD;
    this.axialTiltGroup.add(this.uranusMesh.mesh);
    this.axialTiltGroup.add(this.rings.group);
    this.axialTiltGroup.add(this.moons.regularGroup);
    this.group.add(this.axialTiltGroup);
    this.group.add(this.moons.irregularGroup);

    this.orbitPath.visible = false;
    this.axisHelper.visible = false;
    this.moons.setDebugVisible(false);
  }

  update(elapsedSimulationSeconds: number): UranusUpdateState {
    const orbitalState = calculateOrbitalState(
      URANUS_ORBITAL_ELEMENTS,
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
        URANUS_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND) %
      TAU;
    this.uranusMesh.mesh.rotation.y = rotationAngleRad;
    this.moons.update(elapsedSimulationSeconds);

    const axisWorld = new Vector3(0, 1, 0)
      .applyQuaternion(this.axialTiltGroup.getWorldQuaternion(this.tempQuaternion))
      .normalize();
    const sunDirectionWorld = new Vector3()
      .subVectors(new Vector3(0, 0, 0), positionScene)
      .normalize();

    this.updateShaderUniforms(
      elapsedSimulationSeconds,
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

  getLastState(): UranusUpdateState | undefined {
    return this.lastState;
  }

  setDebugVisible(visible: boolean): void {
    this.orbitPath.visible = visible;
    this.axisHelper.visible = visible;
    this.moons.setDebugVisible(visible);
  }

  private updateShaderUniforms(
    elapsedSimulationSeconds: number,
    positionScene: Vector3,
    axisWorld: Vector3,
    sunDirectionWorld: Vector3
  ): void {
    const shaderTimeDays = elapsedSimulationSeconds / SECONDS_PER_DAY;
    const planetUniforms = this.uranusMesh.material.uniforms;
    planetUniforms.uTime.value = shaderTimeDays;
    planetUniforms.uSunDirectionWorld.value.copy(sunDirectionWorld);
    planetUniforms.uAxisWorld.value.copy(axisWorld);
    planetUniforms.uPlanetCenterWorld.value.copy(positionScene);

    for (const entry of this.rings.ringMaterials) {
      updateRingMaterial(entry, shaderTimeDays, positionScene, sunDirectionWorld);
    }
  }
}

function updateRingMaterial(
  entry: UranusRingMaterialEntry,
  shaderTimeDays: number,
  positionScene: Vector3,
  sunDirectionWorld: Vector3
): void {
  const uniforms = entry.material.uniforms;
  uniforms.uTime.value = shaderTimeDays;
  uniforms.uSunDirectionWorld.value.copy(sunDirectionWorld);
  uniforms.uPlanetCenterWorld.value.copy(positionScene);
}

function createOrbitPath(): LineLoop {
  const points = sampleOrbitPath(URANUS_ORBITAL_ELEMENTS, 960).map(
    (point) =>
      new Vector3(
        auToSceneDistance(point.x),
        auToSceneDistance(point.y),
        auToSceneDistance(point.z)
      )
  );

  const geometry = new BufferGeometry().setFromPoints(points);
  const material = new LineBasicMaterial({
    color: 0x86dfe2,
    transparent: true,
    opacity: 0.28
  });

  const line = new LineLoop(geometry, material);
  line.name = "Uranus Keplerian orbital path";
  return line;
}
