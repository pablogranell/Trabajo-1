import * as THREE from 'three';

let grassInstances = [];
let flowers = [];
let time = 0;

// Create a grass blade geometry
function createGrassBlade() {
    const height = 0.4 + Math.random() * 0.5;
    const baseWidth = 0.08 + Math.random() * 0.04;
    const shape = new THREE.Shape();
    
    const baseVariation = (Math.random() - 0.5) * 0.02;
    shape.moveTo(-baseWidth/2 + baseVariation, 0);
    shape.lineTo(baseWidth/2 + baseVariation, 0);
    
    const cp1x = (Math.random() - 0.5) * 0.2;
    const cp1y = height * 0.3;
    const cp2x = (Math.random() - 0.5) * 0.2;
    const cp2y = height * 0.6;
    const tipVariation = (Math.random() - 0.5) * 0.1;
    
    shape.bezierCurveTo(
        baseWidth/2 + cp1x, cp1y,
        baseWidth/4 + cp2x, cp2y,
        baseWidth/8 + tipVariation, height
    );
    
    shape.bezierCurveTo(
        -baseWidth/4 + cp2x, cp2y,
        -baseWidth/2 + cp1x, cp1y,
        -baseWidth/2 + baseVariation, 0
    );

    const geometry = new THREE.ShapeGeometry(shape);
    return geometry;
}

// Create different types of trees
function createTree(type = Math.floor(Math.random() * 3)) {
    const group = new THREE.Group();
    let trunkMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x4a2f21,
        flatShading: true 
    });

    switch(type) {
        case 0: // Pine tree
            const pineHeight = 2 + Math.random();
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.2, pineHeight, 8),
                trunkMaterial
            );
            trunk.position.y = pineHeight/2;
            group.add(trunk);

            const levels = 4 + Math.floor(Math.random() * 3);
            const coneSpacing = 0.5;
            const baseHeight = pineHeight + 0.2;
            
            for(let i = 0; i < levels; i++) {
                const coneHeight = 0.8 + (i * 0.1); // Larger at bottom
                const coneRadius = 0.7 + (i * 0.15); // Wider at bottom
                const cone = new THREE.Mesh(
                    new THREE.ConeGeometry(coneRadius, coneHeight, 8),
                    new THREE.MeshStandardMaterial({
                        color: 0x2d5a27,
                        flatShading: true,
                        roughness: 1
                    })
                );
                // Position cones from top to bottom
                cone.position.y = baseHeight - (i * coneSpacing);
                group.add(cone);
            }
            break;

        case 1: // Oak tree
            const oakTrunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.25, 0.35, 2, 8),
                trunkMaterial
            );
            oakTrunk.position.y = 1;
            group.add(oakTrunk);

            const foliageGeometry = new THREE.SphereGeometry(1.2, 8, 6);
            const foliageMaterial = new THREE.MeshStandardMaterial({
                color: 0x3d8e40,
                flatShading: true,
                roughness: 1
            });

            for(let i = 0; i < 3; i++) {
                const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
                foliage.position.set(
                    (Math.random() - 0.5) * 0.8,
                    2 + (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.8
                );
                foliage.scale.set(0.8, 0.6, 0.8);
                group.add(foliage);
            }
            break;

        case 2: // Birch tree
            const birchTrunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.2, 3, 8),
                new THREE.MeshPhongMaterial({ 
                    color: 0xd3d3d3,
                    flatShading: true 
                })
            );
            birchTrunk.position.y = 1.5;
            group.add(birchTrunk);

            const leafGeometry = new THREE.IcosahedronGeometry(0.8, 0);
            const leafMaterial = new THREE.MeshStandardMaterial({
                color: 0x98fb98,
                flatShading: true,
                roughness: 1
            });

            for(let i = 0; i < 4; i++) {
                const leaves = new THREE.Mesh(leafGeometry, leafMaterial);
                leaves.position.set(
                    (Math.random() - 0.5) * 1.2,
                    2.5 + (Math.random() - 0.5) * 0.8,
                    (Math.random() - 0.5) * 1.2
                );
                leaves.scale.set(0.6, 0.8, 0.6);
                leaves.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                group.add(leaves);
            }
            break;
    }
    return group;
}

