export const jupiterVertexShader = /* glsl */ `
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

export const jupiterFragmentShader = /* glsl */ `
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
      p *= 2.07;
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

    float cloudDrift = uTime * 0.035;
    float broadNoise = fbm(vec3(longitude * 1.8 + cloudDrift, latitude * 6.2, shape.x * 2.0));
    float fineNoise = fbm(vec3(longitude * 7.5 - cloudDrift * 1.8, latitude * 33.0, shape.z * 3.5));
    float filamentNoise = fbm(vec3(longitude * 18.0 + cloudDrift * 3.0, latitude * 44.0, fineNoise * 2.0));

    float beltWave = 0.5 + 0.5 * sin(latitude * 38.0 + broadNoise * 3.4);
    float jetWave = 0.5 + 0.5 * sin(latitude * 85.0 - fineNoise * 2.1);
    float beltMask = smoothstep(0.48, 0.74, beltWave);
    float brightZoneMask = smoothstep(0.18, 0.72, 1.0 - beltWave);

    vec3 ammoniaWhite = vec3(0.94, 0.88, 0.74);
    vec3 cream = vec3(0.78, 0.66, 0.48);
    vec3 ochre = vec3(0.72, 0.48, 0.25);
    vec3 rust = vec3(0.52, 0.25, 0.15);
    vec3 polarHaze = vec3(0.72, 0.77, 0.74);

    vec3 base = mix(cream, ammoniaWhite, brightZoneMask * 0.72);
    base = mix(base, ochre, beltMask * (0.56 + fineNoise * 0.2));
    base = mix(base, rust, smoothstep(0.72, 1.0, beltWave) * 0.34);
    base += vec3(0.08, 0.05, 0.02) * (jetWave - 0.5);
    base *= 0.86 + filamentNoise * 0.22;
    base = mix(base, polarHaze, smoothstep(0.63, 1.0, absLatitude) * 0.34);

    float grsLat = -0.39;
    float grsLon = 1.48;
    float grsDx = wrappedDistance(longitude, grsLon);
    float grsDy = latitude - grsLat;
    float grsEllipse = (grsDx * grsDx) / 0.24 + (grsDy * grsDy) / 0.030;
    float grsCore = 1.0 - smoothstep(0.5, 1.0, grsEllipse + fineNoise * 0.14);
    float grsOuter = 1.0 - smoothstep(1.0, 2.15, grsEllipse + broadNoise * 0.12);
    vec3 grsColor = mix(vec3(0.94, 0.53, 0.27), vec3(0.64, 0.20, 0.12), fineNoise);
    base = mix(base, grsColor, clamp(grsOuter * 0.78 + grsCore * 0.42, 0.0, 0.92));
    base += vec3(0.16, 0.09, 0.03) * grsCore;

    vec3 normalWorld = normalize(vWorldNormal);
    vec3 sunDirection = normalize(uSunDirectionWorld);
    float ndotl = dot(normalWorld, sunDirection);
    float diffuse = smoothstep(-0.09, 1.0, ndotl);
    float forwardScatter = pow(max(dot(normalWorld, sunDirection), 0.0), 0.42) * 0.16;

    vec3 fromCenter = normalize(vWorldPosition - uPlanetCenterWorld);
    vec3 axis = normalize(uAxisWorld);
    float equatorialHaze = 1.0 - smoothstep(0.04, 0.22, abs(dot(fromCenter, axis)));
    base += vec3(0.06, 0.05, 0.035) * equatorialHaze;

    vec3 color = base * (0.035 + diffuse * 1.12 + forwardScatter);
    float rim = pow(1.0 - max(dot(normalize(cameraPosition - vWorldPosition), normalWorld), 0.0), 2.2);
    color += vec3(0.52, 0.63, 0.68) * rim * 0.07;

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
