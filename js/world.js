import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

let grassInstances = [];
let flowers = [];
let trees = [];
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

    // Variables para guardar referencia a las hojas de los árboles
    let foliages = [];
    let pineCones = [];

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
                
                // Guardar referencia para la animación
                pineCones.push(cone);
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
                foliage.scale.set(
                    0.8 + Math.random() * 0.2,
                    0.8 + Math.random() * 0.2,
                    0.8 + Math.random() * 0.2
                );
                
                // Guardar referencia para la animación
                foliages.push(foliage);
                
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

    // Guardar referencias para animación
    group.userData = {
        type: type,
        foliages: foliages,
        pineCones: pineCones,
        windFactor: 0.5 + Math.random() * 0.5, // Factor aleatorio para el viento
        phase: Math.random() * Math.PI * 2,    // Fase aleatoria para movimientos variados
    };

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
        
        // Tamaño y rotación aleatorios para variedad
        const scale = 0.8 + Math.random() * 0.6;
        tree.scale.set(scale, scale, scale);
        tree.rotation.y = Math.random() * Math.PI * 2;
        
        scene.add(tree);
        trees.push(tree); // Guardar referencia al árbol
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

    // Añadir pájaros volando para dar más vida a la escena
    function createBird() {
        const bird = new THREE.Group();
        
        // Cuerpo del pájaro
        const bodyGeometry = new THREE.SphereGeometry(0.1, 8, 6);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff, // Cambiado a blanco
            roughness: 0.7
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        bird.add(body);
        
        // Alas
        const wingGeometry = new THREE.PlaneGeometry(0.3, 0.15);
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff, // Cambiado a blanco
            roughness: 0.7,
            side: THREE.DoubleSide
        });
        
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-0.15, 0, 0);
        leftWing.rotation.y = Math.PI / 4;
        bird.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(0.15, 0, 0);
        rightWing.rotation.y = -Math.PI / 4;
        bird.add(rightWing);
        
        // Añadir una pequeña cola
        const tailGeometry = new THREE.ConeGeometry(0.05, 0.15, 4);
        const tailMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.7
        });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.set(0, 0, 0.12);
        tail.rotation.x = Math.PI / 2;
        bird.add(tail);
        
        // Datos para animación
        bird.userData = {
            speed: 0.02 + Math.random() * 0.03,
            angle: Math.random() * Math.PI * 2,
            height: 5 + Math.random() * 3,
            radius: 10 + Math.random() * 10,
            wingSpeed: 0.2 + Math.random() * 0.3,
            leftWing: leftWing,
            rightWing: rightWing,
            tail: tail,
            flapPhase: Math.random() * Math.PI * 2 // Fase aleatoria para el aleteo
        };
        
        return bird;
    }

    // Añadir pájaros a la escena
    const birds = [];
    for (let i = 0; i < 7; i++) { // Aumentado a 7 pájaros
        const bird = createBird();
        scene.add(bird);
        birds.push(bird);
    }

    // Crear nubes
    function createCloud() {
        const cloud = new THREE.Group();
        
        // Número de esferas que forman la nube
        const sphereCount = 3 + Math.floor(Math.random() * 5);
        
        const cloudMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.85,
            roughness: 0.2,
            metalness: 0.1
        });
        
        // Crear múltiples esferas para formar la nube
        for (let i = 0; i < sphereCount; i++) {
            const radius = 1 + Math.random() * 1.5;
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(radius, 7, 7),
                cloudMaterial
            );
            
            // Posicionar esferas para formar una nube
            sphere.position.set(
                (Math.random() - 0.5) * 2.5,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 2.5
            );
            
            // Aplanar un poco la nube
            sphere.scale.y = 0.6 + Math.random() * 0.2;
            
            cloud.add(sphere);
        }
        
        // Datos para animación
        cloud.userData = {
            speed: 0.01 + Math.random() * 0.01, // Velocidad aleatoria
            direction: new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                0,
                (Math.random() - 0.5) * 0.1
            ).normalize(),
            rotationSpeed: (Math.random() - 0.5) * 0.002,
            initialPosition: new THREE.Vector3() // Se establecerá después
        };
        
        return cloud;
    }
    
    // Añadir nubes a la escena
    const clouds = [];
    for (let i = 0; i < 12; i++) {
        const cloud = createCloud();
        
        // Posicionar nubes a diferentes alturas y posiciones (más altas ahora)
        const radius = 20 + Math.random() * 25;
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = 18 + Math.random() * 10; // Nubes más altas
        
        cloud.position.set(x, y, z);
        cloud.userData.initialPosition.copy(cloud.position);
        
        // Escalar aleatoriamente
        const scale = 0.8 + Math.random() * 1.2;
        cloud.scale.set(scale, scale, scale);
        
        scene.add(cloud);
        clouds.push(cloud);
    }
    
    // Crear mariposas mejoradas
    function createButterfly() {
        const butterfly = new THREE.Group();
        
        // Color aleatorio para la mariposa
        const hue = Math.random();
        let butterflyColor, secondaryColor;
        
        // Colores más realistas para mariposas
        if (Math.random() < 0.5) {
            // Colores vibrantes
            butterflyColor = new THREE.Color().setHSL(hue, 0.85, 0.6);
            secondaryColor = new THREE.Color().setHSL((hue + 0.1) % 1, 0.8, 0.5);
        } else {
            // Colores pastel
            butterflyColor = new THREE.Color().setHSL(hue, 0.5, 0.7);
            secondaryColor = new THREE.Color().setHSL((hue + 0.5) % 1, 0.4, 0.6);
        }
        
        // Cuerpo más detallado
        const bodyGeometry = new THREE.CylinderGeometry(0.015, 0.02, 0.1, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2;
        butterfly.add(body);
        
        // Cabeza
        const headGeometry = new THREE.SphereGeometry(0.02, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0x303030,
            roughness: 0.7
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 0, -0.05);
        butterfly.add(head);
        
        // Antenas
        const antennaMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.9
        });
        
        for (let i = 0; i < 2; i++) {
            const antennaGeometry = new THREE.CylinderGeometry(0.002, 0.001, 0.08, 4);
            const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
            antenna.position.set((i === 0 ? -1 : 1) * 0.01, 0.01, -0.08);
            antenna.rotation.x = -Math.PI / 4;
            antenna.rotation.z = (i === 0 ? 1 : -1) * Math.PI / 8;
            butterfly.add(antenna);
            
            // Extremo de antena
            const tipGeometry = new THREE.SphereGeometry(0.004, 4, 4);
            const tip = new THREE.Mesh(tipGeometry, antennaMaterial);
            tip.position.copy(antenna.position);
            tip.position.y += 0.03;
            tip.position.z -= 0.06;
            butterfly.add(tip);
        }
        
        // Alas mejoradas - usar forma más realista con textura
        function createWing(isLeft) {
            const wingGroup = new THREE.Group();
            
            // Ala superior con forma más realista
            const upperWingShape = new THREE.Shape();
            
            // Crear forma de ala con curvas para hacerla más realista
            upperWingShape.moveTo(0, 0);
            upperWingShape.bezierCurveTo(
                0.05, 0.02,
                0.12, 0.04,
                0.15, 0.1
            );
            upperWingShape.bezierCurveTo(
                0.13, 0.12,
                0.1, 0.13,
                0.05, 0.13
            );
            upperWingShape.bezierCurveTo(
                0.03, 0.12,
                0.01, 0.08,
                0, 0
            );
            
            const upperWingGeometry = new THREE.ShapeGeometry(upperWingShape);
            
            // Material con patrones
            const wingMaterial = new THREE.MeshStandardMaterial({
                color: butterflyColor,
                transparent: true,
                opacity: 0.95,
                side: THREE.DoubleSide,
                roughness: 0.5
            });
            
            const upperWing = new THREE.Mesh(upperWingGeometry, wingMaterial);
            
            // Ala inferior con diferente forma
            const lowerWingShape = new THREE.Shape();
            lowerWingShape.moveTo(0, 0);
            lowerWingShape.bezierCurveTo(
                0.02, -0.02,
                0.07, -0.06,
                0.1, -0.09
            );
            lowerWingShape.bezierCurveTo(
                0.08, -0.1,
                0.05, -0.1,
                0.02, -0.08
            );
            lowerWingShape.bezierCurveTo(
                0.01, -0.05,
                0, -0.02,
                0, 0
            );
            
            const lowerWingGeometry = new THREE.ShapeGeometry(lowerWingShape);
            
            // Material ligeramente diferente para ala inferior
            const lowerWingMaterial = new THREE.MeshStandardMaterial({
                color: secondaryColor,
                transparent: true,
                opacity: 0.95,
                side: THREE.DoubleSide,
                roughness: 0.5
            });
            
            const lowerWing = new THREE.Mesh(lowerWingGeometry, lowerWingMaterial);
            
            // Patrones en las alas (círculos o líneas)
            if (Math.random() < 0.7) { // 70% de las mariposas tienen patrones
                const patternCount = Math.floor(Math.random() * 3) + 1;
                
                for (let i = 0; i < patternCount; i++) {
                    // Elegir entre círculos o líneas
                    if (Math.random() < 0.5) {
                        // Círculos
                        const patternGeometry = new THREE.CircleGeometry(0.01 + Math.random() * 0.02, 8);
                        const patternMaterial = new THREE.MeshBasicMaterial({
                            color: Math.random() < 0.5 ? 0x000000 : 0xffffff,
                            transparent: true,
                            opacity: 0.7,
                            side: THREE.DoubleSide
                        });
                        
                        const pattern = new THREE.Mesh(patternGeometry, patternMaterial);
                        pattern.position.set(
                            0.05 + Math.random() * 0.08,
                            0.03 + Math.random() * 0.08,
                            0.001
                        );
                        
                        upperWing.add(pattern);
                    } else {
                        // Líneas
                        const lineGeometry = new THREE.PlaneGeometry(0.02 + Math.random() * 0.04, 0.005);
                        const lineMaterial = new THREE.MeshBasicMaterial({
                            color: Math.random() < 0.5 ? 0x000000 : 0xffffff,
                            transparent: true,
                            opacity: 0.7,
                            side: THREE.DoubleSide
                        });
                        
                        const line = new THREE.Mesh(lineGeometry, lineMaterial);
                        line.position.set(
                            0.05 + Math.random() * 0.08,
                            0.03 + Math.random() * 0.08,
                            0.001
                        );
                        line.rotation.z = Math.random() * Math.PI;
                        
                        upperWing.add(line);
                    }
                }
            }
            
            wingGroup.add(upperWing);
            wingGroup.add(lowerWing);
            
            // Reflejar para el lado opuesto si es necesario
            if (!isLeft) {
                wingGroup.scale.x = -1;
            }
            
            return wingGroup;
        }
        
        // Crear alas izquierda y derecha
        const leftWing = createWing(true);
        leftWing.position.set(-0.01, 0, 0);
        butterfly.add(leftWing);
        
        const rightWing = createWing(false);
        rightWing.position.set(0.01, 0, 0);
        butterfly.add(rightWing);
        
        // Datos para animación
        butterfly.userData = {
            speed: 0.02 + Math.random() * 0.03,
            targetPosition: new THREE.Vector3(),
            currentTarget: 0,
            flightHeight: 0.5 + Math.random() * 0.5,
            wingFlapSpeed: 0.2 + Math.random() * 0.3,
            leftWing: leftWing,
            rightWing: rightWing,
            waypoints: [],
            waitTime: 0,
            maxWaitTime: Math.random() * 200,
            isWaiting: false,
            bobAmount: 0.005 + Math.random() * 0.01, // Cantidad de balanceo vertical
            bobSpeed: 0.1 + Math.random() * 0.2     // Velocidad de balanceo
        };
        
        return butterfly;
    }
    
    // Añadir mariposas cerca de las flores
    const butterflies = [];
    for (let i = 0; i < 10; i++) {
        const butterfly = createButterfly();
        
        // Posicionar cerca de flores aleatorias
        if (flowers.length > 0) {
            const randomFlower = flowers[Math.floor(Math.random() * flowers.length)];
            
            // Añadir un poco de desplazamiento aleatorio desde la flor
            const offsetX = (Math.random() - 0.5) * 3;
            const offsetZ = (Math.random() - 0.5) * 3;
            
            butterfly.position.set(
                randomFlower.position.x + offsetX,
                randomFlower.position.y + 0.5,
                randomFlower.position.z + offsetZ
            );
            
            // Crear waypoints aleatorios para vuelo de la mariposa
            const waypointCount = 3 + Math.floor(Math.random() * 3);
            for (let j = 0; j < waypointCount; j++) {
                butterfly.userData.waypoints.push(new THREE.Vector3(
                    randomFlower.position.x + (Math.random() - 0.5) * 3,
                    randomFlower.position.y + 0.3 + Math.random() * 0.7,
                    randomFlower.position.z + (Math.random() - 0.5) * 3
                ));
            }
            
            // Establecer el primer objetivo
            butterfly.userData.targetPosition.copy(butterfly.userData.waypoints[0]);
            
            scene.add(butterfly);
            butterflies.push(butterfly);
        }
    }
    
    // Crear sistema de partículas para polen flotando
    function createPollenParticles() {
        // Geometría para las partículas
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 200;
        
        // Posiciones aleatorias
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        
        // Distribuir partículas de polen por la escena cerca de flores
        for (let i = 0; i < particleCount; i++) {
            // Si hay flores, distribuir cerca de flores aleatorias
            if (flowers.length > 0) {
                const randomFlower = flowers[Math.floor(Math.random() * flowers.length)];
                
                // Añadir un offset aleatorio desde la flor
                const offsetX = (Math.random() - 0.5) * 3;
                const offsetZ = (Math.random() - 0.5) * 3;
                const offsetY = Math.random() * 1.5;
                
                positions[i * 3] = randomFlower.position.x + offsetX;
                positions[i * 3 + 1] = randomFlower.position.y + offsetY;
                positions[i * 3 + 2] = randomFlower.position.z + offsetZ;
            } else {
                // Si no hay flores, distribuir aleatoriamente
                positions[i * 3] = (Math.random() - 0.5) * 30;
                positions[i * 3 + 1] = 0.5 + Math.random() * 2;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
            }
            
            // Velocidad para animación
            velocities.push({
                x: (Math.random() - 0.5) * 0.005,
                y: (Math.random() - 0.5) * 0.005,
                z: (Math.random() - 0.5) * 0.005
            });
        }
        
        particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        // Material para las partículas - Polen más amarillo y brillante
        const particlesMaterial = new THREE.PointsMaterial({
            color: 0xffff00, // Amarillo más intenso
            size: 0.05,
            transparent: true,
            opacity: 0.8
        });
        
        const pollenSystem = new THREE.Points(particlesGeometry, particlesMaterial);
        pollenSystem.userData = {
            velocities: velocities,
            positions: positions
        };
        
        return pollenSystem;
    }
    
    // Añadir sistema de partículas
    const pollenSystem = createPollenParticles();
    scene.add(pollenSystem);
    
    // Crear efecto de luz ambiental cambiante 
    const cyclicalLight = new THREE.DirectionalLight(0xffffaa, 0.2);
    cyclicalLight.position.set(-5, 8, -5);
    scene.add(cyclicalLight);

    // Variable para la rotación del skybox
    let skyRotation = 0;

    function animate() {
        time += 0.05;

        const matrix = new THREE.Matrix4();
        const quaternion = new THREE.Quaternion();
        const targetQuaternion = new THREE.Quaternion();
        
        // Animar el césped
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

        // Animar flores
        flowers.forEach((flower, index) => {
            const windStrength = 0.05;
            flower.rotation.y = Math.sin(time * 0.5 + index) * 0.2;
            flower.rotation.z = Math.sin(time + flower.position.x * 0.1) * windStrength;
            flower.rotation.x = Math.sin(time * 0.7 + flower.position.z * 0.1) * (windStrength * 0.7);
        });
        
        // Animar hojas de árboles
        trees.forEach((tree) => {
            const userData = tree.userData;
            const windIntensity = Math.sin(time * 0.5 + userData.phase) * 0.02 * userData.windFactor;
            
            // Animar diferentes tipos de árboles
            if (userData.type === 0) { // Árbol de pino
                userData.pineCones.forEach((cone, index) => {
                    const offsetFactor = (index + 1) / userData.pineCones.length; // Más movimiento en la parte superior
                    cone.rotation.x = Math.sin(time * 0.3 + userData.phase) * 0.05 * offsetFactor * userData.windFactor;
                    cone.rotation.z = Math.sin(time * 0.4 + userData.phase) * 0.05 * offsetFactor * userData.windFactor;
                });
            } else if (userData.type === 1) { // Árbol de roble
                userData.foliages.forEach((foliage, index) => {
                    // Guardar posición original si no se ha guardado aún
                    if (!foliage.userData.originalPos) {
                        foliage.userData.originalPos = foliage.position.clone();
                    }
                    
                    const originalPos = foliage.userData.originalPos;
                    
                    // Aplicar movimiento ondulante
                    foliage.position.x = originalPos.x + Math.sin(time * 0.5 + index) * 0.05 * userData.windFactor;
                    foliage.position.z = originalPos.z + Math.sin(time * 0.4 + index * 0.7) * 0.05 * userData.windFactor;
                    
                    // Pequeñas rotaciones
                    foliage.rotation.x = Math.sin(time * 0.3 + userData.phase) * 0.04 * userData.windFactor;
                    foliage.rotation.z = Math.sin(time * 0.4 + userData.phase + index) * 0.04 * userData.windFactor;
                });
            }
        });
        
        // Animar pájaros
        birds.forEach(bird => {
            const userData = bird.userData;
            
            // Actualizar posición en patrón circular
            userData.angle += userData.speed;
            bird.position.x = Math.cos(userData.angle) * userData.radius;
            bird.position.z = Math.sin(userData.angle) * userData.radius;
            bird.position.y = userData.height + Math.sin(userData.angle * 2) * 0.5;
            
            // Orientar el pájaro en la dirección del movimiento
            bird.rotation.y = userData.angle + Math.PI / 2;
            
            // Animar alas con patrón más natural de aleteo
            const wingAngle = Math.sin(time * userData.wingSpeed * 10 + userData.flapPhase) * 0.5;
            userData.leftWing.rotation.z = -Math.abs(wingAngle);
            userData.rightWing.rotation.z = Math.abs(wingAngle);
            
            // Animar cola
            userData.tail.rotation.z = Math.sin(time * 0.5 + userData.flapPhase) * 0.1;
        });
        
        // Animar nubes
        clouds.forEach(cloud => {
            const userData = cloud.userData;
            
            // Mover nubes lentamente
            cloud.position.x += userData.direction.x * userData.speed;
            cloud.position.z += userData.direction.z * userData.speed;
            
            // Rotar suavemente
            cloud.rotation.y += userData.rotationSpeed;
            
            // Mover ligeramente arriba y abajo
            cloud.position.y = userData.initialPosition.y + Math.sin(time * 0.1) * 0.2;
            
            // Si se alejan demasiado, reiniciar a posición opuesta
            if (cloud.position.x > 50) cloud.position.x = -50;
            if (cloud.position.x < -50) cloud.position.x = 50;
            if (cloud.position.z > 50) cloud.position.z = -50;
            if (cloud.position.z < -50) cloud.position.z = 50;
        });
        
        // Animar mariposas mejoradas
        butterflies.forEach(butterfly => {
            const userData = butterfly.userData;
            
            // Solo mover si no está esperando
            if (!userData.isWaiting) {
                // Vector de dirección hacia el objetivo
                const direction = new THREE.Vector3().subVectors(
                    userData.targetPosition,
                    butterfly.position
                );
                
                // Normalizar y escalar por velocidad
                direction.normalize();
                direction.multiplyScalar(userData.speed);
                
                // Mover hacia el objetivo
                butterfly.position.add(direction);
                
                // Orientar hacia la dirección de vuelo con suavidad
                if (direction.length() > 0.01) {
                    // Crear un punto adelante en la dirección de vuelo
                    const lookTarget = new THREE.Vector3().addVectors(
                        butterfly.position,
                        direction.clone().multiplyScalar(2)
                    );
                    
                    // Ajustar altura del punto objetivo para inclinar la mariposa naturalmente
                    lookTarget.y += Math.sin(time * userData.bobSpeed) * 0.1;
                    
                    butterfly.lookAt(lookTarget);
                    
                    // Añadir inclinación lateral en curvas
                    const turnFactor = Math.abs(direction.x) + Math.abs(direction.z);
                    butterfly.rotation.z = direction.x * 0.3 * turnFactor;
                    
                    // Añadir balanceo natural
                    butterfly.position.y += Math.sin(time * userData.bobSpeed) * userData.bobAmount;
                }
                
                // Verificar si la mariposa llegó al objetivo
                const distanceToTarget = butterfly.position.distanceTo(userData.targetPosition);
                if (distanceToTarget < 0.2) {
                    // Cambiar al siguiente punto de ruta
                    userData.currentTarget = (userData.currentTarget + 1) % userData.waypoints.length;
                    userData.targetPosition.copy(userData.waypoints[userData.currentTarget]);
                    
                    // A veces esperar en un punto
                    if (Math.random() < 0.3) {
                        userData.isWaiting = true;
                        userData.waitTime = 0;
                    }
                }
                
                // Animar alas con patrón de aleteo más natural durante el vuelo
                const baseFlapSpeed = 10; // Velocidad base de aleteo
                
                // Aleteo más rápido al acelerar, más lento al desacelerar
                const speedFactor = direction.length() * 20;
                const flapSpeed = baseFlapSpeed + speedFactor;
                
                // Patrón de aleteo con pausas y aceleraciones
                const flapPattern = Math.sin(time * userData.wingFlapSpeed * flapSpeed);
                const wingAngle = Math.pow(Math.abs(flapPattern), 0.7) * Math.sign(flapPattern) * 0.9;
                
                // Aplicar rotación a las alas completas
                userData.leftWing.rotation.y = wingAngle;
                userData.rightWing.rotation.y = -wingAngle;
            } else {
                // Esperar un tiempo antes de continuar
                userData.waitTime++;
                
                // Aleteo ocasional y lento mientras espera
                const restingFlapSpeed = 3;
                const restingFlapAmount = 0.3;
                
                // Aleteo ocasional mientras descansa
                if (Math.sin(time * 2) > 0.7) {
                    const restingFlap = Math.sin(time * userData.wingFlapSpeed * restingFlapSpeed) * restingFlapAmount;
                    userData.leftWing.rotation.y = restingFlap;
                    userData.rightWing.rotation.y = -restingFlap;
                } else {
                    // Posición cerrada en reposo
                    userData.leftWing.rotation.y = 0.1;
                    userData.rightWing.rotation.y = -0.1;
                }
                
                if (userData.waitTime > userData.maxWaitTime) {
                    userData.isWaiting = false;
                }
            }
        });
        
        // Animar partículas de polen con color más intenso
        if (pollenSystem && pollenSystem.userData.velocities) {
            const positions = pollenSystem.geometry.attributes.position.array;
            const velocities = pollenSystem.userData.velocities;
            
            for (let i = 0; i < positions.length / 3; i++) {
                // Aplicar velocidad con movimiento más aleatorio
                positions[i * 3] += velocities[i].x + Math.sin(time * 0.5 + i) * 0.003;
                positions[i * 3 + 1] += velocities[i].y + Math.cos(time * 0.3 + i) * 0.003;
                positions[i * 3 + 2] += velocities[i].z + Math.sin(time * 0.4 + i) * 0.003;
                
                // Mantener las partículas a una altura mínima
                if (positions[i * 3 + 1] < 0.2) {
                    velocities[i].y = Math.abs(velocities[i].y);
                }
                
                // Mantener las partículas dentro de un rango
                if (Math.abs(positions[i * 3]) > 25) velocities[i].x *= -1;
                if (positions[i * 3 + 1] > 3) velocities[i].y *= -1;
                if (Math.abs(positions[i * 3 + 2]) > 25) velocities[i].z *= -1;
            }
            
            pollenSystem.geometry.attributes.position.needsUpdate = true;
        }
        
        // Rotación lenta del skybox
        skyRotation += 0.0001; // Velocidad muy lenta
        if (scene.background) {
            scene.background.offset.x = skyRotation;
        }
        
        // Animar luz ambiental para simular cambios sutiles del día
        cyclicalLight.intensity = 0.1 + Math.sin(time * 0.05) * 0.1;
        const hue = 0.12 + Math.sin(time * 0.03) * 0.02;
        cyclicalLight.color.setHSL(hue, 0.5, 0.6);

        requestAnimationFrame(animate);
    }

    animate();
}
