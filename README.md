# Interactive Solar System Simulation

A Vite + TypeScript + Three.js/WebGL simulation with physically inspired
Keplerian orbits, oblate planet geometry, axial tilt, procedural atmospheres,
rings, major moons, shadows, time controls, and debug overlays.

## Run

```bash
npm install
npm run dev
```

Build and validation:

```bash
npm run build
npm test
```

## Data Used

Saturn constants are stored in `src/saturn/saturnConstants.ts`.
Jupiter constants are stored in `src/jupiter/jupiterConstants.ts`.

- Mean radius: 58,232 km
- Equatorial radius: 60,268 km
- Polar radius: 54,364 km
- Mass: 5.683e26 kg
- Rotation period: 10.656 hours
- Axial tilt: 26.73 deg
- Mean density: 0.687 g/cm^3
- Main atmosphere: hydrogen and helium
- Semi-major axis: 9.539 AU
- Orbital eccentricity: 0.0565
- Orbital period: 29.457 Earth years
- Orbital inclination: 2.485 deg
- Mean orbital velocity: 9.69 km/s

Jupiter uses the Juno-era shape values and the March 2026 recognized satellite
count used in the project data review:

- Mean radius: 69,904.5 km
- Equatorial radius: 71,488 km
- Polar radius: 66,842 km
- Mass: 1.898125e27 kg
- Rotation period: 9.925 hours
- Axial tilt: 3.13 deg
- Mean density: 1.3262 g/cm^3
- Main atmosphere: hydrogen and helium
- Officially recognized moons at epoch 2026-03-31: 101
- Semi-major axis: 5.202887 AU
- Orbital eccentricity: 0.04838624
- Orbital period: 11.862615 Earth years
- Orbital inclination: 1.30439695 deg
- Mean orbital velocity: 13.0637 km/s

The rendered Jupiter system includes the faint halo, main, Amalthea gossamer,
and Thebe gossamer dust rings, plus Io, Europa, Ganymede, and Callisto using
JPL mean semimajor axes, periods, inclinations, radii, and J2000 mean anomalies.
The full recognized-moon count is retained as data, while only the Galilean
moons are rendered as inspectable bodies.

Ring regions are implemented as separate D, C, B, A, F, G, and E bands using
approximate radial extents from Saturn's center. The Cassini Division is visible
because there is a real gap between the B and A ring meshes. The A ring also has
a procedural dark gap approximating the Encke region.

## Physical Model

The simulation separates physics from rendering:

- `src/physics/keplerSolver.ts` solves Kepler's equation:
  - mean anomaly
  - eccentric anomaly
  - true anomaly
  - radius from the focus
- `src/physics/orbitalMechanics.ts` converts the Kepler solution into an
  inclined elliptical orbit with the Sun at one focus.
- `src/physics/timeController.ts` manages pause, reset, real-time mode, and
  accelerated time.
- `src/saturn/Saturn.ts` and `src/jupiter/Jupiter.ts` apply orbital motion to
  each planet group and local spin to the planet mesh independently.

Saturn's current rendered phase is an approximate J2000 setup, not a precision
SPICE/JPL ephemeris. The orbit shape, period, eccentricity, inclination, axial
tilt, and spin period use the constants above.

## Scaling

Real solar system distances cannot be rendered directly with a visible Saturn
and useful camera controls, so the project uses two explicit scales:

- Orbit scale: `1 AU = 18 scene units`
- Local Saturn scale: `1 Saturn equatorial radius = 1 scene unit`
- Local Jupiter scale: `1 Jupiter equatorial radius = 1.18 scene units`

At the orbit scale, Saturn's real equatorial radius would be about 0.00725 scene
units, which is too small to inspect. The planet and rings are therefore
magnified relative to the orbit. Physics calculations stay in real units
(seconds, kilometers, AU); only final rendering positions are converted to scene
units.

## Visual Approximations

Physically grounded:

- Saturn is an oblate spheroid using equatorial and polar radius ratio.
- Saturn rotates around its own tilted local axis.
- Rings sit in Saturn's tilted equatorial plane.
- Orbital position is elliptical and Keplerian.
- The Sun is located at the orbital focus.

Approximated for real-time WebGL:

- Atmosphere bands are procedural GLSL noise, not spacecraft imagery.
- Ring density and icy grain structure are procedural shaders and particles.
- Jupiter's Great Red Spot is a procedural, longitude-locked visual feature,
  not a live meteorological data product.
- Ring shadows are shader approximations plus Three.js shadow flags where
  practical.
- Sun size and light intensity are visually scaled for readability.
- Starfield is procedural and not a catalog sky map.

## Controls

- Pause/Resume
- Real Time
- Reset
- Focus Sun / Focus Saturn / Focus Jupiter / Focus Earth
- Debug mode
- Logarithmic simulation speed slider from 1x to 1e8x
- OrbitControls camera navigation with mouse, trackpad, or touch

Debug mode shows the tilted axis vector, orbital path, simulated date/time,
orbital angle, mean anomaly, distance from Sun, rotation speed, speed multiplier,
and Kepler iteration count.

## Audit Checklist

- Saturn rotates around its own tilted axis.
- Saturn is visibly oblate.
- Rings are tilted with the planet.
- Rings have multiple bands and gaps.
- Orbit is elliptical using Keplerian logic.
- Time acceleration, pause, and reset work.
- Constants are stored separately.
- Physics logic is separate from rendering logic.
- Kepler solver has unit tests.
