import {
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Uniform,
  Vector3
} from "three";
import {
  EARTH_DESCRIPTION,
  EARTH_PHYSICAL,
  EARTH_POLAR_TO_EQUATORIAL_RATIO
} from "./earthConstants";
import {
  earthFragmentShader,
  earthVertexShader
} from "./earthShaders";
import { EARTH_EQUATORIAL_RADIUS_SCENE_UNITS } from "../physics/units";

export interface EarthMeshResult {
  mesh: Mesh<SphereGeometry, ShaderMaterial>;
  material: ShaderMaterial;
}

export function createEarthMesh(): EarthMeshResult {
  const geometry = new SphereGeometry(
    EARTH_EQUATORIAL_RADIUS_SCENE_UNITS,
    192,
    96
  );

  geometry.scale(1, EARTH_POLAR_TO_EQUATORIAL_RATIO, 1);
  geometry.computeVertexNormals();

  const material = new ShaderMaterial({
    vertexShader: earthVertexShader,
    fragmentShader: earthFragmentShader,
    uniforms: {
      uPolarScale: new Uniform(EARTH_POLAR_TO_EQUATORIAL_RATIO),
      uTime: new Uniform(0),
      uSunDirectionWorld: new Uniform(new Vector3(1, 0, 0)),
      uAxisWorld: new Uniform(new Vector3(0, 1, 0)),
      uPlanetCenterWorld: new Uniform(new Vector3())
    }
  });

  const mesh = new Mesh(geometry, material);
  mesh.name = "Earth oblate spheroid";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    description: EARTH_DESCRIPTION,
    meanRadiusKm: EARTH_PHYSICAL.meanRadiusKm,
    equatorialRadiusKm: EARTH_PHYSICAL.equatorialRadiusKm,
    polarRadiusKm: EARTH_PHYSICAL.polarRadiusKm,
    atmosphere: EARTH_PHYSICAL.atmosphere,
    moonCount: EARTH_PHYSICAL.moonCount
  };

  return { mesh, material };
}
