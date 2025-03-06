const GRAVITY = 9.8;
const MOVE_SPEED = 50;

export function update(scene) {
    if (scene.isPaused) return;
    
    const time = performance.now();
    const delta = (time - scene.prevTime) / 1000;
    scene.prevTime = time;

    if (scene.isSitting) {
        scene.velocity.set(0, 0, 0);
        scene.benchIndicator.style.display = 'none';
        return;
    }

    scene.velocity.x *= (10 * delta);
    scene.velocity.z *= (10 * delta);
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
    if (position.y === minHeight) {
        scene.velocity.y = 0;
    }

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