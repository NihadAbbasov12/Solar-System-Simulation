import { Vector3 } from "three";
import type { BufferGeometry, Points, PointsMaterial } from "three";
import { clamp } from "./math";

const worldPosition = new Vector3();

/**
 * Fades an additive particle layer out with camera distance. Far away, every
 * sub-pixel particle still rasterizes as a full pixel, so thousands of
 * additive points saturate into a white blob unless they are faded out.
 */
export function attachDistanceFade(
  particles: Points<BufferGeometry, PointsMaterial>,
  baseOpacity: number,
  fadeStartDistance: number,
  fadeEndDistance: number
): void {
  particles.onBeforeRender = (_renderer, _scene, camera) => {
    particles.getWorldPosition(worldPosition);
    const distance = camera.position.distanceTo(worldPosition);
    const visibility = clamp(
      (fadeEndDistance - distance) / (fadeEndDistance - fadeStartDistance),
      0,
      1
    );
    particles.material.opacity = baseOpacity * visibility;
  };
}
