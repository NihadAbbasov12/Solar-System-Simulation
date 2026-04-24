import {
  BufferAttribute,
  BufferGeometry,
  Points,
  PointsMaterial,
  Vector3
} from "three";
import { seededRandom } from "../utils/math";

export function createStarfield(): Points<BufferGeometry, PointsMaterial> {
  const random = seededRandom(42_4242);
  const geometry = new BufferGeometry();
  const positions: number[] = [];
  const colors: number[] = [];
  const starCount = 7_000;
  const radius = 1_700;

  for (let index = 0; index < starCount; index += 1) {
    const direction = randomDirection(random);
    const distance = radius * (0.72 + random() * 0.28);
    positions.push(
      direction.x * distance,
      direction.y * distance,
      direction.z * distance
    );

    const temperature = random();
    const warm = 0.78 + random() * 0.22;
    colors.push(
      warm,
      0.84 + temperature * 0.14,
      0.88 + (1 - temperature) * 0.12
    );
  }

  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute("color", new BufferAttribute(new Float32Array(colors), 3));

  const material = new PointsMaterial({
    size: 1.1,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.82,
    depthWrite: false
  });

  const stars = new Points(geometry, material);
  stars.name = "Procedural starfield";
  return stars;
}

function randomDirection(random: () => number): Vector3 {
  const z = random() * 2 - 1;
  const theta = random() * Math.PI * 2;
  const radius = Math.sqrt(1 - z * z);
  return new Vector3(Math.cos(theta) * radius, z, Math.sin(theta) * radius);
}
