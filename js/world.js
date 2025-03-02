import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

let grassInstances = [];
let flowers = [];
let time = 0;

// Create a grass blade geometry
function createGrassBlade() {
    const height = 0.3 + Math.random() * 0.7;
    const baseWidth = 0.06 + Math.random() * 0.06;
    const shape = new THREE.Shape();
    
    const baseVariation = (Math.random() - 0.5) * 0.04;
    shape.moveTo(-baseWidth/2 + baseVariation, 0);
    shape.lineTo(baseWidth/2 + baseVariation, 0);
    
    const cp1x = (Math.random() - 0.5) * 0.3;
    const cp1y = height * (0.2 + Math.random() * 0.2);
    const cp2x = (Math.random() - 0.5) * 0.3;
    const cp2y = height * (0.5 + Math.random() * 0.2);
    const tipVariation = (Math.random() - 0.5) * 0.15;
    
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

export function sceneInit(scene, loadingManager) {
    // Create ground with terrain variation
    const size = 50;
    const segments = 64;
    const halfSize = size / 2;
    
    const vertices = [];
    const indices = [];
    const uvs = [];
    
    // Create vertices
    for(let i = 0; i <= segments; i++) {
        const y = (i * size) / segments - halfSize;
        for(let j = 0; j <= segments; j++) {
            const x = (j * size) / segments - halfSize;
            const z = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 0.5 +
                     Math.sin(x * 0.2) * Math.cos(y * 0.3) * 1;
            vertices.push(x, z, y);
            uvs.push(j / segments, i / segments);
        }
    }
    
    // Create indices
    for(let i = 0; i < segments; i++) {
        for(let j = 0; j < segments; j++) {
            const a = i * (segments + 1) + j;
            const b = a + 1;
            const c = a + (segments + 1);
            const d = c + 1;
            indices.push(a, b, c);
            indices.push(b, d, c);
        }
    }
    
    const groundGeometry = new THREE.BufferGeometry();
    groundGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    groundGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    groundGeometry.setIndex(indices);
    groundGeometry.computeVertexNormals();
    
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x5ab950,
        roughness: 0.8,
        metalness: 0.2,
        side: THREE.DoubleSide
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true;
    scene.add(ground);

    // Create skybox using loadingManager
    const skyTexture = loadingManager.textureLoader.load('modelos/sky.png', (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.encoding = THREE.LinearEncoding;
    });
    scene.background = skyTexture;
    // Update fog to match sky color
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.015);

    // Load stone bench model
    const fbxLoader = new FBXLoader(loadingManager.getManager());
    fbxLoader.load('modelos/3D/stone_bench_01_m13.fbx', (bench) => {
        bench.scale.set(1, 1.5, 1);
        // Position the bench
        bench.position.set(-5, 0.3, 5); // Adjust these values to place the bench
        
        // Make the bench cast and receive shadows
        bench.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        // Agregar referencia al banco en la escena global
        window.mainScene.bench = bench;
        
        // Crear esfera invisible para interacción
        const interactionRadius = 2; // Radio de interacción
        const interactionGeometry = new THREE.SphereGeometry(interactionRadius);
        const interactionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0, // Invisible al jugador
            depthWrite: false
        });
        const interactionSphere = new THREE.Mesh(interactionGeometry, interactionMaterial);
        interactionSphere.position.copy(bench.position);
        interactionSphere.position.y += 1; // Ajustar altura de la esfera
        
        // Agregar la esfera a la escena
        scene.add(interactionSphere);
        
        // Crear texto flotante para indicar interacción
        const benchIndicator = document.createElement('div');
        benchIndicator.id = 'bench-indicator';
        benchIndicator.textContent = 'Pulsa E para sentarte';
        benchIndicator.style.position = 'fixed';
        benchIndicator.style.top = '50%';
        benchIndicator.style.left = '50%';
        benchIndicator.style.transform = 'translate(-50%, -70px)';
        benchIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        benchIndicator.style.color = 'white';
        benchIndicator.style.padding = '5px 10px';
        benchIndicator.style.borderRadius = '5px';
        benchIndicator.style.fontFamily = 'Arial, sans-serif';
        benchIndicator.style.display = 'none';
        benchIndicator.style.zIndex = '1000';
        document.body.appendChild(benchIndicator);
        
        // Referencia a la esfera y al indicador
        window.mainScene.benchInteractionSphere = interactionSphere;
        window.mainScene.benchIndicator = benchIndicator;
        
        scene.add(bench);
    });

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
        100000
    );

    const matrix = new THREE.Matrix4();
    let instanceCount = 0;
    
    // Crear césped con densidad basada en la distancia
    for (let i = 0; i < 100000; i++) {
        const x = (Math.random() - 0.5) * 40;
        const z = (Math.random() - 0.5) * 40;
        const distance = Math.sqrt(x * x + z * z);
        
        if (Math.random() < (1 - distance / 40)) {
            const angle = Math.random() * Math.PI;
            const y = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.5 +
                     Math.sin(x * 0.2) * Math.cos(z * 0.3) * 1;
            
            // Escala más uniforme
            const scale = 0.9 + Math.random() * 0.2;
            
            matrix.makeRotationY(angle);
            matrix.scale(new THREE.Vector3(scale, scale, scale));
            matrix.setPosition(x, y, z);
            
            instancedGrass.setMatrixAt(instanceCount, matrix);
            grassInstances.push({
                position: new THREE.Vector3(x, y, z),
                baseRotation: angle,
                scale: scale
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
        
        // Verificar distancia al banco (posición del banco: -5, 0.3, 5)
        const benchPosition = new THREE.Vector3(-5, 0, 5);
        const treePosition = new THREE.Vector3(x, 0, z);
        const distanceToBench = treePosition.distanceTo(benchPosition);
        
        // Si está muy cerca del banco, continuar a la siguiente iteración
        const minDistanceFromBench = 2; // Distancia mínima en unidades 3D
        if (distanceToBench < minDistanceFromBench) {
            i--; // Repetir esta iteración
            continue;
        }
        
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

    function animate() {
        time += 0.05;

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
            const windStrength = 0.05;
            flower.rotation.y = Math.sin(time * 0.5 + index) * 0.2;
            flower.rotation.z = Math.sin(time + flower.position.x * 0.1) * windStrength;
            flower.rotation.x = Math.sin(time * 0.7 + flower.position.z * 0.1) * (windStrength * 0.7);
        });

        requestAnimationFrame(animate);
    }

    animate();
}
