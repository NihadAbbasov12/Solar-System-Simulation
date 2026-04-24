import {
  AmbientLight,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  PointLight,
  SphereGeometry
} from "three";

export interface LightsResult {
  group: Group;
  sunLight: PointLight;
  sunMesh: Mesh<SphereGeometry, MeshBasicMaterial>;
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
  sunLight.shadow.mapSize.set(1024, 1024);
  sunLight.shadow.camera.near = 0.1;
  sunLight.shadow.camera.far = 500;
  sunLight.shadow.bias = -0.0004;
  group.add(sunLight);

  const sunMesh = new Mesh(
    new SphereGeometry(3.0, 48, 24),
    new MeshBasicMaterial({
      color: new Color(0xffdf8e)
    })
  );
  sunMesh.name = "Rendered Sun marker";
  sunMesh.position.copy(sunLight.position);
  group.add(sunMesh);

  return { group, sunLight, sunMesh };
}