// Create different types of flowers
function createFlower(type = Math.floor(Math.random() * 3)) {
    const group = new THREE.Group();
    
    // Common stem
    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
    const stemMaterial = new THREE.MeshPhongMaterial({ color: 0x2d5a27 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.25;
    group.add(stem);

    switch(type) {
        case 0: // Daisy-like flower
            const centerGeometry = new THREE.SphereGeometry(0.08, 8, 8);
            const centerMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 });
            const center = new THREE.Mesh(centerGeometry, centerMaterial);
            center.position.y = 0.5;
            group.add(center);

            const petalCount = 8;
            const petalColor = new THREE.Color().setHSL(Math.random() * 0.1 + 0.1, 0.8, 0.9);
            for (let i = 0; i < petalCount; i++) {
                const petal = new THREE.Mesh(
                    new THREE.PlaneGeometry(0.15, 0.08),
                    new THREE.MeshPhongMaterial({ 
                        color: petalColor,
                        side: THREE.DoubleSide
                    })
                );
                petal.position.y = 0.5;
                petal.rotation.y = (Math.PI / petalCount) * i;
                petal.rotation.x = Math.PI / 3; // Corrected petal angle
                group.add(petal);
            }
            break;

        case 1: // Bell-like flower
            const bellGeometry = new THREE.ConeGeometry(0.12, 0.2, 8, 1, true);
            const bellMaterial = new THREE.MeshPhongMaterial({ 
                color: new THREE.Color().setHSL(Math.random() * 0.2 + 0.7, 0.8, 0.6),
                side: THREE.DoubleSide
            });
            const bell = new THREE.Mesh(bellGeometry, bellMaterial);
            bell.position.y = 0.5;
            bell.rotation.x = Math.PI; // Make bell face downward
            group.add(bell);
            break;

        case 2: // Tulip-like flower
            const petalMaterial = new THREE.MeshPhongMaterial({ 
                color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
                shininess: 30
            });

            for (let i = 0; i < 6; i++) {
                const petal = new THREE.Mesh(
                    new THREE.ConeGeometry(0.1, 0.2, 8),
                    petalMaterial
                );
                petal.position.y = 0.5;
                petal.rotation.z = -Math.PI / 6; // Corrected petal angle
                petal.rotation.y = (Math.PI / 3) * i;
                group.add(petal);
            }
            break;
    }

    return group;
}

