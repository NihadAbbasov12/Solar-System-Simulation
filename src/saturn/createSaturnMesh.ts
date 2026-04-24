import {
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Uniform,
  Vector3
} from "three";
import {
  SATURN_POLAR_TO_EQUATORIAL_RATIO,
  SATURN_PHYSICAL
} from "./saturnConstants";
import {
  saturnFragmentShader,
  saturnVertexShader
} from "./saturnShaders";
import { SATURN_EQUATORIAL_RADIUS_SCENE_UNITS } from "../physics/units";

export interface SaturnMeshResult {
  mesh: Mesh<SphereGeometry, ShaderMaterial>;
  material: ShaderMaterial;
}

export function createSaturnMesh(): SaturnMeshResult {
  const geometry = new SphereGeometry(
    SATURN_EQUATORIAL_RADIUS_SCENE_UNITS,
    192,
    96
  );

  // Geometry is scaled instead of mesh.scale so computed normals match the
  // oblate spheroid shape caused by Saturn's rapid rotation.
  geometry.scale(1, SATURN_POLAR_TO_EQUATORIAL_RATIO, 1);
  geometry.computeVertexNormals();

  const material = new ShaderMaterial({
    vertexShader: saturnVertexShader,
    fragmentShader: saturnFragmentShader,
    uniforms: {
      uPolarScale: new Uniform(SATURN_POLAR_TO_EQUATORIAL_RATIO),
      uTime: new Uniform(0),
      uSunDirectionWorld: new Uniform(new Vector3(1, 0, 0)),
      uAxisWorld: new Uniform(new Vector3(0, 1, 0)),
      uPlanetCenterWorld: new Uniform(new Vector3())
    }
  });

  const mesh = new Mesh(geometry, material);
  mesh.name = "Saturn oblate spheroid";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    meanRadiusKm: SATURN_PHYSICAL.meanRadiusKm,
    equatorialRadiusKm: SATURN_PHYSICAL.equatorialRadiusKm,
    polarRadiusKm: SATURN_PHYSICAL.polarRadiusKm
  };

  return { mesh, material };
}
