export const earthVertexShader = /* glsl */ `
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

export const earthFragmentShader = /* glsl */ `
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
      p *= 2.08;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec3 shape = normalize(vShapePosition);
    float latitude = asin(clamp(shape.y, -1.0, 1.0));
    float longitude = atan(shape.z, shape.x);
    float absLatitude = abs(latitude) / 1.57079632679;

    float continentalNoise = fbm(shape * 2.35 + vec3(0.18, -0.42, 0.73));
    float shelfNoise = fbm(shape * 7.4 + vec3(1.7, 0.21, -1.4));
    float longitudinalBias =
      0.09 * sin(longitude * 2.0 - 0.7) +
      0.06 * sin(longitude * 4.7 + latitude * 3.1);
    float landValue =
      continentalNoise * 0.76 +
      shelfNoise * 0.24 +
      longitudinalBias -
      absLatitude * 0.07;
    float landMask = smoothstep(0.50, 0.58, landValue);

    float highlandNoise = fbm(shape * 15.0 + vec3(-0.8, 1.9, 0.3));
    float mountainMask = landMask * smoothstep(0.58, 0.9, highlandNoise);
    float desertLatitude =
      smoothstep(0.17, 0.32, absLatitude) *
      (1.0 - smoothstep(0.43, 0.62, absLatitude));
    float desertMask =
      landMask *
      desertLatitude *
      smoothstep(0.46, 0.72, fbm(shape * 5.2 + vec3(2.4, -0.2, 0.8)));

    vec3 deepOcean = vec3(0.025, 0.12, 0.33);
    vec3 openOcean = vec3(0.03, 0.25, 0.52);
    vec3 shallowOcean = vec3(0.08, 0.42, 0.58);
    vec3 forest = vec3(0.12, 0.31, 0.17);
    vec3 grassland = vec3(0.38, 0.47, 0.22);
    vec3 desert = vec3(0.73, 0.58, 0.34);
    vec3 mountain = vec3(0.48, 0.43, 0.37);
    vec3 ice = vec3(0.92, 0.96, 0.95);

    float bathymetry = smoothstep(0.18, 0.88, shelfNoise);
    vec3 ocean = mix(deepOcean, openOcean, bathymetry);
    ocean = mix(ocean, shallowOcean, (1.0 - landMask) * smoothstep(0.46, 0.56, landValue));

    vec3 land = mix(forest, grassland, smoothstep(0.34, 0.68, shelfNoise));
    land = mix(land, desert, desertMask);
    land = mix(land, mountain, mountainMask * 0.72);

    float polarIce = smoothstep(0.72, 0.9, absLatitude);
    float alpineIce = mountainMask * smoothstep(0.76, 0.95, highlandNoise) * 0.28;
    vec3 surface = mix(ocean, land, landMask);
    surface = mix(surface, ice, max(polarIce, alpineIce));

    float weatherDrift = uTime * 0.035;
    float cloudNoise = fbm(vec3(
      shape.x * 4.2 + weatherDrift,
      shape.y * 2.6,
      shape.z * 4.2 - weatherDrift * 0.8
    ));
    float stormBand = 0.5 + 0.5 * sin(latitude * 12.0 + cloudNoise * 5.0 + weatherDrift * 2.4);
    float cloudMask =
      smoothstep(0.56, 0.79, cloudNoise + stormBand * 0.18) *
      (1.0 - polarIce * 0.28);
    vec3 cloud = vec3(0.92, 0.95, 0.94);

    vec3 normalWorld = normalize(vWorldNormal);
    vec3 sunDirection = normalize(uSunDirectionWorld);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float ndotl = dot(normalWorld, sunDirection);
    float diffuse = smoothstep(-0.08, 1.0, ndotl);
    float forwardScatter = pow(max(ndotl, 0.0), 0.28) * 0.14;

    // Clouds shade the ground beneath them before brightening the view.
    vec3 shadedSurface = surface * (1.0 - cloudMask * 0.30);
    vec3 color = mix(shadedSurface, cloud, cloudMask * 0.58);
    color *= 0.045 + diffuse * 1.08 + forwardScatter;

    // Sun glint mirrors off open water but never off land, ice or cloud.
    vec3 halfVector = normalize(sunDirection + viewDirection);
    float glint = pow(max(dot(normalWorld, halfVector), 0.0), 140.0);
    float iceMask = max(polarIce, alpineIce);
    float waterMask = (1.0 - landMask) * (1.0 - iceMask) * (1.0 - cloudMask);
    color += vec3(1.25, 1.1, 0.9) * glint * waterMask * diffuse * 0.85;

    // City lights trace coastlines and lowland clusters on the night side.
    float night = smoothstep(0.05, -0.18, ndotl);
    float lowland = landMask * (1.0 - mountainMask) * (1.0 - iceMask);
    float coastal =
      smoothstep(0.50, 0.565, landValue) *
      (1.0 - smoothstep(0.60, 0.72, landValue));
    float cityClusters = smoothstep(0.55, 0.85, fbm(shape * 9.5 + vec3(4.7, 1.3, -2.9)));
    float cityMask =
      lowland *
      cityClusters *
      (0.35 + 0.65 * coastal) *
      (1.0 - cloudMask * 0.85) *
      (1.0 - desertMask * 0.6);
    color += vec3(1.0, 0.72, 0.38) * cityMask * night * 0.55;

    // Low-angle light reddens along the day/night terminator.
    float terminator = exp(-ndotl * ndotl * 36.0);
    color += vec3(0.55, 0.22, 0.06) * terminator * diffuse * 0.16;

    float atmosphere = pow(1.0 - max(dot(viewDirection, normalWorld), 0.0), 2.2);
    color += vec3(0.27, 0.55, 0.78) * atmosphere * (0.11 + diffuse * 0.12);

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const moonVertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  varying vec3 vShapePosition;

  void main() {
    vShapePosition = normalize(position);

    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const moonFragmentShader = /* glsl */ `
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
    for (int octave = 0; octave < 4; octave++) {
      value += amplitude * noise3(p);
      p *= 2.15;
      amplitude *= 0.5;
    }
    return value;
  }

  // Schueler screen-space bump mapping: perturbs the shading normal from a
  // procedural height field so crater relief catches directional sunlight.
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
    float maria = smoothstep(0.42, 0.72, fbm(shape * 3.4 + vec3(0.6, -0.2, 1.1)));
    float crater = smoothstep(0.72, 0.94, fbm(shape * 18.0 + vec3(-1.0, 0.5, 0.2)));
    float grain = fbm(shape * 42.0 + uTime * 0.001);

    vec3 highlands = vec3(0.58, 0.56, 0.52);
    vec3 basalt = vec3(0.34, 0.34, 0.35);
    vec3 color = mix(highlands, basalt, maria * 0.72);
    color *= 0.78 + grain * 0.22 - crater * 0.2;

    float reliefHeight = -crater * 0.6 - maria * 0.12 + grain * 0.1;
    vec3 normalWorld = perturbNormal(
      normalize(vWorldNormal),
      vWorldPosition,
      reliefHeight,
      0.01
    );
    vec3 sunDirection = normalize(uSunDirectionWorld);
    float diffuse = smoothstep(-0.04, 1.0, dot(normalWorld, sunDirection));
    float rim = pow(1.0 - max(dot(normalize(cameraPosition - vWorldPosition), normalWorld), 0.0), 2.2);

    color *= 0.035 + diffuse * 1.05;
    color += vec3(0.34, 0.39, 0.44) * rim * 0.04;

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
