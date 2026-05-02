export const uranusVertexShader = /* glsl */ `
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

export const uranusFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3 uSunDirectionWorld;
  uniform vec3 uAxisWorld;
  uniform vec3 uPlanetCenterWorld;

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
    float amplitude = 0.52;
    for (int octave = 0; octave < 5; octave++) {
      value += amplitude * noise3(p);
      p *= 2.04;
      amplitude *= 0.48;
    }
    return value;
  }

  float wrappedDistance(float a, float b) {
    return atan(sin(a - b), cos(a - b));
  }

  void main() {
    vec3 shape = normalize(vShapePosition);
    float latitude = asin(clamp(shape.y, -1.0, 1.0));
    float longitude = atan(shape.z, shape.x);
    float absLatitude = abs(latitude) / 1.57079632679;

    float drift = uTime * 0.012;
    float broadNoise = fbm(vec3(longitude * 1.15 - drift, latitude * 5.2, shape.x * 1.5));
    float fineNoise = fbm(vec3(longitude * 4.4 + drift * 1.4, latitude * 17.0, shape.z * 2.0));
    float belt = 0.5 + 0.5 * sin(latitude * 13.0 + broadNoise * 1.45);
    float softJet = 0.5 + 0.5 * sin(latitude * 31.0 - fineNoise * 1.2);

    vec3 paleCyan = vec3(0.56, 0.84, 0.86);
    vec3 blueGreen = vec3(0.43, 0.74, 0.79);
    vec3 softMint = vec3(0.67, 0.91, 0.88);
    vec3 polarHaze = vec3(0.77, 0.96, 0.95);

    vec3 base = mix(blueGreen, paleCyan, 0.64);
    base = mix(base, softMint, smoothstep(0.34, 0.78, belt) * 0.16);
    base += vec3(0.018, 0.026, 0.024) * (softJet - 0.5);
    base *= 0.97 + fineNoise * 0.045;
    base = mix(base, polarHaze, smoothstep(0.66, 1.0, absLatitude) * 0.16);

    vec3 normalWorld = normalize(vWorldNormal);
    vec3 sunDirection = normalize(uSunDirectionWorld);
    vec3 fromCenter = normalize(vWorldPosition - uPlanetCenterWorld);
    vec3 axis = normalize(uAxisWorld);

    float seasonalPole = dot(fromCenter, axis) * sign(dot(axis, sunDirection));
    float polarCap = smoothstep(0.52, 0.88, seasonalPole) *
      smoothstep(0.12, 0.78, abs(dot(axis, sunDirection)));
    base = mix(base, vec3(0.82, 0.98, 0.96), polarCap * 0.24);

    float cloudSeed = fbm(vec3(longitude * 2.5 - drift * 2.0, latitude * 9.0, 3.1));
    float cloud1 =
      (1.0 - smoothstep(0.0, 0.13, abs(latitude - 0.42))) *
      (1.0 - smoothstep(0.0, 0.42, abs(wrappedDistance(longitude, 1.25 + cloudSeed * 0.15))));
    float cloud2 =
      (1.0 - smoothstep(0.0, 0.10, abs(latitude + 0.28))) *
      (1.0 - smoothstep(0.0, 0.35, abs(wrappedDistance(longitude, -1.8 + cloudSeed * 0.12))));
    float brightClouds = clamp(cloud1 * 0.08 + cloud2 * 0.06, 0.0, 0.1);
    base = mix(base, vec3(0.86, 1.0, 0.98), brightClouds);

    float ndotl = dot(normalWorld, sunDirection);
    float diffuse = smoothstep(-0.1, 1.0, ndotl);
    float forwardScatter = pow(max(dot(normalWorld, sunDirection), 0.0), 0.48) * 0.13;
    float methaneHaze = pow(1.0 - max(dot(normalize(cameraPosition - vWorldPosition), normalWorld), 0.0), 2.0);

    vec3 color = base * (0.04 + diffuse * 1.08 + forwardScatter);
    color += vec3(0.58, 0.88, 0.92) * methaneHaze * 0.12;

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const uranusRingVertexShader = /* glsl */ `
  varying vec3 vLocalPosition;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vLocalPosition = position;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const uranusRingFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uInnerRadius;
  uniform float uOuterRadius;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uPlanetRadius;
  uniform vec3 uColorInner;
  uniform vec3 uColorOuter;
  uniform vec3 uSunDirectionWorld;
  uniform vec3 uPlanetCenterWorld;

  varying vec3 vLocalPosition;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    float radius = length(vLocalPosition.xz);
    float angle = atan(vLocalPosition.z, vLocalPosition.x);
    float radialT = clamp((radius - uInnerRadius) / max(uOuterRadius - uInnerRadius, 0.0001), 0.0, 1.0);

    float edgeFade = smoothstep(0.0, 0.12, radialT) *
      (1.0 - smoothstep(0.88, 1.0, radialT));
    float filament = 0.74 +
      sin(radius * 950.0 + angle * 2.0 + uTime * 0.002) * 0.12 +
      hash21(vec2(floor(radius * 720.0), floor(angle * 160.0))) * 0.14;
    float alpha = uOpacity * edgeFade * clamp(filament, 0.18, 1.0);

    vec3 sunDirection = normalize(uSunDirectionWorld);
    vec3 normalWorld = normalize(vWorldNormal);
    float incidence = abs(dot(normalWorld, sunDirection));
    float illumination = 0.07 + 0.56 * smoothstep(0.02, 0.72, incidence);

    vec3 relativeToPlanet = vWorldPosition - uPlanetCenterWorld;
    float alongSun = dot(relativeToPlanet, sunDirection);
    float distanceFromSunLine = length(relativeToPlanet - alongSun * sunDirection);
    float antiSunSide = 1.0 - smoothstep(-0.08, 0.22, alongSun);
    float planetShadow = antiSunSide *
      (1.0 - smoothstep(uPlanetRadius * 0.84, uPlanetRadius * 1.12, distanceFromSunLine));

    vec3 color = mix(uColorInner, uColorOuter, radialT);
    color *= illumination * (0.78 + filament * 0.22) * (1.0 - planetShadow * 0.82);

    if (alpha < 0.003) {
      discard;
    }

    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
