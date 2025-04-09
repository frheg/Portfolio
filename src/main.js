import * as THREE from '../node_modules/.vite/deps/three.js';
import { createGalaxy, animateGalaxies } from '../src/galaxyModule.js';

// =========================
// Constants & Scene Setup
// =========================

const CAMERA_POSITION = new THREE.Vector3(0, 0, 150); // Initial offset for better perspective
const STAR_COUNT = 7000;
const STAR_FIELD_RADIUS = 700;
const STAR_ROTATION_SPEED = 0.005;

const GALAXY_COUNT = 20;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.copy(CAMERA_POSITION);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  antialias: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// =========================
// Skyblock
// ==========================
const cubeLoader = new THREE.CubeTextureLoader();
const skybox = cubeLoader.load([
  'src/assets/Pictures/SkyBox/kurt/space_bk.png',
  'src/assets/Pictures/SkyBox/kurt/space_dn.png',
  'src/assets/Pictures/SkyBox/kurt/space_ft.png',
  'src/assets/Pictures/SkyBox/kurt/space_lf.png',
  'src/assets/Pictures/SkyBox/kurt/space_rt.png',
  'src/assets/Pictures/SkyBox/kurt/space_up.png'
]);
scene.background = skybox;

// scene.background = new THREE.Color(0x000000); // fallback black

// =========================
// Lighting
// =========================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
const pointLight = new THREE.PointLight(0xffffff, 1, 500);
pointLight.position.set(50, 50, 50);
scene.add(ambientLight, pointLight);

// =========================
// Galaxies
// =========================
const galaxies = [];
const galaxyColors = [
  { h: 0.05, s: 0.8, l: 0.6 },  // red-orange
  { h: 0.6, s: 0.9, l: 0.7 },   // blue
  { h: 0.15, s: 0.7, l: 0.8 }   // yellow
];

for (let i = 0; i < GALAXY_COUNT; i++) {
  const pos = new THREE.Vector3(
    (Math.random() - 0.5) * 1000,
    (Math.random() - 0.5) * 1000,
    (Math.random() - 0.5) * 1000
  );
  const theme = galaxyColors[Math.floor(Math.random() * galaxyColors.length)];
  galaxies.push(createGalaxy({ position: pos, colorBase: theme, scene }));
}

// =========================
// Star Field Creation
// =========================
const stars = [];
const createStar = () => {
  const starGeometry = new THREE.SphereGeometry(0.1, 16, 16);

  // Random star temperature color (bluish, yellowish, reddish)
  const h = Math.random(); // full hue range from 0.0 (red) to 1.0 (violet)
  const s = 0.6 + Math.random() * 0.4; // 0.6–1.0 saturation
  const l = 0.6 + Math.random() * 0.3; // 0.6–0.9 lightness

  const starColor = new THREE.Color().setHSL(h, s, l);

  const starMaterial = new THREE.MeshBasicMaterial({
    color: starColor,
    transparent: true,
    opacity: 0.7,
    depthWrite: false
  });
  starMaterial.userData = { baseColor: starColor.clone() };
  const star = new THREE.Mesh(starGeometry, starMaterial);

  const radius = Math.random() * STAR_FIELD_RADIUS - STAR_FIELD_RADIUS / 2;
  const theta = Math.random() * Math.PI * 2;
  const x = radius * Math.cos(theta);
  const z = radius * Math.sin(theta);
  const y = Math.random() * STAR_FIELD_RADIUS - STAR_FIELD_RADIUS / 2;

  star.position.set(x, y, z);
  scene.add(star);

  stars.push({ star, radius, theta, y, speed: Math.random() * STAR_ROTATION_SPEED });
};

// Create multiple stars
Array.from({ length: STAR_COUNT }).forEach(createStar);

// =========================
// Create a planet
// =========================
const planetRadius = 10;
const planetVector = new THREE.Vector3(-50, 30, -50);
const planetSize = 1;
const planetGeometry = new THREE.SphereGeometry(planetRadius, 32, 32);
const planetMaterial = new THREE.MeshBasicMaterial();
const planet = new THREE.Mesh(planetGeometry, planetMaterial);
scene.add(planet);

// Add planet to scene
planet.position.copy(planetVector);
planet.scale.set(planetSize, planetSize, planetSize);

// Add texture to planet
const textureLoader = new THREE.TextureLoader();
textureLoader.load('src/assets/Models/Earth 3D Model/textures/1_earth_8k.jpg', (texture) => {
  planetMaterial.map = texture;
  planetMaterial.needsUpdate = true;
});

//=================================================================================

// =========================
// Comet Setup with Soft Glow and Detailed Trail
// =========================

const COMET_COUNT = 5;
const comets = [];
const trailLength = 20;
const trailRadius = 0.8;
const trailSegments = 64;

function createTrailMesh(length, radius, color, opacity, segments = 64) {
  const trailGeometry = new THREE.BufferGeometry();
  const baseVertices = [];
  const colors = [];
  const indices = [];

  // Center base point
  baseVertices.push(0, 0, 0);
  colors.push(1.0, 1.0, 1.0);

  for (let j = 0; j <= segments; j++) {
    const angle = (j / segments) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const z = 0;
    baseVertices.push(x, y, z);
    const t = 1 - j / segments;
    colors.push(color.r * t + 1.0 * (1 - t), color.g * t + 1.0 * (1 - t), color.b);
  }

  const tipIndex = baseVertices.length / 3;
  baseVertices.push(0, 0, length);
  colors.push(color.r, color.g, color.b);

  for (let j = 1; j <= segments; j++) {
    indices.push(j, j + 1, tipIndex);
    indices.push(0, j + 1, j);
  }

  trailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(baseVertices, 3));
  trailGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  trailGeometry.setIndex(indices);
  trailGeometry.computeVertexNormals();

  const trailMaterial = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const mesh = new THREE.Mesh(trailGeometry, trailMaterial);
  mesh.position.set(0, 0, 0);
  return mesh;
}

