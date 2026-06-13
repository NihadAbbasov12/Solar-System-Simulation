import { AmbientLight, Group, PointLight } from "three";

export interface LightsResult {
  group: Group;
  sunLight: PointLight;
}

export function createLights(): LightsResult {
  const group = new Group();
  group.name = "Sun and low ambient space lighting";

  const ambient = new AmbientLight(0x8aa0ad, 0.018);
  group.add(ambient);

  const sunLight = new PointLight(0xfff3cf, 4.6, 0, 0);
  sunLight.name = "Sun point light";
  sunLight.position.set(0, 0, 0);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 0.1;
  sunLight.shadow.camera.far = 500;
  sunLight.shadow.bias = -0.0004;
  group.add(sunLight);

  return { group, sunLight };
}
