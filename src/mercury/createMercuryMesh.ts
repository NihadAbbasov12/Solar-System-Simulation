import {
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Uniform,
  Vector3
} from "three";
import {
  MERCURY_DESCRIPTION,
  MERCURY_LANDMARKS,
  MERCURY_PHYSICAL,
  MERCURY_POLAR_TO_EQUATORIAL_RATIO,
  MERCURY_PROFILE
} from "./mercuryConstants";
import {
  mercuryFragmentShader,
  mercuryVertexShader
} from "./mercuryShaders";
import { MERCURY_EQUATORIAL_RADIUS_SCENE_UNITS } from "../physics/units";

export interface MercuryMeshResult {
  mesh: Mesh<SphereGeometry, ShaderMaterial>;
  material: ShaderMaterial;
}

export function createMercuryMesh(): MercuryMeshResult {
  const geometry = new SphereGeometry(
    MERCURY_EQUATORIAL_RADIUS_SCENE_UNITS,
    192,
    96
  );

  geometry.scale(1, MERCURY_POLAR_TO_EQUATORIAL_RATIO, 1);
  geometry.computeVertexNormals();

  const material = new ShaderMaterial({
    vertexShader: mercuryVertexShader,
    fragmentShader: mercuryFragmentShader,
    uniforms: {
      uPolarScale: new Uniform(MERCURY_POLAR_TO_EQUATORIAL_RATIO),
      uTime: new Uniform(0),
      uSolarIntensity: new Uniform(1),
      uSunDirectionWorld: new Uniform(new Vector3(1, 0, 0)),
      uAxisWorld: new Uniform(new Vector3(0, 1, 0)),
      uPlanetCenterWorld: new Uniform(new Vector3())
    }
  });

  const mesh = new Mesh(geometry, material);
  mesh.name = "Mercury cratered spheroid";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    description: MERCURY_DESCRIPTION,
    profile: MERCURY_PROFILE,
    landmarks: MERCURY_LANDMARKS,
    meanRadiusKm: MERCURY_PHYSICAL.meanRadiusKm,
    equatorialRadiusKm: MERCURY_PHYSICAL.equatorialRadiusKm,
    massKg: MERCURY_PHYSICAL.massKg,
    densityGramsPerCubicCentimeter:
      MERCURY_PHYSICAL.densityGramsPerCubicCentimeter,
    surfaceGravityMetersPerSecondSquared:
      MERCURY_PHYSICAL.surfaceGravityMetersPerSecondSquared,
    escapeVelocityKmPerSecond: MERCURY_PHYSICAL.escapeVelocityKmPerSecond,
    atmosphere: MERCURY_PHYSICAL.exosphere,
    moonCount: MERCURY_PHYSICAL.moonCount,
    ringCount: MERCURY_PHYSICAL.ringCount
  };

  return { mesh, material };
}