for (let i = 0; i < COMET_COUNT; i++) {
  const group = new THREE.Group();

  // Core
  const coreGeometry = new THREE.SphereGeometry(0.3, 32, 32);
  const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  group.add(core);

  // Glow
  const glowGeometry = new THREE.SphereGeometry(0.9, 32, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x66ccff,
    transparent: true,
    opacity: 0.3,
    depthWrite: false
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  group.add(glow);

  // Halo
  const haloGeometry = new THREE.RingGeometry(0.6, 1.1, 32);
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0x66ccff,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const halo = new THREE.Mesh(haloGeometry, haloMaterial);
  halo.rotation.x = Math.PI / 2;
  group.add(halo);

  // Trail
  const trailGroup = new THREE.Group();
  const baseColor = new THREE.Color(0x66ccff);
  trailGroup.add(createTrailMesh(20, 0.8, baseColor, 0.4));
  trailGroup.add(createTrailMesh(22, 1.2, baseColor, 0.2));
  trailGroup.add(createTrailMesh(24, 1.6, baseColor, 0.08));
  group.add(trailGroup);

  // Initial position and velocity
  // Generate spawn at edge of view + buffer
  const SPAWN_DISTANCE = 1000;
  const edgeAxis = new THREE.Vector3(
    (Math.random() - 0.5),
    (Math.random() - 0.5),
    (Math.random() - 0.5)
  ).normalize();

  // Push spawn far in that direction
  const spawnPosition = edgeAxis.clone().multiplyScalar(SPAWN_DISTANCE);
  group.position.copy(spawnPosition);

  // Velocity is inward (toward center or slightly randomized inward)
  const toCenter = spawnPosition.clone().negate().normalize();
  const offset = new THREE.Vector3(
    (Math.random() - 0.5) * 0.3,
    (Math.random() - 0.5) * 0.3,
    (Math.random() - 0.5) * 0.3
  );
  const velocity = toCenter.add(offset).normalize().multiplyScalar(Math.random() * 1.5 + 0.5);

  scene.add(group);
  comets.push({ group, velocity, trailGroup });
}

//=================================================================================

// =========================
// Scroll Lock Until Intro Ends
// =========================
document.body.style.overflow = 'hidden'; // Initial lock
const intro = document.querySelector('.intro');
intro.addEventListener('animationend', () => {
  document.body.style.overflow = 'auto';
  document.body.setAttribute('data-intro-complete', 'true');
});

// =========================
// Function to spin an object around its axis
// =========================
const spin = (object, axis, speed) => {
  object.rotation[axis] += speed;
};

// ============================================
// =========================
// Scroll-based Camera Movement
// =========================
let targetZ = CAMERA_POSITION.z;
let hasRotated = false;
let currentRotationY = 0;
let targetRotationY = 0;
window.addEventListener('scroll', () => {
  targetZ = CAMERA_POSITION.z - window.scrollY * 0.05;

  if (!hasRotated) {
    targetRotationY = -Math.PI / 6; // 30° left
    hasRotated = true;
  }
});
// ============================================


// =========================
// Animation Loop
// =========================
let time = 0;
function animate() {
  requestAnimationFrame(animate);
  animateGalaxies(galaxies);

  // Update Stars (Twinkling Effect)
  time += 0.1;
  stars.forEach(({ star, radius, speed, y }, index) => {
    const theta = time * speed + index * 0.05;
    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);
    star.position.set(x, y, z);

    // Star Twinkle
    const intensity = Math.abs(Math.sin(time + index * 0.1)) * 1.2 + 0.3;
    const baseColor = star.material.userData.baseColor.clone(); // preserve original hue
    star.material.color.copy(baseColor).multiplyScalar(intensity);      
  });

  //===========================================================

  // =========================
  // Animate Comets
  // =========================
  comets.forEach(({ group, velocity, trailGroup }) => {
    group.position.add(velocity);

    if (group.position.length() > STAR_FIELD_RADIUS * 1.2) {
      group.position.set(
        (Math.random() - 0.5) * STAR_FIELD_RADIUS,
        (Math.random() - 0.5) * STAR_FIELD_RADIUS,
        (Math.random() - 0.5) * STAR_FIELD_RADIUS
      );
      velocity.set(
        (Math.random() - 0.5),
        (Math.random() - 0.5),
        (Math.random() - 0.5)
      ).normalize().multiplyScalar(Math.random() * 1.5 + 0.5);
    }

    const axis = new THREE.Vector3(0, 0, -1);
    const dir = velocity.clone().normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(axis, dir);
    trailGroup.setRotationFromQuaternion(quat);
  });

  //===========================================================



  // Update Planet Rotation
  planet.rotation.y += 0.001;

  // Update Camera Position
  camera.position.z += (targetZ - camera.position.z) * 0.05;

  // Map scroll position to rotation
  const scrollMax = document.body.scrollHeight - window.innerHeight;
  const scrollRatio = window.scrollY / scrollMax;
  const maxAngle = Math.PI / 20; // 45 degrees to the left

  const targetRotationY = -scrollRatio * maxAngle;

  // Smoothly interpolate current Y rotation toward target
  currentRotationY += (targetRotationY - currentRotationY) * 0.05;
  camera.rotation.y = currentRotationY;

  renderer.render(scene, camera);
}

// =========================
// Handle Window Resizing
// =========================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// =========================
// Start Animation
// =========================
animate();
