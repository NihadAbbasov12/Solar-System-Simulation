export const mercuryVertexShader = /* glsl */ `
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

export const mercuryFragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uSolarIntensity;
  uniform vec3 uSunDirectionWorld;

  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vShapePosition;

  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  vec3 hash33(vec3 p) {
    return vec3(
      hash31(p + vec3(11.3, 0.0, 4.7)),
      hash31(p + vec3(2.1, 19.4, 7.8)),
      hash31(p + vec3(8.6, 5.2, 23.9))
    );
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
      p *= 2.13;
      amplitude *= 0.48;
    }
    return value;
  }

  float wrappedDistance(float a, float b) {
    return atan(sin(a - b), cos(a - b));
  }

  vec2 craterField(vec3 shape, float scale, float radius, float seed) {
    vec3 p = shape * scale;
    vec3 cell = floor(p);
    vec3 local = fract(p) - 0.5;
    float bowl = 0.0;
    float rim = 0.0;

    for (int xi = -1; xi <= 1; xi++) {
      for (int yi = -1; yi <= 1; yi++) {
        for (int zi = -1; zi <= 1; zi++) {
          vec3 neighbor = vec3(float(xi), float(yi), float(zi));
          vec3 id = cell + neighbor;
          vec3 offset = hash33(id + vec3(seed)) - 0.5;
          vec3 center = neighbor + offset * 0.74;
          float localRadius = radius * mix(0.55, 1.45, hash31(id + vec3(seed + 13.0)));
          float d = length(local - center);
          float thisBowl = 1.0 - smoothstep(localRadius * 0.34, localRadius * 0.92, d);
          float thisRim = 1.0 - smoothstep(localRadius * 0.06, localRadius * 0.19, abs(d - localRadius));
          bowl = max(bowl, thisBowl);
          rim = max(rim, thisRim);
        }
      }
    }

    return vec2(bowl, rim);
  }

  float basinMask(float longitude, float latitude, float basinLon, float basinLat, float lonRadius, float latRadius) {
    float dx = wrappedDistance(longitude, basinLon);
    float dy = latitude - basinLat;
    return (dx * dx) / lonRadius + (dy * dy) / latRadius;
  }

  void main() {
    vec3 shape = normalize(vShapePosition);
    float latitude = asin(clamp(shape.y, -1.0, 1.0));
    float longitude = atan(shape.z, shape.x);
    float absLatitude = abs(latitude) / 1.57079632679;

    float megaregolith = fbm(shape * 4.4 + vec3(0.4, -1.7, 2.1));
    float highlandTexture = fbm(shape * 14.0 + vec3(-0.8, 2.6, 1.2));
    float finePowder = fbm(shape * 55.0 + vec3(3.4, -0.6, 2.7));
    float smoothPlains = smoothstep(0.52, 0.82, fbm(shape * 2.7 + vec3(-2.2, 1.3, 0.1)));

    vec3 coldGray = vec3(0.34, 0.325, 0.305);
    vec3 warmRegolith = vec3(0.47, 0.405, 0.335);
    vec3 darkAncient = vec3(0.205, 0.195, 0.185);
    vec3 smoothBasalt = vec3(0.405, 0.375, 0.335);
    vec3 paleRays = vec3(0.72, 0.67, 0.56);
    vec3 hollowBright = vec3(0.82, 0.78, 0.64);

    vec3 surface = mix(darkAncient, warmRegolith, smoothstep(0.18, 0.82, megaregolith));
    surface = mix(surface, coldGray, smoothstep(0.34, 0.92, highlandTexture) * 0.46);
    surface = mix(surface, smoothBasalt, smoothPlains * 0.42);
    surface *= 0.9 + finePowder * 0.2;

    vec2 largeCraters = craterField(shape, 8.5, 0.28, 1.0);
    vec2 midCraters = craterField(shape, 20.0, 0.18, 8.0);
    vec2 smallCraters = craterField(shape, 48.0, 0.12, 21.0);
    float craterBowl = clamp(largeCraters.x * 0.72 + midCraters.x * 0.52 + smallCraters.x * 0.34, 0.0, 1.0);
    float craterRim = clamp(largeCraters.y * 0.72 + midCraters.y * 0.44 + smallCraters.y * 0.22, 0.0, 1.0);
    surface *= 1.0 - craterBowl * 0.31;
    surface = mix(surface, paleRays, craterRim * 0.22);

    float caloris = basinMask(longitude, latitude, 1.18, 0.16, 0.155, 0.105);
    float calorisFloor = 1.0 - smoothstep(0.0, 1.0, caloris);
    float calorisRim = 1.0 - smoothstep(0.022, 0.115, abs(caloris - 1.0));
    float calorisOuterRing = 1.0 - smoothstep(0.025, 0.15, abs(caloris - 1.72));
    surface = mix(surface, vec3(0.50, 0.46, 0.39), calorisFloor * 0.46);
    surface = mix(surface, vec3(0.62, 0.57, 0.48), calorisRim * 0.34);
    surface *= 1.0 - calorisOuterRing * 0.10;

    float rachmaninoff = basinMask(longitude, latitude, -2.08, 0.42, 0.012, 0.008);
    float rachFloor = 1.0 - smoothstep(0.0, 1.0, rachmaninoff);
    float rachRim = 1.0 - smoothstep(0.025, 0.12, abs(rachmaninoff - 1.0));
    surface = mix(surface, vec3(0.46, 0.43, 0.38), rachFloor * 0.54);
    surface = mix(surface, paleRays, rachRim * 0.36);

    float rayAngleA = abs(wrappedDistance(longitude + latitude * 0.48, -0.72));
    float rayAngleB = abs(wrappedDistance(longitude - latitude * 0.38, 2.52));
    float raySystem = smoothstep(0.026, 0.0, rayAngleA) * smoothstep(1.2, 0.06, abs(latitude + 0.18));
    raySystem += smoothstep(0.021, 0.0, rayAngleB) * smoothstep(1.05, 0.04, abs(latitude - 0.28));
    raySystem *= smoothstep(0.42, 0.92, finePowder);
    surface = mix(surface, paleRays, clamp(raySystem, 0.0, 1.0) * 0.32);

    float scarpA = smoothstep(0.032, 0.0, abs(latitude - (0.12 + sin(longitude * 2.4 + 0.7) * 0.05)));
    scarpA *= smoothstep(1.7, 0.16, abs(wrappedDistance(longitude, -0.18)));
    float scarpB = smoothstep(0.024, 0.0, abs(latitude - (-0.34 + sin(longitude * 3.1 - 1.2) * 0.035)));
    scarpB *= smoothstep(1.4, 0.12, abs(wrappedDistance(longitude, 2.1)));
    float scarps = clamp(scarpA + scarpB, 0.0, 1.0);
    surface *= 1.0 - scarps * 0.22;
    surface += vec3(0.07, 0.06, 0.045) * scarps * smoothstep(0.15, 0.8, highlandTexture);

    float hollowProvince = smoothstep(0.75, 0.06, length(vec2(wrappedDistance(longitude, 1.0), latitude - 0.22)));
    float hollows = hollowProvince * smoothstep(0.78, 0.94, fbm(shape * 74.0 + vec3(8.1, 1.4, -3.6)));
    surface = mix(surface, hollowBright, hollows * 0.42);

    float polarShadowNoise = fbm(vec3(longitude * 6.0, latitude * 18.0, 0.4));
    float polarCraterShadow = smoothstep(0.79, 0.98, absLatitude) * smoothstep(0.46, 0.82, polarShadowNoise);
    float polarIce = smoothstep(0.90, 0.995, absLatitude) * smoothstep(0.68, 0.92, 1.0 - polarShadowNoise);
    surface *= 1.0 - polarCraterShadow * 0.40;
    surface = mix(surface, vec3(0.78, 0.76, 0.70), polarIce * 0.22);

    vec3 normalWorld = normalize(vWorldNormal);
    vec3 sunDirection = normalize(uSunDirectionWorld);
    float ndotl = dot(normalWorld, sunDirection);
    float diffuse = max(ndotl, 0.0);
    float twilight = smoothstep(-0.035, 0.04, ndotl) * 0.035;
    float solarBoost = clamp((uSolarIntensity - 0.74) / 0.86, 0.0, 1.0);

    surface = mix(surface, vec3(0.78, 0.72, 0.62), solarBoost * diffuse * 0.14);

    float roughnessShade = mix(0.82, 1.08, highlandTexture);
    vec3 color = surface * roughnessShade * (0.012 + twilight + diffuse * mix(0.86, 1.32, solarBoost));

    float viewFacing = max(dot(normalize(cameraPosition - vWorldPosition), normalWorld), 0.0);
    float exosphereRim = pow(1.0 - viewFacing, 4.8) * smoothstep(-0.08, 0.45, ndotl);
    color += vec3(0.86, 0.66, 0.32) * exosphereRim * 0.015;

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
