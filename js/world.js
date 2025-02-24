import * as THREE from 'three';

export function sceneInit(scene) {
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x808080,
        side: THREE.DoubleSide 
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);

    // Add some cubes for reference
    for (let i = 0; i < 10; i++) {
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.x = (Math.random() - 0.5) * 10;
        cube.position.z = (Math.random() - 0.5) * 10;
        cube.position.y = 0.5;
        scene.add(cube);
    }

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
}