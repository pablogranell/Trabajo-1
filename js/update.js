export function update(scene) {
    if (scene.isPaused) return;

    const time = performance.now();
    const delta = (time - scene.prevTime) / 1000;

    scene.velocity.x -= scene.velocity.x * 10.0 * delta;
    scene.velocity.z -= scene.velocity.z * 10.0 * delta;

    scene.direction.z = Number(scene.moveForward) - Number(scene.moveBackward);
    scene.direction.x = Number(scene.moveRight) - Number(scene.moveLeft);
    scene.direction.normalize();

    if (scene.moveForward || scene.moveBackward) {
        scene.velocity.z -= scene.direction.z * 50.0 * delta;
    }
    if (scene.moveLeft || scene.moveRight) {
        scene.velocity.x -= scene.direction.x * 50.0 * delta;
    }

    scene.controls.moveRight(-scene.velocity.x * delta);
    scene.controls.moveForward(-scene.velocity.z * delta);

    scene.prevTime = time;
}