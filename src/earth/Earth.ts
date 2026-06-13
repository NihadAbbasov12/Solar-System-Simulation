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
import { createEarthMesh } from "./createEarthMesh";
import { createMoon, type MoonResult } from "./createMoon";
import {
  EARTH_AXIAL_TILT_RAD,
  EARTH_ORBITAL_ELEMENTS,
  EARTH_POLAR_TO_EQUATORIAL_RATIO,
  EARTH_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND,
  MOON_MEAN_ANOMALY_AT_EPOCH_RAD,
  MOON_ORBIT_ANGULAR_SPEED_RAD_PER_SECOND
} from "./earthConstants";
import { createAtmosphereShell } from "../scene/createAtmosphereShell";
import { calculateOrbitalState, sampleOrbitPath, type OrbitalState } from "../physics/orbitalMechanics";
import {
  auToSceneDistance,
  EARTH_EQUATORIAL_RADIUS_SCENE_UNITS,
  SECONDS_PER_DAY
} from "../physics/units";
import { TAU } from "../utils/math";

export interface EarthUpdateState {
  orbitalState: OrbitalState;
  positionScene: Vector3;
  axisWorld: Vector3;
  sunDirectionWorld: Vector3;
  rotationAngleRad: number;
}

export class Earth {
  readonly group = new Group();
  readonly orbitPath = createOrbitPath();
  readonly axisHelper = new ArrowHelper(
    new Vector3(0, 1, 0),
    new Vector3(),
    1.25,
    0x76d7ff,
    0.2,
    0.1
  );

  private readonly axialTiltGroup = new Group();
  private readonly earthMesh = createEarthMesh();
  private readonly moon: MoonResult = createMoon();
  private readonly tempQuaternion = new Quaternion();
  private lastState: EarthUpdateState | undefined;

  constructor() {
    this.group.name = "Earth orbital body";
    this.axialTiltGroup.name = "Earth axial tilt group";
    this.axialTiltGroup.rotation.z = EARTH_AXIAL_TILT_RAD;
    this.axialTiltGroup.add(this.earthMesh.mesh);
    this.axialTiltGroup.add(
      createAtmosphereShell({
        radius: EARTH_EQUATORIAL_RADIUS_SCENE_UNITS,
        polarScale: EARTH_POLAR_TO_EQUATORIAL_RATIO,
        scaleFactor: 1.06,
        color: new Color(0.35, 0.6, 1.0),
        intensity: 0.9,
        falloff: 3.4
      })
    );
    this.group.add(this.axialTiltGroup);
    this.group.add(this.moon.group);

    this.orbitPath.visible = false;
    this.axisHelper.visible = false;
  }

  update(elapsedSimulationSeconds: number): EarthUpdateState {
    const orbitalState = calculateOrbitalState(
      EARTH_ORBITAL_ELEMENTS,
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
        EARTH_ROTATION_ANGULAR_SPEED_RAD_PER_SECOND) %
      TAU;
    this.earthMesh.mesh.rotation.y = rotationAngleRad;

    const moonOrbitAngleRad =
      (MOON_MEAN_ANOMALY_AT_EPOCH_RAD +
        elapsedSimulationSeconds * MOON_ORBIT_ANGULAR_SPEED_RAD_PER_SECOND) %
      TAU;
    this.moon.pivot.rotation.y = moonOrbitAngleRad;

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

  getLastState(): EarthUpdateState | undefined {
    return this.lastState;
  }

  setDebugVisible(visible: boolean): void {
    this.orbitPath.visible = visible;
    this.axisHelper.visible = visible;
    this.moon.orbitPath.visible = visible;
  }

  private updateShaderUniforms(
    elapsedSimulationSeconds: number,
    positionScene: Vector3,
    axisWorld: Vector3,
    sunDirectionWorld: Vector3
  ): void {
    const shaderTimeDays = elapsedSimulationSeconds / SECONDS_PER_DAY;
    const planetUniforms = this.earthMesh.material.uniforms;
    planetUniforms.uTime.value = shaderTimeDays;
    planetUniforms.uSunDirectionWorld.value.copy(sunDirectionWorld);
    planetUniforms.uAxisWorld.value.copy(axisWorld);
    planetUniforms.uPlanetCenterWorld.value.copy(positionScene);

    const moonUniforms = this.moon.material.uniforms;
    moonUniforms.uTime.value = shaderTimeDays;
    moonUniforms.uSunDirectionWorld.value.copy(sunDirectionWorld);
  }
}

function createOrbitPath(): LineLoop {
  const points = sampleOrbitPath(EARTH_ORBITAL_ELEMENTS, 900).map(
    (point) =>
      new Vector3(
        auToSceneDistance(point.x),
        auToSceneDistance(point.y),
        auToSceneDistance(point.z)
      )
  );

  const geometry = new BufferGeometry().setFromPoints(points);
  const material = new LineBasicMaterial({
    color: 0x4fa3ff,
    transparent: true,
    opacity: 0.34
  });

  const line = new LineLoop(geometry, material);
  line.name = "Earth Keplerian orbital path";
  return line;
}
