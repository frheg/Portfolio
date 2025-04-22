import * as THREE from 'three';

export function createGalaxy({ position, colorBase, scene }) {
  const galaxyGroup = new THREE.Group();
  galaxyGroup.position.copy(position);

  const galaxySize = 20; // smaller size
  const starCount = 100; // fewer stars

  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const radius = Math.random() * galaxySize * 0.4;
    const height = (Math.random() - 0.5) * galaxySize * 0.2;

    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);
    const y = height;

    const hueVariation = (Math.random() - 0.5) * 0.1;
    const color = new THREE.Color().setHSL(
      colorBase.h + hueVariation,
      colorBase.s,
      colorBase.l
    );

    const starMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    });

    const star = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 8, 8),
      starMaterial
    );
    star.position.set(x, y, z);
    galaxyGroup.add(star);
  }

  // Add slow rotation
  galaxyGroup.userData = {
    rotationSpeed: 0.001 + Math.random() * 0.001
  };

  scene.add(galaxyGroup);
  return galaxyGroup;
}

export function animateGalaxies(galaxies) {
  galaxies.forEach((galaxy) => {
    galaxy.rotation.y += galaxy.userData.rotationSpeed;
  });
}
