import {
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Uniform,
  Vector3
} from "three";
import {
  URANUS_DATA,
  URANUS_PHYSICAL,
  URANUS_POLAR_TO_EQUATORIAL_RATIO
} from "./uranusConstants";
import {
  uranusFragmentShader,
  uranusVertexShader
} from "./uranusShaders";
import { URANUS_EQUATORIAL_RADIUS_SCENE_UNITS } from "../physics/units";

export interface UranusMeshResult {
  mesh: Mesh<SphereGeometry, ShaderMaterial>;
  material: ShaderMaterial;
}

export function createUranusMesh(): UranusMeshResult {
  const geometry = new SphereGeometry(
    URANUS_EQUATORIAL_RADIUS_SCENE_UNITS,
    192,
    96
  );

  geometry.scale(1, URANUS_POLAR_TO_EQUATORIAL_RATIO, 1);
  geometry.computeVertexNormals();

  const material = new ShaderMaterial({
    vertexShader: uranusVertexShader,
    fragmentShader: uranusFragmentShader,
    uniforms: {
      uPolarScale: new Uniform(URANUS_POLAR_TO_EQUATORIAL_RATIO),
      uTime: new Uniform(0),
      uSunDirectionWorld: new Uniform(new Vector3(1, 0, 0)),
      uAxisWorld: new Uniform(new Vector3(0, 1, 0)),
      uPlanetCenterWorld: new Uniform(new Vector3())
    }
  });

  const mesh = new Mesh(geometry, material);
  mesh.name = "Uranus oblate ice giant";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = {
    ...URANUS_DATA,
    meanRadiusKm: URANUS_PHYSICAL.meanRadiusKm,
    equatorialRadiusKm: URANUS_PHYSICAL.equatorialRadiusKm,
    polarRadiusKm: URANUS_PHYSICAL.polarRadiusKm,
    hasTrueSolidSurface: URANUS_PHYSICAL.hasTrueSolidSurface
  };

  return { mesh, material };
}
