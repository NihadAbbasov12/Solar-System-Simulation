export const saturnVertexShader = /* glsl */ `
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

export const saturnFragmentShader = /* glsl */ `
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

    float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
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
      p *= 2.13;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec3 shape = normalize(vShapePosition);
    float latitude = asin(clamp(shape.y, -1.0, 1.0));
    float longitude = atan(shape.z, shape.x);
    float absLatitude = abs(latitude) / 1.57079632679;

    float cloudDrift = uTime * 0.018;
    float broadNoise = fbm(vec3(longitude * 1.4 + cloudDrift, latitude * 8.0, shape.x * 2.0));
    float fineNoise = fbm(vec3(longitude * 5.0 - cloudDrift * 1.7, latitude * 24.0, shape.z * 3.0));
    float belt = 0.5 + 0.5 * sin(latitude * 31.0 + broadNoise * 2.9);
    float softBelt = 0.5 + 0.5 * sin(latitude * 12.0 - fineNoise * 1.6);

    vec3 cream = vec3(0.92, 0.82, 0.61);
    vec3 paleGold = vec3(0.78, 0.66, 0.45);
    vec3 tan = vec3(0.57, 0.45, 0.31);
    vec3 coolHaze = vec3(0.77, 0.78, 0.71);

    vec3 base = mix(cream, paleGold, smoothstep(0.25, 0.9, belt));
    base = mix(base, tan, smoothstep(0.52, 0.9, softBelt) * 0.34);
    base = mix(base, coolHaze, smoothstep(0.7, 1.0, absLatitude) * 0.26);
    base *= 0.92 + fineNoise * 0.12;

    float equatorialHaze = 1.0 - smoothstep(0.05, 0.42, abs(latitude));
    base += vec3(0.08, 0.07, 0.04) * equatorialHaze;
    base *= mix(1.0, 0.68, smoothstep(0.68, 1.0, absLatitude));

    vec3 normalWorld = normalize(vWorldNormal);
    vec3 sunDirection = normalize(uSunDirectionWorld);
    float ndotl = dot(normalWorld, sunDirection);
    float diffuse = smoothstep(-0.08, 1.0, ndotl);
    float forwardScatter = pow(max(dot(normalWorld, sunDirection), 0.0), 0.35) * 0.18;

    vec3 fromCenter = normalize(vWorldPosition - uPlanetCenterWorld);
    vec3 axis = normalize(uAxisWorld);
    float equatorDistance = abs(dot(fromCenter, axis));
    float sunNearRingPlane = 1.0 - abs(dot(sunDirection, axis));
    float ringShadowBand = 1.0 - smoothstep(0.025, 0.13, equatorDistance);
    float litSide = smoothstep(-0.05, 0.25, ndotl);
    float approximateRingShadow = ringShadowBand * litSide * (0.22 + 0.5 * sunNearRingPlane);

    base *= 1.0 - approximateRingShadow * 0.42;

    vec3 color = base * (0.035 + diffuse * 1.12 + forwardScatter);
    float rim = pow(1.0 - max(dot(normalize(cameraPosition - vWorldPosition), normalWorld), 0.0), 2.4);
    color += vec3(0.35, 0.42, 0.5) * rim * 0.08;

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const ringVertexShader = /* glsl */ `
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

export const ringFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uInnerRadius;
  uniform float uOuterRadius;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uGapRadius;
  uniform float uGapWidth;
  uniform float uGapDepth;
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

  float stripeNoise(float radius, float angle) {
    float fine = sin(radius * 280.0 + angle * 4.0);
    float medium = sin(radius * 73.0 - angle * 1.7);
    float granular = hash21(vec2(floor(radius * 520.0), floor(angle * 180.0)));
    return 0.55 + fine * 0.16 + medium * 0.12 + granular * 0.17;
  }

  void main() {
    float radius = length(vLocalPosition.xz);
    float angle = atan(vLocalPosition.z, vLocalPosition.x);
    float radialT = clamp((radius - uInnerRadius) / max(uOuterRadius - uInnerRadius, 0.0001), 0.0, 1.0);

    float edgeFade = smoothstep(0.0, 0.035, radialT) * (1.0 - smoothstep(0.965, 1.0, radialT));
    float density = stripeNoise(radius, angle + uTime * 0.003);
    float alpha = uOpacity * edgeFade * clamp(density, 0.18, 1.0);

    if (uGapWidth > 0.0) {
      float gapDistance = abs(radius - uGapRadius);
      float gapMask = 1.0 - smoothstep(uGapWidth * 0.5, uGapWidth * 1.6, gapDistance);
      alpha *= 1.0 - gapMask * uGapDepth;
    }

    vec3 sunDirection = normalize(uSunDirectionWorld);
    vec3 normalWorld = normalize(vWorldNormal);
    float incidence = abs(dot(normalWorld, sunDirection));
    float illumination = 0.16 + 0.92 * smoothstep(0.02, 0.65, incidence);

    vec3 relativeToPlanet = vWorldPosition - uPlanetCenterWorld;
    float alongSun = dot(relativeToPlanet, sunDirection);
    float distanceFromSunLine = length(relativeToPlanet - alongSun * sunDirection);
    float antiSunSide = 1.0 - smoothstep(-0.15, 0.2, alongSun);
    float planetShadow = antiSunSide * (1.0 - smoothstep(uPlanetRadius * 0.86, uPlanetRadius * 1.18, distanceFromSunLine));

    vec3 color = mix(uColorInner, uColorOuter, radialT);
    color *= 0.82 + density * 0.28;
    color *= illumination * (1.0 - planetShadow * 0.86);

    if (alpha < 0.004) {
      discard;
    }

    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
