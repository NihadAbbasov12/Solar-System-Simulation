import {
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Uniform,
  Vector3
} from "three";
import {
  NEPTUNE_DATA,
  NEPTUNE_PHYSICAL,
  NEPTUNE_POLAR_TO_EQUATORIAL_RATIO
} from "./neptuneConstants";
import {
  neptuneFragmentShader,
  neptuneVertexShader
} from "./neptuneShaders";
import { NEPTUNE_EQUATORIAL_RADIUS_SCENE_UNITS } from "../physics/units";

export interface NeptuneMeshResult {
  mesh: Mesh<SphereGeometry, ShaderMaterial>;
  material: ShaderMaterial;
}

export function createNeptuneMesh(): NeptuneMeshResult {
  const geometry = new SphereGeometry(
    NEPTUNE_EQUATORIAL_RADIUS_SCENE_UNITS,
    192,
    96
  );

  geometry.scale(1, NEPTUNE_POLAR_TO_EQUATORIAL_RATIO, 1);
  geometry.computeVertexNormals();

  const material = new ShaderMaterial({
    vertexShader: neptuneVertexShader,
    fragmentShader: neptuneFragmentShader,
    uniforms: {
      uPolarScale: new Uniform(NEPTUNE_POLAR_TO_EQUATORIAL_RATIO),
      uTime: new Uniform(0),
      uSunDirectionWorld: new Uniform(new Vector3(1, 0, 0)),
      uAxisWorld: new Uniform(new Vector3(0, 1, 0)),
      uPlanetCenterWorld: new Uniform(new Vector3())
    }
  });

  const mesh = new Mesh(geometry, material);
  mesh.name = "Neptune oblate ice giant atmosphere";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    ...NEPTUNE_DATA,
    meanRadiusKm: NEPTUNE_PHYSICAL.meanRadiusKm,
    equatorialRadiusKm: NEPTUNE_PHYSICAL.equatorialRadiusKm,
    polarRadiusKm: NEPTUNE_PHYSICAL.polarRadiusKm,
    hasTrueSolidSurface: NEPTUNE_PHYSICAL.hasTrueSolidSurface
  };

  return { mesh, material };
}