export function sceneInit(scene) {
    // Create ground with terrain variation
    const groundGeometry = new THREE.PlaneGeometry(50, 50, 64, 64);
    const vertices = groundGeometry.attributes.position.array;
    
    // Add terrain variation
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const z = vertices[i + 2];
        // Create smooth hills using multiple sine waves
        vertices[i + 1] = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.5 +
                         Math.sin(x * 0.2) * Math.cos(z * 0.3) * 1;
    }
    groundGeometry.computeVertexNormals();
    
    const groundMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x5ab950,
        shininess: 0,
        flatShading: true
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // Create skybox
    const textureLoader = new THREE.TextureLoader();
    const skyTexture = textureLoader.load('modelos/sky.png', (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.encoding = THREE.sRGBEncoding;
        const aspectRatio = texture.image.width / texture.image.height;
        if (aspectRatio !== 16/9) {
            console.warn('Sky texture is not 16:9, adjusting mapping');
        }
    });
    scene.background = skyTexture;
    // Update fog to match sky color
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.015);

    // Create grass instances with density based on distance
    const blade = createGrassBlade();
    const instancedGrass = new THREE.InstancedMesh(
        blade,
        new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(0x5ab950),
            side: THREE.DoubleSide,
            roughness: 1,
            metalness: 0
        }),
        40000 // Reduced count for better performance
    );

    const matrix = new THREE.Matrix4();
    let instanceCount = 0;
    const center = new THREE.Vector3(0, 0, 0);
    
    // Create grass with varying density
    for (let i = 0; i < 40000; i++) {
        const x = (Math.random() - 0.5) * 40;
        const z = (Math.random() - 0.5) * 40;
        const distance = Math.sqrt(x * x + z * z);
        
        // Reduce density as distance increases
        if (Math.random() < (1 - distance / 40)) {
            const angle = Math.random() * Math.PI;
            const y = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.5 +
                     Math.sin(x * 0.2) * Math.cos(z * 0.3) * 1;
            
            matrix.makeRotationY(angle);
            matrix.setPosition(x, y, z);
            instancedGrass.setMatrixAt(instanceCount, matrix);
            grassInstances.push({
                position: new THREE.Vector3(x, y, z),
                baseRotation: angle
            });
            instanceCount++;
        }
    }
    instancedGrass.count = instanceCount;
    instancedGrass.instanceMatrix.needsUpdate = true;
    scene.add(instancedGrass);

    // Add trees with varied types
    for (let i = 0; i < 25; i++) {
        const x = (Math.random() - 0.5) * 30;
        const z = (Math.random() - 0.5) * 30;
        const tree = createTree();
        const y = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.5 +
                 Math.sin(x * 0.2) * Math.cos(z * 0.3) * 1;
        
        tree.position.set(x, y, z);
        tree.rotation.y = Math.random() * Math.PI * 2;
        scene.add(tree);
    }

    // Add flowers with varied types
    for (let i = 0; i < 150; i++) {
        const x = (Math.random() - 0.5) * 40;
        const z = (Math.random() - 0.5) * 40;
        const y = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.5 +
                 Math.sin(x * 0.2) * Math.cos(z * 0.3) * 1;
        
        const flower = createFlower();
        flower.position.set(x, y, z);
        flower.rotation.y = Math.random() * Math.PI * 2;
        flowers.push(flower);
        scene.add(flower);
    }

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(5, 10, 5);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const light1 = new THREE.PointLight(0xff7f00, 1, 10);
    light1.position.set(5, 0.5, 5);
    scene.add(light1);

    const light2 = new THREE.PointLight(0xff7f00, 1, 10);
    light2.position.set(-5, 0.5, -5);
    scene.add(light2);

    function animate() {
        time += 0.015;

        const matrix = new THREE.Matrix4();
        const quaternion = new THREE.Quaternion();
        const targetQuaternion = new THREE.Quaternion();
        
        for (let i = 0; i < grassInstances.length; i++) {
            const grass = grassInstances[i];
            
            const windEffect = 
                Math.sin(time * 0.8 + grass.position.x * 0.05) * 0.15 +
                Math.sin(time + grass.position.z * 0.05) * 0.1;
            
            matrix.makeRotationY(grass.baseRotation);
            quaternion.setFromRotationMatrix(matrix);
            
            targetQuaternion.setFromEuler(new THREE.Euler(0, grass.baseRotation, windEffect));
            quaternion.slerp(targetQuaternion, 0.3);
            
            matrix.makeRotationFromQuaternion(quaternion);
            matrix.setPosition(grass.position.x, grass.position.y, grass.position.z);
            
            instancedGrass.setMatrixAt(i, matrix);
        }
        instancedGrass.instanceMatrix.needsUpdate = true;

        // Enhanced flower animation
        flowers.forEach((flower, index) => {
            const windStrength = 0.15;
            flower.rotation.y = Math.sin(time * 0.5 + index) * 0.2;
            flower.rotation.z = Math.sin(time + flower.position.x * 0.1) * windStrength;
            flower.rotation.x = Math.sin(time * 0.7 + flower.position.z * 0.1) * (windStrength * 0.7);
        });

        requestAnimationFrame(animate);
    }

    animate();
}
