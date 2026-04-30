import {
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Uniform,
  Vector3
} from "three";
import {
  JUPITER_PHYSICAL,
  JUPITER_POLAR_TO_EQUATORIAL_RATIO
} from "./jupiterConstants";
import {
  jupiterFragmentShader,
  jupiterVertexShader
} from "./jupiterShaders";
import { JUPITER_EQUATORIAL_RADIUS_SCENE_UNITS } from "../physics/units";

export interface JupiterMeshResult {
  mesh: Mesh<SphereGeometry, ShaderMaterial>;
  material: ShaderMaterial;
}

export function createJupiterMesh(): JupiterMeshResult {
  const geometry = new SphereGeometry(
    JUPITER_EQUATORIAL_RADIUS_SCENE_UNITS,
    224,
    112
  );

  geometry.scale(1, JUPITER_POLAR_TO_EQUATORIAL_RATIO, 1);
  geometry.computeVertexNormals();

  const material = new ShaderMaterial({
    vertexShader: jupiterVertexShader,
    fragmentShader: jupiterFragmentShader,
    uniforms: {
      uPolarScale: new Uniform(JUPITER_POLAR_TO_EQUATORIAL_RATIO),
      uTime: new Uniform(0),
      uSunDirectionWorld: new Uniform(new Vector3(1, 0, 0)),
      uAxisWorld: new Uniform(new Vector3(0, 1, 0)),
      uPlanetCenterWorld: new Uniform(new Vector3())
    }
  });

  const mesh = new Mesh(geometry, material);
  mesh.name = "Jupiter oblate spheroid";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    meanRadiusKm: JUPITER_PHYSICAL.meanRadiusKm,
    equatorialRadiusKm: JUPITER_PHYSICAL.equatorialRadiusKm,
    polarRadiusKm: JUPITER_PHYSICAL.polarRadiusKm,
    moonCount: JUPITER_PHYSICAL.moonCount
  };

  return { mesh, material };
}
