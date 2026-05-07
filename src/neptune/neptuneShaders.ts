export const neptuneVertexShader = /* glsl */ `
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

export const neptuneFragmentShader = /* glsl */ `
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
      p *= 2.03;
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

    float drift = uTime * 0.026;
    float deepFlow = fbm(vec3(longitude * 1.35 - drift, latitude * 6.0, shape.x * 1.6));
    float fineFlow = fbm(vec3(longitude * 5.8 + drift * 1.9, latitude * 22.0, shape.z * 2.8));
    float streakFlow = fbm(vec3(longitude * 13.0 - drift * 3.2, latitude * 39.0, fineFlow * 2.0));

    float broadBand = 0.5 + 0.5 * sin(latitude * 14.0 + deepFlow * 1.55);
    float narrowJet = 0.5 + 0.5 * sin(latitude * 38.0 - fineFlow * 1.35);

    vec3 deepBlue = vec3(0.105, 0.265, 0.405);
    vec3 methaneBlue = vec3(0.185, 0.425, 0.565);
    vec3 blueCyan = vec3(0.245, 0.565, 0.675);
    vec3 highHaze = vec3(0.48, 0.78, 0.80);

    vec3 base = mix(deepBlue, methaneBlue, 0.70);
    base = mix(base, blueCyan, smoothstep(0.22, 0.82, broadBand) * 0.30);
    base += vec3(0.020, 0.040, 0.046) * (narrowJet - 0.5);
    base *= 0.91 + fineFlow * 0.12;
    base = mix(base, highHaze, smoothstep(0.66, 1.0, absLatitude) * 0.12);

    float southSpotLon = 0.95 + sin(uTime * 0.004) * 0.22;
    float spotDx = wrappedDistance(longitude, southSpotLon);
    float spotDy = latitude + 0.38;
    float spotEllipse = (spotDx * spotDx) / 0.11 + (spotDy * spotDy) / 0.018;
    float darkVortex = 1.0 - smoothstep(0.55, 1.35, spotEllipse + fineFlow * 0.18);
    vec3 vortexColor = vec3(0.030, 0.090, 0.150);
    base = mix(base, vortexColor, darkVortex * 0.58);

    float methaneCloud1 =
      (1.0 - smoothstep(0.0, 0.055, abs(latitude - 0.48))) *
      (1.0 - smoothstep(0.0, 0.46, abs(wrappedDistance(longitude, -1.5 + deepFlow * 0.18))));
    float methaneCloud2 =
      (1.0 - smoothstep(0.0, 0.070, abs(latitude + 0.28))) *
      (1.0 - smoothstep(0.0, 0.38, abs(wrappedDistance(longitude, southSpotLon + 0.36))));
    float methaneCloud3 =
      (1.0 - smoothstep(0.0, 0.050, abs(latitude - 0.08))) *
      (1.0 - smoothstep(0.0, 0.28, abs(wrappedDistance(longitude, 2.35 - streakFlow * 0.12))));
    float brightClouds = clamp(
      methaneCloud1 * 0.22 + methaneCloud2 * 0.24 + methaneCloud3 * 0.10,
      0.0,
      0.24
    );
    base = mix(base, vec3(0.78, 0.96, 0.96), brightClouds);

    vec3 normalWorld = normalize(vWorldNormal);
    vec3 sunDirection = normalize(uSunDirectionWorld);
    vec3 fromCenter = normalize(vWorldPosition - uPlanetCenterWorld);
    vec3 axis = normalize(uAxisWorld);

    float seasonalPole = dot(fromCenter, axis) * sign(dot(axis, sunDirection));
    float polarHaze = smoothstep(0.55, 0.90, seasonalPole) *
      smoothstep(0.06, 0.76, abs(dot(axis, sunDirection)));
    base = mix(base, vec3(0.53, 0.82, 0.82), polarHaze * 0.13);

    float ndotl = dot(normalWorld, sunDirection);
    float diffuse = smoothstep(-0.12, 1.0, ndotl);
    float forwardScatter = pow(max(dot(normalWorld, sunDirection), 0.0), 0.46) * 0.12;
    float rim = pow(
      1.0 - max(dot(normalize(cameraPosition - vWorldPosition), normalWorld), 0.0),
      2.15
    );

    vec3 color = base * (0.035 + diffuse * 1.04 + forwardScatter);
    color += vec3(0.28, 0.60, 0.68) * rim * 0.105;

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const neptuneRingVertexShader = /* glsl */ `
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

export const neptuneRingFragmentShader = /* glsl */ `
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
    p = fract(p * vec2(121.31, 417.17));
    p += dot(p, p + 39.73);
    return fract(p.x * p.y);
  }

  void main() {
    float radius = length(vLocalPosition.xz);
    float angle = atan(vLocalPosition.z, vLocalPosition.x);
    float radialT = clamp((radius - uInnerRadius) / max(uOuterRadius - uInnerRadius, 0.0001), 0.0, 1.0);

    float edgeFade = smoothstep(0.0, 0.14, radialT) *
      (1.0 - smoothstep(0.86, 1.0, radialT));
    float clump =
      0.55 +
      sin(radius * 820.0 + angle * 4.0 + uTime * 0.003) * 0.15 +
      hash21(vec2(floor(radius * 520.0), floor(angle * 190.0))) * 0.22;
    float alpha = uOpacity * edgeFade * clamp(clump, 0.10, 1.0);

    vec3 sunDirection = normalize(uSunDirectionWorld);
    vec3 normalWorld = normalize(vWorldNormal);
    float incidence = abs(dot(normalWorld, sunDirection));
    float illumination = 0.045 + 0.44 * smoothstep(0.02, 0.72, incidence);

    vec3 relativeToPlanet = vWorldPosition - uPlanetCenterWorld;
    float alongSun = dot(relativeToPlanet, sunDirection);
    float distanceFromSunLine = length(relativeToPlanet - alongSun * sunDirection);
    float antiSunSide = 1.0 - smoothstep(-0.08, 0.22, alongSun);
    float planetShadow = antiSunSide *
      (1.0 - smoothstep(uPlanetRadius * 0.82, uPlanetRadius * 1.10, distanceFromSunLine));

    vec3 color = mix(uColorInner, uColorOuter, radialT);
    color *= illumination * (0.70 + clump * 0.30) * (1.0 - planetShadow * 0.84);

    if (alpha < 0.0025) {
      discard;
    }

    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
