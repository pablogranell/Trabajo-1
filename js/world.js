import * as THREE from 'three';

let grassInstances = [];
let flowers = [];
let time = 0;

// Create a grass blade geometry
function createGrassBlade() {
    const height = 0.4 + Math.random() * 0.5; // More height variation
    const baseWidth = 0.08 + Math.random() * 0.04;
    const shape = new THREE.Shape();
    
    // Create irregular base
    const baseVariation = (Math.random() - 0.5) * 0.02;
    shape.moveTo(-baseWidth/2 + baseVariation, 0);
    shape.lineTo(baseWidth/2 + baseVariation, 0);
    
    // Create curvy blade with control points
    const cp1x = (Math.random() - 0.5) * 0.2;
    const cp1y = height * 0.3;
    const cp2x = (Math.random() - 0.5) * 0.2;
    const cp2y = height * 0.6;
    const tipVariation = (Math.random() - 0.5) * 0.1;
    
    // Right side curve
    shape.bezierCurveTo(
        baseWidth/2 + cp1x, cp1y,
        baseWidth/4 + cp2x, cp2y,
        baseWidth/8 + tipVariation, height
    );
    
    // Left side curve
    shape.bezierCurveTo(
        -baseWidth/4 + cp2x, cp2y,
        -baseWidth/2 + cp1x, cp1y,
        -baseWidth/2 + baseVariation, 0
    );

    const geometry = new THREE.ShapeGeometry(shape);
    return geometry;
}

// Create a flower geometry
function createFlower() {
    const group = new THREE.Group();
    
    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
    const stemMaterial = new THREE.MeshPhongMaterial({ color: 0x2d5a27 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.25;
    group.add(stem);

    // Petals
    const petalGeometry = new THREE.ConeGeometry(0.1, 0.15, 8);
    const petalMaterial = new THREE.MeshPhongMaterial({ 
        color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
        shininess: 30
    });

    for (let i = 0; i < 6; i++) {
        const petal = new THREE.Mesh(petalGeometry, petalMaterial);
        petal.position.y = 0.5;
        petal.rotation.z = (Math.PI / 3) * 0.5;
        petal.rotation.y = (Math.PI / 3) * i;
        group.add(petal);
    }

    return group;
}

// Create a low-poly tree
function createTree() {
    const group = new THREE.Group();

    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
    const trunkMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x4a2f21,
        flatShading: true 
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1;
    group.add(trunk);

    // Leaves
    const leavesGeometry = new THREE.IcosahedronGeometry(1, 0);
    const leavesMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x5ab950,
        flatShading: true,
        roughness: 1,
        metalness: 0
    });

    for (let i = 0; i < 3; i++) {
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 2 + i * 0.5;
        leaves.position.x = (Math.random() - 0.5) * 0.5;
        leaves.position.z = (Math.random() - 0.5) * 0.5;
        leaves.scale.set(0.7 - i * 0.15, 0.7 - i * 0.15, 0.7 - i * 0.15);
        leaves.rotation.y = Math.random() * Math.PI;
        group.add(leaves);
    }

    return group;
}

export function sceneInit(scene) {
    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(50, 50, 32, 32);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x5ab950,
        shininess: 0,
        flatShading: true
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Remove Sky object and just use background color
    // The fog will help create depth
    scene.background = new THREE.Color(0xadd8e6); // Light blue
    scene.fog = new THREE.FogExp2(0xadd8e6, 0.015);

    // Base grass color
    const baseColor = new THREE.Color(0x5ab950);

    // Create instance buffer for grass
    const blade = createGrassBlade();
    const instancedGrass = new THREE.InstancedMesh(
        blade,
        new THREE.MeshStandardMaterial({ 
            color: baseColor,
            side: THREE.DoubleSide,
            roughness: 1,
            metalness: 0
        }),
        50000 // Maximum grass density
    );

    // Set up grass instances
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < 50000; i++) {
        const x = (Math.random() - 0.5) * 40;
        const z = (Math.random() - 0.5) * 40;
        const y = 0;
        const angle = Math.random() * Math.PI;
        
        matrix.makeRotationY(angle);
        matrix.setPosition(x, y, z);
        instancedGrass.setMatrixAt(i, matrix);
        grassInstances.push({
            position: new THREE.Vector3(x, y, z),
            baseRotation: angle
        });
    }
    instancedGrass.instanceMatrix.needsUpdate = true;
    scene.add(instancedGrass);

    // Add trees
    for (let i = 0; i < 15; i++) {
        const tree = createTree();
        tree.position.x = (Math.random() - 0.5) * 30;
        tree.position.z = (Math.random() - 0.5) * 30;
        tree.rotation.y = Math.random() * Math.PI * 2;
        scene.add(tree);
    }

    // Add flowers
    for (let i = 0; i < 100; i++) {
        const flower = createFlower();
        flower.position.x = (Math.random() - 0.5) * 40;
        flower.position.z = (Math.random() - 0.5) * 40;
        flower.rotation.y = Math.random() * Math.PI * 2;
        flowers.push(flower);
        scene.add(flower);
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(5, 10, 5);
    sunLight.castShadow = true;
    scene.add(sunLight);

    // Add point lights for evening ambiance
    const light1 = new THREE.PointLight(0xff7f00, 1, 10);
    light1.position.set(5, 0.5, 5);
    scene.add(light1);

    const light2 = new THREE.PointLight(0xff7f00, 1, 10);
    light2.position.set(-5, 0.5, -5);
    scene.add(light2);

    // Animation function    
    function animate() {
        time += 0.015;

        // Smooth grass animation
        const matrix = new THREE.Matrix4();
        const quaternion = new THREE.Quaternion();
        const targetQuaternion = new THREE.Quaternion();
        
        // Update all instances every frame for smoother motion
        for (let i = 0; i < grassInstances.length; i++) {
            const grass = grassInstances[i];
            
            // Enhanced wave-based animation
            const windEffect = 
                Math.sin(time * 0.8 + grass.position.x * 0.05) * 0.15 + // Primary wave
                Math.sin(time + grass.position.z * 0.05) * 0.1; // Secondary wave
            
            // Create smooth rotation
            matrix.makeRotationY(grass.baseRotation);
            quaternion.setFromRotationMatrix(matrix);
            
            // Add wind effect
            targetQuaternion.setFromEuler(new THREE.Euler(0, grass.baseRotation, windEffect));
            quaternion.slerp(targetQuaternion, 0.3); // Smooth interpolation
            
            // Apply final transformation
            matrix.makeRotationFromQuaternion(quaternion);
            matrix.setPosition(grass.position.x, grass.position.y, grass.position.z);
            
            instancedGrass.setMatrixAt(i, matrix);
        }
        instancedGrass.instanceMatrix.needsUpdate = true;

        // Animate flowers with more natural movement
        flowers.forEach((flower, index) => {
            // Increased rotation and movement
            flower.rotation.y = Math.sin(time * 0.5 + index) * 0.2;
            // More pronounced swaying
            flower.rotation.z = Math.sin(time + flower.position.x * 0.1) * 0.15;
            // More forward/backward tilt
            flower.rotation.x = Math.sin(time * 0.7 + flower.position.z * 0.1) * 0.1;
        });

        requestAnimationFrame(animate);
    }

    animate();
}
