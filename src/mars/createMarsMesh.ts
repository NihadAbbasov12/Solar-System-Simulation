import {
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Uniform,
  Vector3
} from "three";
import {
  MARS_DESCRIPTION,
  MARS_PHYSICAL,
  MARS_POLAR_TO_EQUATORIAL_RATIO
} from "./marsConstants";
import {
  marsFragmentShader,
  marsVertexShader
} from "./marsShaders";
import { MARS_EQUATORIAL_RADIUS_SCENE_UNITS } from "../physics/units";

export interface MarsMeshResult {
  mesh: Mesh<SphereGeometry, ShaderMaterial>;
  material: ShaderMaterial;
}

export function createMarsMesh(): MarsMeshResult {
  const geometry = new SphereGeometry(
    MARS_EQUATORIAL_RADIUS_SCENE_UNITS,
    192,
    96
  );

  geometry.scale(1, MARS_POLAR_TO_EQUATORIAL_RATIO, 1);
  geometry.computeVertexNormals();

  const material = new ShaderMaterial({
    vertexShader: marsVertexShader,
    fragmentShader: marsFragmentShader,
    uniforms: {
      uPolarScale: new Uniform(MARS_POLAR_TO_EQUATORIAL_RATIO),
      uTime: new Uniform(0),
      uSunDirectionWorld: new Uniform(new Vector3(1, 0, 0)),
      uAxisWorld: new Uniform(new Vector3(0, 1, 0)),
      uPlanetCenterWorld: new Uniform(new Vector3())
    }
  });

  const mesh = new Mesh(geometry, material);
  mesh.name = "Mars oblate spheroid";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    description: MARS_DESCRIPTION,
    meanRadiusKm: MARS_PHYSICAL.meanRadiusKm,
    equatorialRadiusKm: MARS_PHYSICAL.equatorialRadiusKm,
    polarRadiusKm: MARS_PHYSICAL.polarRadiusKm,
    atmosphere: MARS_PHYSICAL.atmosphere,
    moonCount: MARS_PHYSICAL.moonCount
  };

  return { mesh, material };
}
