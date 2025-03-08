const GRAVITY = 9.8;
const MOVE_SPEED = 12;
const MAX_DELTA = 0.1; // Máximo delta tiempo permitido (Evista saltos en bajos FPS)
const FRICTION = 0.9;

const MAP_LIMITS = {
    minX: -24,
    maxX: 24,
    minZ: -24,
    maxZ: 24
};

export function update(scene) {
    if (scene.isPaused) return;
    
    const time = performance.now();
    // Limitar el delta para evitar saltos en bajos FPS
    const delta = Math.min((time - scene.prevTime) / 1000, MAX_DELTA);
    scene.prevTime = time;

    if (scene.isSitting) {
        scene.velocity.set(0, 0, 0);
        scene.benchIndicator.style.display = 'none';
        return;
    }

    scene.velocity.x *= Math.pow(FRICTION, delta * 60);
    scene.velocity.z *= Math.pow(FRICTION, delta * 60);
    scene.velocity.y -= GRAVITY * delta;

    if (scene.moveForward || scene.moveBackward || scene.moveLeft || scene.moveRight) {
        scene.direction.set(Number(scene.moveRight) - Number(scene.moveLeft), 0, Number(scene.moveForward) - Number(scene.moveBackward)).normalize();
        
        const moveVector = scene.direction.multiplyScalar(MOVE_SPEED * delta);
        scene.velocity.x -= moveVector.x;
        scene.velocity.z -= moveVector.z;
    }

    const position = scene.camera.position;
    scene.controls.moveRight(-scene.velocity.x * delta);
    scene.controls.moveForward(-scene.velocity.z * delta);
    
    const groundHeight = Math.sin(position.x * 0.5) * Math.cos(position.z * 0.5) * 0.5 + 
                         Math.sin(position.x * 0.2) * Math.cos(position.z * 0.3);
    const minHeight = groundHeight + scene.standingHeight;
    
    position.y = Math.max(minHeight, position.y + scene.velocity.y * delta);
    if (position.y <= minHeight + 0.01) {
        position.y = minHeight;
        scene.velocity.y = 0;
    }

    checkMapBoundaries(scene, position);
    checkBenchProximity(scene);
}

function checkBenchProximity(scene) {
    if (!scene.bench) return;
    
    const playerPos = scene.camera.position;
    const benchPos = scene.benchInteractionSphere.position;
    
    const distanceSquared = 
        Math.pow(playerPos.x - benchPos.x, 2) + 
        Math.pow(playerPos.z - benchPos.z, 2);
    const radiusSquared = Math.pow(scene.benchInteractionSphere.geometry.parameters.radius, 2);
    
    scene.nearBench = distanceSquared < radiusSquared;
    
    if (scene.benchIndicator) {
        scene.benchIndicator.style.display = scene.nearBench ? 'block' : 'none';
    }
}

function checkMapBoundaries(scene, position) {
    let collision = false;
    
    if (position.x < MAP_LIMITS.minX) {
        position.x = MAP_LIMITS.minX;
        scene.velocity.x = 0;
        collision = true;
    } else if (position.x > MAP_LIMITS.maxX) {
        position.x = MAP_LIMITS.maxX;
        scene.velocity.x = 0;
        collision = true;
    }
    
    if (position.z < MAP_LIMITS.minZ) {
        position.z = MAP_LIMITS.minZ;
        scene.velocity.z = 0;
        collision = true;
    } else if (position.z > MAP_LIMITS.maxZ) {
        position.z = MAP_LIMITS.maxZ;
        scene.velocity.z = 0;
        collision = true;
    }
}