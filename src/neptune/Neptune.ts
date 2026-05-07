import {
  ArrowHelper,
  BufferGeometry,
  Group,
  LineBasicMaterial,
  LineLoop,
  Quaternion,
  Vector3
} from "three";
import {
  createNeptunianMoons,
  type NeptunianMoonsResult
} from "./createNeptunianMoons";
import { createNeptuneMesh } from "./createNeptuneMesh";
import {
  createNeptuneRings,
  type NeptuneRingMaterialEntry
} from "./createNeptuneRings";
import {
  NEPTUNE_AXIAL_TILT_RAD,
  NEPTUNE_DATA,
  NEPTUNE_ORBITAL_ELEMENTS,
  NEPTUNE_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND
} from "./neptuneConstants";
import {
  calculateOrbitalState,
  sampleOrbitPath,
  type OrbitalState
} from "../physics/orbitalMechanics";
import { auToSceneDistance, SECONDS_PER_DAY } from "../physics/units";
import { TAU } from "../utils/math";

export interface NeptuneUpdateState {
  orbitalState: OrbitalState;
  positionScene: Vector3;
  axisWorld: Vector3;
  sunDirectionWorld: Vector3;
  rotationAngleRad: number;
}

export class Neptune {
  readonly group = new Group();
  readonly orbitPath = createOrbitPath();
  readonly axisHelper = new ArrowHelper(
    new Vector3(0, 1, 0),
    new Vector3(),
    2.35,
    0x5faed0,
    0.32,
    0.15
  );

  private readonly axialTiltGroup = new Group();
  private readonly neptuneMesh = createNeptuneMesh();
  private readonly rings = createNeptuneRings();
  private readonly moons: NeptunianMoonsResult = createNeptunianMoons();
  private readonly tempQuaternion = new Quaternion();
  private lastState: NeptuneUpdateState | undefined;

  constructor() {
    this.group.name = "Neptune orbital body";
    this.group.userData = NEPTUNE_DATA;
    this.axialTiltGroup.name = "Neptune 28.32 degree axial tilt group";
    this.axialTiltGroup.rotation.z = NEPTUNE_AXIAL_TILT_RAD;
    this.axialTiltGroup.add(this.neptuneMesh.mesh);
    this.axialTiltGroup.add(this.rings.group);
    this.axialTiltGroup.add(this.moons.regularGroup);
    this.group.add(this.axialTiltGroup);
    this.group.add(this.moons.distantGroup);

    this.orbitPath.visible = false;
    this.axisHelper.visible = false;
    this.moons.setDebugVisible(false);
  }

  update(elapsedSimulationSeconds: number): NeptuneUpdateState {
    const orbitalState = calculateOrbitalState(
      NEPTUNE_ORBITAL_ELEMENTS,
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
        NEPTUNE_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND) %
      TAU;
    this.neptuneMesh.mesh.rotation.y = rotationAngleRad;
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

  getLastState(): NeptuneUpdateState | undefined {
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
    const planetUniforms = this.neptuneMesh.material.uniforms;
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
  entry: NeptuneRingMaterialEntry,
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
  const points = sampleOrbitPath(NEPTUNE_ORBITAL_ELEMENTS, 1_040).map(
    (point) =>
      new Vector3(
        auToSceneDistance(point.x),
        auToSceneDistance(point.y),
        auToSceneDistance(point.z)
      )
  );

  const geometry = new BufferGeometry().setFromPoints(points);
  const material = new LineBasicMaterial({
    color: 0x579db9,
    transparent: true,
    opacity: 0.26
  });

  const line = new LineLoop(geometry, material);
  line.name = "Neptune Keplerian orbital path";
  return line;
}
