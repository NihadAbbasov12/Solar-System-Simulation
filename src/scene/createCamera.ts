import { PerspectiveCamera, Vector3 } from "three";

export function createCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.01,
    5_000
  );
  camera.position.copy(new Vector3(0, 3.4, 9.0));
  return camera;
}
