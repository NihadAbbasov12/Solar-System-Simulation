import {
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Uniform,
  Vector3
} from "three";
import {
  VENUS_DESCRIPTION,
  VENUS_PHYSICAL,
  VENUS_POLAR_TO_EQUATORIAL_RATIO,
  VENUS_PROFILE,
  VENUS_SURFACE_FEATURES
} from "./venusConstants";
import {
  venusFragmentShader,
  venusVertexShader
} from "./venusShaders";
import { VENUS_EQUATORIAL_RADIUS_SCENE_UNITS } from "../physics/units";

export interface VenusMeshResult {
  mesh: Mesh<SphereGeometry, ShaderMaterial>;
  material: ShaderMaterial;
}

export function createVenusMesh(): VenusMeshResult {
  const geometry = new SphereGeometry(
    VENUS_EQUATORIAL_RADIUS_SCENE_UNITS,
    224,
    112
  );

  geometry.scale(1, VENUS_POLAR_TO_EQUATORIAL_RATIO, 1);
  geometry.computeVertexNormals();

  const material = new ShaderMaterial({
    vertexShader: venusVertexShader,
    fragmentShader: venusFragmentShader,
    uniforms: {
      uPolarScale: new Uniform(VENUS_POLAR_TO_EQUATORIAL_RATIO),
      uTime: new Uniform(0),
      uCloudLongitudeOffset: new Uniform(0),
      uRadarBlend: new Uniform(0),
      uSunDirectionWorld: new Uniform(new Vector3(1, 0, 0))
    }
  });

  const mesh = new Mesh(geometry, material);
  mesh.name = "Venus sulfuric-acid cloud deck";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    description: VENUS_DESCRIPTION,
    profile: VENUS_PROFILE,
    surfaceFeatures: VENUS_SURFACE_FEATURES,
    meanRadiusKm: VENUS_PHYSICAL.meanRadiusKm,
    equatorialRadiusKm: VENUS_PHYSICAL.equatorialRadiusKm,
    massKg: VENUS_PHYSICAL.massKg,
    meanDensityGramsPerCubicCentimeter:
      VENUS_PHYSICAL.meanDensityGramsPerCubicCentimeter,
    surfaceGravityMetersPerSecondSquared:
      VENUS_PHYSICAL.surfaceGravityMetersPerSecondSquared,
    escapeVelocityKmPerSecond: VENUS_PHYSICAL.escapeVelocityKmPerSecond,
    atmosphere: VENUS_PHYSICAL.atmosphere,
    cloudLayers: VENUS_PHYSICAL.cloudLayers,
    moonCount: VENUS_PHYSICAL.moonCount,
    ringCount: VENUS_PHYSICAL.ringCount
  };

  return { mesh, material };
}
