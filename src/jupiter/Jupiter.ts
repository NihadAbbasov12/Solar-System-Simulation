import {
  ArrowHelper,
  BufferGeometry,
  Color,
  Group,
  LineBasicMaterial,
  LineLoop,
  Quaternion,
  Vector3
} from "three";
import { createGalileanMoons, type GalileanMoonsResult } from "./createGalileanMoons";
import { createJupiterMesh } from "./createJupiterMesh";
import { createJupiterRings } from "./createJupiterRings";
import {
  JUPITER_AXIAL_TILT_RAD,
  JUPITER_ORBITAL_ELEMENTS,
  JUPITER_POLAR_TO_EQUATORIAL_RATIO,
  JUPITER_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND
} from "./jupiterConstants";
import { createAtmosphereShell } from "../scene/createAtmosphereShell";
import { calculateOrbitalState, sampleOrbitPath, type OrbitalState } from "../physics/orbitalMechanics";
import {
  auToSceneDistance,
  JUPITER_EQUATORIAL_RADIUS_SCENE_UNITS,
  SECONDS_PER_DAY
} from "../physics/units";
import { TAU } from "../utils/math";

export interface JupiterUpdateState {
  orbitalState: OrbitalState;
  positionScene: Vector3;
  axisWorld: Vector3;
  sunDirectionWorld: Vector3;
  rotationAngleRad: number;
}

export class Jupiter {
  readonly group = new Group();
  readonly orbitPath = createOrbitPath();
  readonly axisHelper = new ArrowHelper(
    new Vector3(0, 1, 0),
    new Vector3(),
    3.7,
    0xf3c76f,
    0.5,
    0.24
  );

  private readonly axialTiltGroup = new Group();
  private readonly jupiterMesh = createJupiterMesh();
  private readonly rings = createJupiterRings();
  private readonly galileanMoons: GalileanMoonsResult = createGalileanMoons();
  private readonly tempQuaternion = new Quaternion();
  private lastState: JupiterUpdateState | undefined;

  constructor() {
    this.group.name = "Jupiter orbital body";
    this.axialTiltGroup.name = "Jupiter axial tilt group";
    this.axialTiltGroup.rotation.z = JUPITER_AXIAL_TILT_RAD;
    this.axialTiltGroup.add(this.jupiterMesh.mesh);
    this.axialTiltGroup.add(
      createAtmosphereShell({
        radius: JUPITER_EQUATORIAL_RADIUS_SCENE_UNITS,
        polarScale: JUPITER_POLAR_TO_EQUATORIAL_RATIO,
        scaleFactor: 1.03,
        color: new Color(0.78, 0.72, 0.6),
        intensity: 0.45,
        falloff: 4.6
      })
    );
    this.axialTiltGroup.add(this.rings.group);
    this.axialTiltGroup.add(this.galileanMoons.group);
    this.group.add(this.axialTiltGroup);

    this.orbitPath.visible = false;
    this.axisHelper.visible = false;
    this.galileanMoons.setDebugVisible(false);
  }

  update(elapsedSimulationSeconds: number): JupiterUpdateState {
    const orbitalState = calculateOrbitalState(
      JUPITER_ORBITAL_ELEMENTS,
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
        JUPITER_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND) %
      TAU;
    this.jupiterMesh.mesh.rotation.y = rotationAngleRad;
    this.galileanMoons.update(elapsedSimulationSeconds);

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

  getLastState(): JupiterUpdateState | undefined {
    return this.lastState;
  }

  setDebugVisible(visible: boolean): void {
    this.orbitPath.visible = visible;
    this.axisHelper.visible = visible;
    this.galileanMoons.setDebugVisible(visible);
  }

  private updateShaderUniforms(
    elapsedSimulationSeconds: number,
    positionScene: Vector3,
    axisWorld: Vector3,
    sunDirectionWorld: Vector3
  ): void {
    const shaderTimeDays = elapsedSimulationSeconds / SECONDS_PER_DAY;
    const planetUniforms = this.jupiterMesh.material.uniforms;
    planetUniforms.uTime.value = shaderTimeDays;
    planetUniforms.uSunDirectionWorld.value.copy(sunDirectionWorld);
    planetUniforms.uAxisWorld.value.copy(axisWorld);
    planetUniforms.uPlanetCenterWorld.value.copy(positionScene);
  }
}

function createOrbitPath(): LineLoop {
  const points = sampleOrbitPath(JUPITER_ORBITAL_ELEMENTS, 900).map(
    (point) =>
      new Vector3(
        auToSceneDistance(point.x),
        auToSceneDistance(point.y),
        auToSceneDistance(point.z)
      )
  );

  const geometry = new BufferGeometry().setFromPoints(points);
  const material = new LineBasicMaterial({
    color: 0xd49b45,
    transparent: true,
    opacity: 0.32
  });

  const line = new LineLoop(geometry, material);
  line.name = "Jupiter Keplerian orbital path";
  return line;
}
