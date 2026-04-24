import {
  ArrowHelper,
  BufferGeometry,
  Group,
  LineBasicMaterial,
  LineLoop,
  Quaternion,
  Vector3
} from "three";
import { createRings, type RingMaterialEntry } from "./createRings";
import { createSaturnMesh } from "./createSaturnMesh";
import {
  SATURN_AXIAL_TILT_RAD,
  SATURN_ORBITAL_ELEMENTS,
  SATURN_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND
} from "./saturnConstants";
import { calculateOrbitalState, sampleOrbitPath, type OrbitalState } from "../physics/orbitalMechanics";
import { auToSceneDistance, SECONDS_PER_DAY } from "../physics/units";
import { TAU } from "../utils/math";

export interface SaturnUpdateState {
  orbitalState: OrbitalState;
  positionScene: Vector3;
  axisWorld: Vector3;
  sunDirectionWorld: Vector3;
  rotationAngleRad: number;
}

export class Saturn {
  readonly group = new Group();
  readonly orbitPath = createOrbitPath();
  readonly axisHelper = new ArrowHelper(
    new Vector3(0, 1, 0),
    new Vector3(),
    3.1,
    0x8ad7f7,
    0.46,
    0.22
  );

  private readonly axialTiltGroup = new Group();
  private readonly saturnMesh = createSaturnMesh();
  private readonly rings = createRings();
  private readonly tempQuaternion = new Quaternion();
  private lastState: SaturnUpdateState | undefined;

  constructor() {
    this.group.name = "Saturn orbital body";
    this.axialTiltGroup.name = "Saturn axial tilt group";
    this.axialTiltGroup.rotation.z = SATURN_AXIAL_TILT_RAD;
    this.axialTiltGroup.add(this.saturnMesh.mesh);
    this.axialTiltGroup.add(this.rings.group);
    this.group.add(this.axialTiltGroup);

    this.orbitPath.visible = false;
    this.axisHelper.visible = false;
  }

  update(elapsedSimulationSeconds: number): SaturnUpdateState {
    const orbitalState = calculateOrbitalState(
      SATURN_ORBITAL_ELEMENTS,
      elapsedSimulationSeconds
    );
    const positionScene = new Vector3(
      auToSceneDistance(orbitalState.positionAU.x),
      auToSceneDistance(orbitalState.positionAU.y),
      auToSceneDistance(orbitalState.positionAU.z)
    );
    this.group.position.copy(positionScene);

    // Local rotation is independent from orbital motion. The tilted parent
    // defines the spin axis; the mesh rotates around its own local +Y axis.
    const rotationAngleRad =
      (elapsedSimulationSeconds *
        SATURN_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND) %
      TAU;
    this.saturnMesh.mesh.rotation.y = rotationAngleRad;

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

  getLastState(): SaturnUpdateState | undefined {
    return this.lastState;
  }

  setDebugVisible(visible: boolean): void {
    this.orbitPath.visible = visible;
    this.axisHelper.visible = visible;
  }

  private updateShaderUniforms(
    elapsedSimulationSeconds: number,
    positionScene: Vector3,
    axisWorld: Vector3,
    sunDirectionWorld: Vector3
  ): void {
    const shaderTimeDays = elapsedSimulationSeconds / SECONDS_PER_DAY;
    const planetUniforms = this.saturnMesh.material.uniforms;
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
  entry: RingMaterialEntry,
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
  const points = sampleOrbitPath(SATURN_ORBITAL_ELEMENTS, 900).map(
    (point) =>
      new Vector3(
        auToSceneDistance(point.x),
        auToSceneDistance(point.y),
        auToSceneDistance(point.z)
      )
  );

  const geometry = new BufferGeometry().setFromPoints(points);
  const material = new LineBasicMaterial({
    color: 0x6fb7dc,
    transparent: true,
    opacity: 0.34
  });

  const line = new LineLoop(geometry, material);
  line.name = "Saturn Keplerian orbital path";
  return line;
}
