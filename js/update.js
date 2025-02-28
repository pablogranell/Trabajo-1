const GRAVITY = 9.8;

export function update(scene) {
    if (scene.isPaused) return;

    const time = performance.now();
    const delta = (time - scene.prevTime) / 1000;

    scene.velocity.x -= scene.velocity.x * 10.0 * delta;
    scene.velocity.z -= scene.velocity.z * 10.0 * delta;

    // Apply gravity
    scene.velocity.y -= GRAVITY * delta;

    // Get current position
    const position = scene.camera.position;

    scene.direction.z = Number(scene.moveForward) - Number(scene.moveBackward);
    scene.direction.x = Number(scene.moveRight) - Number(scene.moveLeft);
    scene.direction.normalize();

    if (scene.moveForward || scene.moveBackward) {
        scene.velocity.z -= scene.direction.z * 50.0 * delta;
    }
    if (scene.moveLeft || scene.moveRight) {
        scene.velocity.x -= scene.direction.x * 50.0 * delta;
    }

    // Calculate ground height at current position
    const groundHeight = Math.sin(position.x * 0.5) * Math.cos(position.z * 0.5) * 0.5 +
                        Math.sin(position.x * 0.2) * Math.cos(position.z * 0.3) * 1;

    // Update horizontal position
    scene.controls.moveRight(-scene.velocity.x * delta);
    scene.controls.moveForward(-scene.velocity.z * delta);

    // Update vertical position directly
    const newY = position.y + scene.velocity.y * delta;
    
    // Ground collision check
    if (newY < groundHeight + 2) {
        position.y = groundHeight + 2;
        scene.velocity.y = 0;
    } else {
        position.y = newY;
    }

    scene.prevTime = time;
}