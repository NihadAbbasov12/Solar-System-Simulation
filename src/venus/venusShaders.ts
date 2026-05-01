export const venusVertexShader = /* glsl */ `
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

export const venusFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uCloudLongitudeOffset;
  uniform float uRadarBlend;
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
    float amplitude = 0.52;
    for (int octave = 0; octave < 5; octave++) {
      value += amplitude * noise3(p);
      p *= 2.09;
      amplitude *= 0.49;
    }
    return value;
  }

  float wrappedDistance(float a, float b) {
    return atan(sin(a - b), cos(a - b));
  }

  float ellipseMask(float longitude, float latitude, float centerLon, float centerLat, float lonRadius, float latRadius) {
    float dx = wrappedDistance(longitude, centerLon);
    float dy = latitude - centerLat;
    return 1.0 - smoothstep(0.72, 1.0, (dx * dx) / lonRadius + (dy * dy) / latRadius);
  }

  float ringMask(float longitude, float latitude, float centerLon, float centerLat, float radius, float width) {
    float dx = wrappedDistance(longitude, centerLon);
    float dy = latitude - centerLat;
    float distanceToCenter = sqrt(dx * dx + dy * dy);
    return 1.0 - smoothstep(width * 0.42, width, abs(distanceToCenter - radius));
  }

  vec3 visibleCloudColor(vec3 shape, float latitude, float longitude, float diffuse, float rim, float forwardScatter) {
    float cloudLongitude = longitude + uCloudLongitudeOffset;
    float broadFlow = fbm(vec3(cloudLongitude * 1.25, latitude * 4.2, shape.x * 2.0));
    float shearFlow = fbm(vec3(
      cloudLongitude * 3.9 + uTime * 0.09,
      latitude * 10.5,
      broadFlow * 3.0
    ));
    float fineAcid = fbm(vec3(
      cloudLongitude * 11.0 - uTime * 0.22,
      latitude * 25.0,
      shape.z * 2.2
    ));

    float banding =
      0.5 +
      0.5 * sin(latitude * 13.0 + broadFlow * 3.4 + sin(cloudLongitude * 2.0) * 0.55);
    float superRotationStreak =
      smoothstep(0.48, 0.88, shearFlow + banding * 0.18) *
      (1.0 - smoothstep(0.72, 0.96, abs(latitude) / 1.57079632679));
    float uvDarkStreak =
      smoothstep(0.60, 0.88, fineAcid + banding * 0.12) *
      smoothstep(0.05, 0.62, abs(latitude) / 1.57079632679);
    float polarCollar = smoothstep(0.58, 0.88, abs(latitude) / 1.57079632679);

    vec3 cloudWhite = vec3(0.94, 0.90, 0.78);
    vec3 sulfurCream = vec3(0.82, 0.72, 0.50);
    vec3 paleYellow = vec3(0.98, 0.88, 0.62);
    vec3 uvAbsorber = vec3(0.55, 0.47, 0.34);
    vec3 polarHaze = vec3(0.88, 0.84, 0.71);

    vec3 clouds = mix(sulfurCream, cloudWhite, smoothstep(0.25, 0.86, broadFlow));
    clouds = mix(clouds, paleYellow, superRotationStreak * 0.18);
    clouds = mix(clouds, uvAbsorber, uvDarkStreak * 0.18);
    clouds = mix(clouds, polarHaze, polarCollar * 0.25);
    clouds *= 0.96 + fineAcid * 0.06;

    float softTerminator = smoothstep(-0.34, 1.0, diffuse);
    vec3 color = clouds * (0.16 + softTerminator * 1.03 + forwardScatter * 0.26);
    color += vec3(0.96, 0.87, 0.66) * rim * (0.18 + softTerminator * 0.08);
    return color;
  }

  vec3 radarTopographyColor(vec3 shape, float latitude, float longitude, float diffuse, float rim) {
    float plains = fbm(shape * 4.2 + vec3(1.7, -0.6, 0.3));
    float tesseraTexture = fbm(shape * 23.0 + vec3(-2.5, 3.1, 0.8));
    float domeTexture = fbm(shape * 44.0 + vec3(0.4, -1.8, 4.2));

    float ishtar = ellipseMask(longitude, latitude, -2.12, 1.02, 0.23, 0.035);
    float aphrodite =
      ellipseMask(longitude, latitude, 0.68, -0.08, 0.62, 0.052) +
      ellipseMask(longitude, latitude, 1.45, -0.15, 0.34, 0.035);
    aphrodite = clamp(aphrodite, 0.0, 1.0);
    float maxwell = ellipseMask(longitude, latitude, -1.88, 1.10, 0.018, 0.006);

    float coronae =
      ringMask(longitude, latitude, -0.52, 0.34, 0.19, 0.035) +
      ringMask(longitude, latitude, 2.34, -0.28, 0.17, 0.03) +
      ringMask(longitude, latitude, 0.18, -0.55, 0.14, 0.028);
    coronae = clamp(coronae, 0.0, 1.0);

    float riftA = smoothstep(0.030, 0.0, abs(latitude - (-0.20 + sin(longitude * 2.2) * 0.055)));
    riftA *= smoothstep(1.25, 0.18, abs(wrappedDistance(longitude, 1.15)));
    float riftB = smoothstep(0.025, 0.0, abs(latitude - (0.42 + sin(longitude * 3.0) * 0.035)));
    riftB *= smoothstep(1.05, 0.14, abs(wrappedDistance(longitude, -1.05)));
    float rifts = clamp(riftA + riftB, 0.0, 1.0);

    float volcanicDomes = smoothstep(0.82, 0.96, domeTexture) * (1.0 - max(ishtar, aphrodite) * 0.35);
    float tesserae = smoothstep(0.52, 0.88, tesseraTexture) * clamp(ishtar + aphrodite * 0.72, 0.0, 1.0);

    float elevation =
      plains * 0.24 +
      ishtar * 0.42 +
      aphrodite * 0.34 +
      maxwell * 0.42 +
      coronae * 0.16 +
      tesserae * 0.18 +
      volcanicDomes * 0.10 -
      rifts * 0.15;
    elevation = clamp(elevation, 0.0, 1.0);

    vec3 lowRadar = vec3(0.18, 0.13, 0.10);
    vec3 plainsRadar = vec3(0.48, 0.32, 0.18);
    vec3 highRadar = vec3(0.88, 0.69, 0.38);
    vec3 tesseraRadar = vec3(0.96, 0.84, 0.56);
    vec3 riftRadar = vec3(0.10, 0.08, 0.07);

    vec3 radar = mix(lowRadar, plainsRadar, smoothstep(0.08, 0.48, elevation));
    radar = mix(radar, highRadar, smoothstep(0.48, 0.88, elevation));
    radar = mix(radar, tesseraRadar, tesserae * 0.48 + maxwell * 0.55);
    radar = mix(radar, riftRadar, rifts * 0.55);

    float shadedRelief = 0.54 + diffuse * 0.46 + rim * 0.05;
    return radar * shadedRelief;
  }

  void main() {
    vec3 shape = normalize(vShapePosition);
    float latitude = asin(clamp(shape.y, -1.0, 1.0));
    float longitude = atan(shape.z, shape.x);

    vec3 normalWorld = normalize(vWorldNormal);
    vec3 sunDirection = normalize(uSunDirectionWorld);
    float ndotl = dot(normalWorld, sunDirection);
    float diffuse = max(ndotl, 0.0);
    float forwardScatter = pow(max(ndotl, 0.0), 0.38);
    float rim = pow(1.0 - max(dot(normalize(cameraPosition - vWorldPosition), normalWorld), 0.0), 2.15);

    vec3 visibleColor = visibleCloudColor(shape, latitude, longitude, diffuse, rim, forwardScatter);
    vec3 radarColor = radarTopographyColor(shape, latitude, longitude, diffuse, rim);
    vec3 color = mix(visibleColor, radarColor, smoothstep(0.0, 1.0, uRadarBlend));

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
