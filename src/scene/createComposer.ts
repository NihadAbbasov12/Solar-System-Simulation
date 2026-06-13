import type {
  PerspectiveCamera,
  Scene,
  WebGLRenderer
} from "three";
import { Vector2 } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

export interface ComposerResult {
  composer: EffectComposer;
  setSize: (width: number, height: number, pixelRatio: number) => void;
}

// Bloom only ignites on HDR values above 1.0, so the Sun's shader output
// (and its specular glints) glow while ordinary surfaces stay crisp.
// Threshold sits above the brightest lit planet surfaces (~1.3 HDR), so only
// the Sun's photosphere and extreme specular glints ignite the glow pass.
const BLOOM_STRENGTH = 0.62;
const BLOOM_RADIUS = 0.5;
const BLOOM_THRESHOLD = 1.35;

export function createComposer(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: PerspectiveCamera
): ComposerResult {
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setSize(window.innerWidth, window.innerHeight);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new Vector2(window.innerWidth, window.innerHeight),
    BLOOM_STRENGTH,
    BLOOM_RADIUS,
    BLOOM_THRESHOLD
  );
  composer.addPass(bloomPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  return {
    composer,
    setSize: (width, height, pixelRatio) => {
      composer.setPixelRatio(pixelRatio);
      composer.setSize(width, height);
    }
  };
}
