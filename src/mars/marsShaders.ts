export const marsVertexShader = /* glsl */ `
  uniform float uPolarScale;

  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vShapePosition;

  void main() {
    vShapePosition = normalize(vec3(position.x, position.y / uPolarScale, position.z));

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const marsFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3 uSunDirectionWorld;

  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vShapePosition;

  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float n000 = hash31(i);
    float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);
    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);
    return mix(nxy0, nxy1, f.z);
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 5; octave++) {
      value += amplitude * noise3(p);
      p *= 2.11;
      amplitude *= 0.5;
    }
    return value;
  }

  float wrappedDistance(float a, float b) {
    return atan(sin(a - b), cos(a - b));
  }

  // Schueler screen-space bump mapping: perturbs the shading normal from a
  // procedural height field so relief catches directional sunlight.
  vec3 perturbNormal(vec3 normalWorld, vec3 worldPosition, float height, float strength) {
    vec3 dpdx = dFdx(worldPosition);
    vec3 dpdy = dFdy(worldPosition);
    float dhdx = dFdx(height);
    float dhdy = dFdy(height);
    vec3 r1 = cross(dpdy, normalWorld);
    vec3 r2 = cross(normalWorld, dpdx);
    float det = dot(dpdx, r1);
    det = sign(det) * max(abs(det), 1e-7);
    vec3 grad = (r1 * dhdx + r2 * dhdy) / det;
    return normalize(normalWorld - strength * grad);
  }

  void main() {
    vec3 shape = normalize(vShapePosition);
    float latitude = asin(clamp(shape.y, -1.0, 1.0));
    float longitude = atan(shape.z, shape.x);
    float absLatitude = abs(latitude) / 1.57079632679;

    float terrain = fbm(shape * 3.1 + vec3(0.7, -0.2, 1.3));
    float fineDust = fbm(shape * 17.0 + vec3(-1.4, 0.6, 0.2));
    float craterNoise = fbm(shape * 42.0 + vec3(0.3, 1.1, -0.7));
    float highlandBias = smoothstep(-0.25, 0.62, shape.y + 0.28);

    vec3 ochreDust = vec3(0.72, 0.34, 0.18);
    vec3 redDust = vec3(0.56, 0.20, 0.11);
    vec3 darkBasalt = vec3(0.22, 0.16, 0.14);
    vec3 paleDust = vec3(0.88, 0.62, 0.38);
    vec3 polarIce = vec3(0.92, 0.88, 0.78);

    vec3 surface = mix(redDust, ochreDust, smoothstep(0.24, 0.82, terrain));
    surface = mix(surface, paleDust, smoothstep(0.62, 0.96, fineDust) * 0.34);
    surface = mix(surface, darkBasalt, smoothstep(0.54, 0.86, 1.0 - terrain) * 0.38);
    surface = mix(surface, vec3(0.74, 0.42, 0.24), highlandBias * 0.22);

    float craterMask = smoothstep(0.78, 0.93, craterNoise);
    surface *= 1.0 - craterMask * 0.18;

    float olympusLon = -1.35;
    float olympusLat = 0.32;
    float olympusDx = wrappedDistance(longitude, olympusLon);
    float olympusDy = latitude - olympusLat;
    float olympus = 1.0 - smoothstep(0.0, 1.0, (olympusDx * olympusDx) / 0.035 + (olympusDy * olympusDy) / 0.018);
    surface = mix(surface, vec3(0.78, 0.46, 0.26), olympus * 0.38);

    float canyonLat = -0.18;
    float canyonLon = -0.62;
    float canyon = smoothstep(0.085, 0.0, abs(latitude - canyonLat + sin(longitude * 1.8) * 0.018));
    canyon *= smoothstep(1.2, 0.1, abs(wrappedDistance(longitude, canyonLon)));
    surface = mix(surface, vec3(0.18, 0.10, 0.08), canyon * 0.55);

    float iceCap = smoothstep(0.76, 0.91, absLatitude);
    float seasonalEdge = fbm(vec3(longitude * 3.5 + uTime * 0.006, latitude * 10.0, 0.4));
    iceCap *= smoothstep(0.38, 0.72, seasonalEdge + absLatitude * 0.56);
    surface = mix(surface, polarIce, iceCap);

    float reliefHeight =
      terrain * 0.35 +
      olympus * 1.4 -
      canyon * 1.2 -
      craterMask * 0.3 +
      fineDust * 0.08;
    vec3 normalWorld = perturbNormal(
      normalize(vWorldNormal),
      vWorldPosition,
      reliefHeight,
      0.006
    );
    vec3 sunDirection = normalize(uSunDirectionWorld);
    float ndotl = dot(normalWorld, sunDirection);
    float diffuse = smoothstep(-0.08, 1.0, ndotl);
    float forwardScatter = pow(max(dot(normalWorld, sunDirection), 0.0), 0.38) * 0.11;

    float dustHaze = smoothstep(0.34, 0.82, fineDust) * (1.0 - iceCap * 0.5);
    vec3 color = mix(surface, vec3(0.82, 0.48, 0.28), dustHaze * 0.14);
    color *= 0.04 + diffuse * 1.12 + forwardScatter;

    float atmosphere = pow(1.0 - max(dot(normalize(cameraPosition - vWorldPosition), normalWorld), 0.0), 2.3);
    color += vec3(0.80, 0.42, 0.24) * atmosphere * (0.055 + diffuse * 0.055);

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
