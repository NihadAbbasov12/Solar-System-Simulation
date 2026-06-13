import {
  AdditiveBlending,
  BackSide,
  Color,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Uniform
} from "three";

export interface AtmosphereShellOptions {
  /** Planet equatorial radius in scene units. */
  radius: number;
  /** Polar-to-equatorial flattening ratio of the planet. */
  polarScale: number;
  /** How far the glow extends past the limb (1.0 = none). */
  scaleFactor: number;
  /** Scatter tint of the atmosphere. */
  color: Color;
  /** Overall halo strength. */
  intensity: number;
  /** Higher values pull the glow tighter against the limb. */
  falloff: number;
}

const atmosphereVertexShader = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying vec3 vPlanetCenterWorld;

  void main() {
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vPlanetCenterWorld = modelMatrix[3].xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uFalloff;

  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying vec3 vPlanetCenterWorld;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    // BackSide shell: the glow hugs the silhouette where normals graze view.
    float rim = 1.0 - abs(dot(normalize(vWorldNormal), viewDirection));
    float halo = pow(rim, uFalloff);

    // The Sun sits at the world origin, so the lit limb glows while the
    // night-side limb keeps only a faint scattered remnant.
    vec3 sunDirection = normalize(-vPlanetCenterWorld);
    vec3 fromCenter = normalize(vWorldPosition - vPlanetCenterWorld);
    float dayFactor = clamp(dot(fromCenter, sunDirection) * 0.62 + 0.5, 0.0, 1.0);
    float lit = 0.08 + 0.92 * dayFactor * dayFactor;

    float alpha = halo * lit;
    gl_FragColor = vec4(uColor * uIntensity * alpha, alpha);
  }
`;

export function createAtmosphereShell(
  options: AtmosphereShellOptions
): Mesh<SphereGeometry, ShaderMaterial> {
  const geometry = new SphereGeometry(
    options.radius * options.scaleFactor,
    96,
    48
  );
  geometry.scale(1, options.polarScale, 1);

  const material = new ShaderMaterial({
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    uniforms: {
      uColor: new Uniform(options.color),
      uIntensity: new Uniform(options.intensity),
      uFalloff: new Uniform(options.falloff)
    },
    side: BackSide,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending
  });

  const mesh = new Mesh(geometry, material);
  mesh.name = "Atmosphere scattering shell";
  return mesh;
}
