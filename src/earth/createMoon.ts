import {
  BufferGeometry,
  Color,
  Group,
  LineBasicMaterial,
  LineLoop,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Uniform,
  Vector3
} from "three";
import {
  EARTH_PHYSICAL,
  MOON_ORBIT_VISUAL_COMPRESSION,
  MOON_ORBITAL_INCLINATION_RAD,
  MOON_PHYSICAL
} from "./earthConstants";
import { moonFragmentShader, moonVertexShader } from "./earthShaders";
import { kilometersToEarthLocalRadius } from "../physics/units";
import { TAU } from "../utils/math";

export interface MoonResult {
  group: Group;
  orbitPath: LineLoop;
  pivot: Group;
  moonMesh: Mesh<SphereGeometry, ShaderMaterial>;
  material: ShaderMaterial;
}

export function createMoon(): MoonResult {
  const group = new Group();
  group.name = "Moon orbit system";

  const orbitTiltGroup = new Group();
  orbitTiltGroup.name = "Moon orbital inclination group";
  orbitTiltGroup.rotation.z = MOON_ORBITAL_INCLINATION_RAD;
  group.add(orbitTiltGroup);

  const orbitRadius =
    localRadiusFromKm(MOON_PHYSICAL.semiMajorAxisKm) *
    MOON_ORBIT_VISUAL_COMPRESSION;
  const orbitPath = createMoonOrbitPath(orbitRadius);
  orbitTiltGroup.add(orbitPath);

  const pivot = new Group();
  pivot.name = "Moon orbital pivot";
  orbitTiltGroup.add(pivot);

  const material = new ShaderMaterial({
    vertexShader: moonVertexShader,
    fragmentShader: moonFragmentShader,
    uniforms: {
      uTime: new Uniform(0),
      uSunDirectionWorld: new Uniform(new Vector3(1, 0, 0))
    }
  });

  const moonRadius = localRadiusFromKm(MOON_PHYSICAL.meanRadiusKm);
  const moonMesh = new Mesh(
    new SphereGeometry(moonRadius, 96, 48),
    material
  );
  moonMesh.name = "Moon rocky satellite";
  moonMesh.position.set(orbitRadius, 0, 0);
  moonMesh.castShadow = true;
  moonMesh.receiveShadow = true;
  moonMesh.userData = {
    meanRadiusKm: MOON_PHYSICAL.meanRadiusKm,
    semiMajorAxisKm: MOON_PHYSICAL.semiMajorAxisKm,
    orbitalPeriodDays: MOON_PHYSICAL.orbitalPeriodDays
  };
  pivot.add(moonMesh);

  return { group, orbitPath, pivot, moonMesh, material };
}

function createMoonOrbitPath(radius: number): LineLoop {
  const points: Vector3[] = [];

  for (let index = 0; index < 240; index += 1) {
    const angle = (index / 240) * TAU;
    points.push(new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
  }

  const geometry = new BufferGeometry().setFromPoints(points);
  const material = new LineBasicMaterial({
    color: new Color(0x88aee0),
    transparent: true,
    opacity: 0.28
  });

  const line = new LineLoop(geometry, material);
  line.name = "Moon orbital path";
  line.visible = false;
  return line;
}

function localRadiusFromKm(kilometers: number): number {
  return kilometersToEarthLocalRadius(
    kilometers,
    EARTH_PHYSICAL.equatorialRadiusKm
  );
}
