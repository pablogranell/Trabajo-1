import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const CONFIG = {
    WORLD: {
        SIZE: 50,
        TERRAIN_SEGMENTS: 64,
        FOG_DENSITY: 0.015
    },
    
    COUNTS: {
        GRASS_INSTANCES_MAX: 100000,
        TREE_COUNT: 25,
        FLOWER_COUNT: 150,
        BIRD_COUNT: 7,
        BUTTERFLY_COUNT: 10,
        CLOUD_COUNT: 60,
        LIGHT_ORB_COUNT: 30,
        MIST_PATCH_COUNT: 10,
        POLLEN_PARTICLE_COUNT: 400
    },
    
    COLORS: {
        GROUND_COLOR: 0x5ab950,
        GRASS_COLOR: 0x5ab950,
        TRUNK_COLOR: 0x4a2f21,
        BIRCH_TRUNK_COLOR: 0xd3d3d3
    },
    
    POSITIONS: {
        TREE_SPAWN_RADIUS: 30,
        BENCH_POSITION: new THREE.Vector3(-5, 0.3, 5),
        BENCH_INTERACTION_RADIUS: 2,
        MIN_TREE_DISTANCE_FROM_BENCH: 2,
        FLOWER_SPAWN_RADIUS: 40,
        CLOUD_SPAWN_RADIUS: 120,
        CLOUD_HEIGHT_MIN: 15,
        CLOUD_HEIGHT_MAX: 55
    },
    
    ANIMATION: {
        WIND_STRENGTH: 0.05,
        BASE_WING_FLAP_SPEED: 10,
        SKYBOX_ROTATION_SPEED: 0.0005,
        CLOUD_MOVEMENT_SPEED_MIN: 0.002,
        CLOUD_MOVEMENT_SPEED_MAX: 0.01,
        BIRD_SPEED_MIN: 0.02,
        BIRD_SPEED_MAX: 0.05,
        BUTTERFLY_SPEED_MIN: 0.02,
        BUTTERFLY_SPEED_MAX: 0.05
    },
    
    LIGHTING: {
        AMBIENT_LIGHT_INTENSITY: 0.65,
        SUN_LIGHT_INTENSITY: 1.2,
        SUN_LIGHT_COLOR: 0xfffaed
    }
};

const STATE = {
    grassInstances: [],
    flowers: [],
    trees: [],
    birds: [],
    butterflies: [],
    clouds: [],
    time: 0
};


function calculateTerrainHeight(x, z) {
    return Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.5 +
           Math.sin(x * 0.2) * Math.cos(z * 0.3) * 1;
}

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

function createTree(type = Math.floor(Math.random() * 3)) {
    const group = new THREE.Group();
    let trunkMaterial = new THREE.MeshPhongMaterial({ 
        color: CONFIG.COLORS.TRUNK_COLOR,
        flatShading: true 
    });

    let foliages = [];
    let pineCones = [];
    let branches = [];

    switch(type) {
        case 0:
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
                const coneHeight = 0.8 + (i * 0.1);
                const coneRadius = 0.7 + (i * 0.15);
                
                const coneColor = new THREE.Color(0x2d5a27).lerp(
                    new THREE.Color(0x3d8e40), 
                    Math.random() * 0.3
                );
                
                const cone = new THREE.Mesh(
                    new THREE.ConeGeometry(coneRadius, coneHeight, 8),
                    new THREE.MeshStandardMaterial({
                        color: coneColor,
                        flatShading: true,
                        roughness: 1
                    })
                );
                cone.position.y = baseHeight - (i * coneSpacing);
                group.add(cone);
                
                pineCones.push(cone);
            }
            break;

        case 1:
            const trunkHeight = 2 + Math.random() * 0.5;
            const oakTrunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.25, 0.35, trunkHeight, 8),
                trunkMaterial
            );
            oakTrunk.position.y = trunkHeight / 2;
            group.add(oakTrunk);

            const foliageGeometry = new THREE.SphereGeometry(1.2, 8, 6);
            const foliageMaterial = new THREE.MeshStandardMaterial({
                color: 0x3d8e40,
                flatShading: true,
                roughness: 1
            });

            for(let i = 0; i < 4; i++) {
                const foliage = new THREE.Mesh(
                    foliageGeometry, 
                    new THREE.MeshStandardMaterial({
                        color: new THREE.Color(0x3d8e40).lerp(
                            new THREE.Color(0x2d5a27), 
                            Math.random() * 0.4
                        ),
                        flatShading: true,
                        roughness: 1
                    })
                );
                foliage.position.set(
                    (Math.random() - 0.5) * 1.2,
                    trunkHeight + (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 1.2
                );
                foliage.scale.set(
                    0.7 + Math.random() * 0.3,
                    0.7 + Math.random() * 0.3,
                    0.7 + Math.random() * 0.3
                );
                
                foliages.push(foliage);
                
                group.add(foliage);
            }
            break;

        case 2:
            const birchTrunkHeight = 3.5 + Math.random() * 0.5;
            const birchTrunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.25, birchTrunkHeight, 8),
                new THREE.MeshStandardMaterial({ 
                    color: CONFIG.COLORS.BIRCH_TRUNK_COLOR,
                    roughness: 0.7,
                    metalness: 0.1
                })
            );
            birchTrunk.position.y = birchTrunkHeight / 2;
            birchTrunk.castShadow = true;
            birchTrunk.receiveShadow = true;
            group.add(birchTrunk);

            const leafGeometry = new THREE.SphereGeometry(0.8, 8, 6);
            
            for(let i = 0; i < 7; i++) {
                const leafColor = new THREE.Color(0x98fb98).lerp(
                    new THREE.Color(0x7ccd7c), 
                    Math.random() * 0.6
                );
                
                const leafMaterial = new THREE.MeshStandardMaterial({
                    color: leafColor,
                    flatShading: true,
                    roughness: 0.9,
                    metalness: 0.1
                });
                
                const leaves = new THREE.Mesh(leafGeometry, leafMaterial);
                leaves.position.set(
                    (Math.random() - 0.5) * 1.8,
                    birchTrunkHeight - 0.5 + (Math.random() - 0.5) * 1.2,
                    (Math.random() - 0.5) * 1.8
                );
                
                const scale = 0.6 + Math.random() * 0.4;
                leaves.scale.set(scale, scale * 0.9, scale);
                leaves.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                
                leaves.castShadow = true;
                
                foliages.push(leaves);
                group.add(leaves);
            }
            break;
    }

    group.userData = {
        type: type,
        foliages: foliages,
        pineCones: pineCones,
        branches: branches,
        windFactor: 0.5 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
    };

    return group;
}

function createFlower(type = Math.floor(Math.random() * 3)) {
    const group = new THREE.Group();
    
    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
    const stemMaterial = new THREE.MeshPhongMaterial({ color: 0x2d5a27 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = 0.25;
    group.add(stem);

    switch(type) {
        case 0:
            const centerGeometry = new THREE.SphereGeometry(0.08, 8, 8);
            const centerMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 });
            const center = new THREE.Mesh(centerGeometry, centerMaterial);
            center.position.y = 0.5;
            group.add(center);

            const petalCount = 12;
            const petalColor = new THREE.Color().setHSL(Math.random() * 0.1 + 0.1, 0.8, 0.9);
            for (let i = 0; i < petalCount; i++) {
                const petal = new THREE.Mesh(
                    new THREE.PlaneGeometry(0.15, 0.08),
                    new THREE.MeshPhongMaterial({ 
                        color: petalColor,
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.9
                    })
                );
                petal.position.y = 0.5;
                petal.rotation.y = (Math.PI * 2 / petalCount) * i;
                petal.rotation.x = Math.PI / 2.5;
                
                petal.rotation.z = (Math.random() - 0.5) * 0.2;
                
                const scale = 0.8 + Math.random() * 0.4;
                petal.scale.set(scale, scale, scale);
                
                group.add(petal);
            }
            
            const leafGeometry = new THREE.PlaneGeometry(0.1, 0.05);
            const leafMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x2d8a27, 
                side: THREE.DoubleSide 
            });
            
            for (let i = 0; i < 2; i++) {
                const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
                leaf.position.y = 0.15 + i * 0.15;
                leaf.position.x = 0.05;
                leaf.rotation.x = Math.PI / 2;
                leaf.rotation.y = Math.PI / 4;
                group.add(leaf);
            }
            break;

        case 1:
            const bellGeometry = new THREE.ConeGeometry(0.12, 0.2, 8, 1, true);
            const bellMaterial = new THREE.MeshPhongMaterial({ 
                color: new THREE.Color().setHSL(Math.random() * 0.2 + 0.7, 0.8, 0.6),
                side: THREE.DoubleSide
            });
            const bell = new THREE.Mesh(bellGeometry, bellMaterial);
            bell.position.y = 0.56;
            bell.rotation.x = Math.PI;
            group.add(bell);
            break;

        case 2:
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
                petal.rotation.z = -Math.PI / 6;
                petal.rotation.y = (Math.PI / 3) * i;
                group.add(petal);
            }
            break;
    }

    return group;
}

export function sceneInit(scene, loadingManager) {
    const size = CONFIG.WORLD.SIZE;
    const segments = CONFIG.WORLD.TERRAIN_SEGMENTS;
    const halfSize = size / 2;
    
    const vertices = [];
    const indices = [];
    const uvs = [];
    
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
        color: CONFIG.COLORS.GROUND_COLOR,
        roughness: 0.8,
        metalness: 0.2,
        side: THREE.DoubleSide
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.receiveShadow = true;
    scene.add(ground);

    const skyTexture = loadingManager.textureLoader.load('modelos/sky.png', (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.encoding = THREE.LinearEncoding;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.repeat.set(1, 1);
        texture.offset.set(0, 0);
        texture.needsUpdate = true;
    });

    scene.background = skyTexture;
    scene.fog = new THREE.FogExp2(0x87ceeb, CONFIG.WORLD.FOG_DENSITY);

    const fbxLoader = new FBXLoader(loadingManager.getManager());
    fbxLoader.load('modelos/3D/stone_bench_01_m13.fbx', (bench) => {
        bench.scale.set(1, 1.5, 1);
        bench.position.copy(CONFIG.POSITIONS.BENCH_POSITION);
        
        bench.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        window.mainScene.bench = bench;
        
        const interactionRadius = CONFIG.POSITIONS.BENCH_INTERACTION_RADIUS;
        const interactionGeometry = new THREE.SphereGeometry(interactionRadius);
        const interactionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0,
            depthWrite: false
        });
        const interactionSphere = new THREE.Mesh(interactionGeometry, interactionMaterial);
        interactionSphere.position.copy(bench.position);
        interactionSphere.position.y += 1;
        
        scene.add(interactionSphere);
        
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
        
        window.mainScene.benchInteractionSphere = interactionSphere;
        window.mainScene.benchIndicator = benchIndicator;
        
        scene.add(bench);
    });

    const blade = createGrassBlade();
    const instancedGrass = new THREE.InstancedMesh(
        blade,
        new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(CONFIG.COLORS.GRASS_COLOR),
            side: THREE.DoubleSide,
            roughness: 1,
            metalness: 0
        }),
        CONFIG.COUNTS.GRASS_INSTANCES_MAX
    );

    const matrix = new THREE.Matrix4();
    let instanceCount = 0;
    
    for (let i = 0; i < CONFIG.COUNTS.GRASS_INSTANCES_MAX; i++) {
        const x = (Math.random() - 0.5) * 40;
        const z = (Math.random() - 0.5) * 40;
        const distance = Math.sqrt(x * x + z * z);
        
        if (Math.random() < (1 - distance / 40)) {
            const angle = Math.random() * Math.PI;
            const y = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.5 +
                     Math.sin(x * 0.2) * Math.cos(z * 0.3) * 1;
            
            const scale = 0.9 + Math.random() * 0.2;
            
            matrix.makeRotationY(angle);
            matrix.scale(new THREE.Vector3(scale, scale, scale));
            matrix.setPosition(x, y, z);
            
            instancedGrass.setMatrixAt(instanceCount, matrix);
            STATE.grassInstances.push({
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

    for (let i = 0; i < CONFIG.COUNTS.TREE_COUNT; i++) {
        const x = (Math.random() - 0.5) * CONFIG.POSITIONS.TREE_SPAWN_RADIUS;
        const z = (Math.random() - 0.5) * CONFIG.POSITIONS.TREE_SPAWN_RADIUS;
        
        const treePosition = new THREE.Vector3(x, 0, z);
        const distanceToBench = treePosition.distanceTo(CONFIG.POSITIONS.BENCH_POSITION);
        
        if (distanceToBench < CONFIG.POSITIONS.MIN_TREE_DISTANCE_FROM_BENCH) {
            i--;
            continue;
        }
        
        const tree = createTree();
        const y = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.5 +
                 Math.sin(x * 0.2) * Math.cos(z * 0.3) * 1;
        
        tree.position.set(x, y, z);
        
        const scale = 0.8 + Math.random() * 0.6;
        tree.scale.set(scale, scale, scale);
        tree.rotation.y = Math.random() * Math.PI * 2;
        
        scene.add(tree);
        STATE.trees.push(tree);
    }

    for (let i = 0; i < CONFIG.COUNTS.FLOWER_COUNT; i++) {
        const x = (Math.random() - 0.5) * CONFIG.POSITIONS.FLOWER_SPAWN_RADIUS;
        const z = (Math.random() - 0.5) * CONFIG.POSITIONS.FLOWER_SPAWN_RADIUS;
        const y = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.5 +
                 Math.sin(x * 0.2) * Math.cos(z * 0.3) * 1;
        
        const flower = createFlower();
        flower.position.set(x, y, z);
        flower.rotation.y = Math.random() * Math.PI * 2;
        STATE.flowers.push(flower);
        scene.add(flower);
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, CONFIG.LIGHTING.AMBIENT_LIGHT_INTENSITY);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(CONFIG.LIGHTING.SUN_LIGHT_COLOR, CONFIG.LIGHTING.SUN_LIGHT_INTENSITY);
    sunLight.position.set(5, 10, 5);
    sunLight.castShadow = true;
    
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    sunLight.shadow.bias = -0.0001;
    
    scene.add(sunLight);

    function createBird() {
        const bird = new THREE.Group();
        
        const bodyGeometry = new THREE.SphereGeometry(0.1, 8, 6);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.7
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        bird.add(body);
        
        const wingGeometry = new THREE.PlaneGeometry(0.3, 0.15);
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.7,
            side: THREE.DoubleSide
        });
        
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-0.15, 0, 0);
        bird.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(0.15, 0, 0);
        bird.add(rightWing);
        
        const tailGeometry = new THREE.ConeGeometry(0.05, 0.15, 4);
        const tailMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.7
        });
        const tail = new THREE.Mesh(tailGeometry, tailMaterial);
        tail.position.set(0, 0, 0.12);
        tail.rotation.x = Math.PI / 2;
        bird.add(tail);
        
        bird.userData = {
            speed: CONFIG.ANIMATION.BIRD_SPEED_MIN + Math.random() * (CONFIG.ANIMATION.BIRD_SPEED_MAX - CONFIG.ANIMATION.BIRD_SPEED_MIN),
            angle: Math.random() * Math.PI * 2,
            height: 5 + Math.random() * 3,
            radius: 10 + Math.random() * 10,
            wingSpeed: 0.2 + Math.random() * 0.3,
            leftWing: leftWing,
            rightWing: rightWing,
            tail: tail,
            flapPhase: Math.random() * Math.PI * 2
        };
        
        return bird;
    }

    const birds = [];
    for (let i = 0; i < CONFIG.COUNTS.BIRD_COUNT; i++) {
        const bird = createBird();
        scene.add(bird);
        birds.push(bird);
    }

    function createCloud() {
        const cloud = new THREE.Group();
        
        const sphereCount = 3 + Math.floor(Math.random() * 3);
        
        const cloudMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: false,
            opacity: 1.0,
            roughness: 0.3,
            metalness: 0.1
        });
        
        const coreRadius = 2.5 + Math.random() * 2;
        const core = new THREE.Mesh(
            new THREE.SphereGeometry(coreRadius, 8, 6),
            cloudMaterial
        );
        
        const flattenY = 0.4 + Math.random() * 0.2;
        core.scale.y = flattenY;
        cloud.add(core);
        
        for (let i = 0; i < sphereCount; i++) {
            const radius = (1.5 + Math.random() * 1.2) * (1 - i/sphereCount * 0.2);
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(radius, 6, 4),
                cloudMaterial
            );
            
            const angle = (i / sphereCount) * Math.PI * 2;
            const distance = 0.8 * coreRadius;
            
            sphere.position.set(
                Math.cos(angle) * distance,
                (Math.random() - 0.5) * 0.5 * flattenY,
                Math.sin(angle) * distance
            );
            
            sphere.scale.y = flattenY * (0.85 + Math.random() * 0.15);
            
            cloud.add(sphere);
        }
        
        cloud.userData = {
            speed: CONFIG.ANIMATION.CLOUD_MOVEMENT_SPEED_MIN + Math.random() * (CONFIG.ANIMATION.CLOUD_MOVEMENT_SPEED_MAX - CONFIG.ANIMATION.CLOUD_MOVEMENT_SPEED_MIN),
            direction: new THREE.Vector3(
                (Math.random() - 0.5) * 0.15,
                0,
                (Math.random() - 0.5) * 0.15
            ).normalize(),
            rotationSpeed: (Math.random() - 0.5) * 0.001,
            initialPosition: new THREE.Vector3(),
            cloudType: Math.floor(Math.random() * 5),
            pulseSpeed: 0.001 + Math.random() * 0.003,
            pulseAmount: Math.random() * 0.05
        };
        
        return cloud;
    }
    
    const clouds = [];
    for (let i = 0; i < CONFIG.COUNTS.CLOUD_COUNT; i++) {
        const cloud = createCloud();
        
        const radius = Math.random() * CONFIG.POSITIONS.CLOUD_SPAWN_RADIUS;
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        
        const y = 15 + Math.random() * 40;
        
        cloud.position.set(x, y, z);
        cloud.userData.initialPosition.copy(cloud.position);
        
        const scale = 0.4 + Math.random() * 3.0;
        cloud.scale.set(scale, scale, scale);
        
        cloud.rotation.y = Math.random() * Math.PI * 2;
        
        scene.add(cloud);
        clouds.push(cloud);
    }
    
    function createButterfly() {
        const butterfly = new THREE.Group();
        
        const hue = Math.random();
        let butterflyColor, secondaryColor;
        
        if (Math.random() < 0.5) {
            butterflyColor = new THREE.Color().setHSL(hue, 0.85, 0.6);
            secondaryColor = new THREE.Color().setHSL((hue + 0.1) % 1, 0.8, 0.5);
        } else {
            butterflyColor = new THREE.Color().setHSL(hue, 0.5, 0.7);
            secondaryColor = new THREE.Color().setHSL((hue + 0.5) % 1, 0.4, 0.6);
        }
        
        const bodyGeometry = new THREE.CylinderGeometry(0.015, 0.02, 0.1, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2;
        butterfly.add(body);
        
        const headGeometry = new THREE.SphereGeometry(0.02, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0x303030,
            roughness: 0.7
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 0, -0.05);
        butterfly.add(head);
        
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
            
            const tipGeometry = new THREE.SphereGeometry(0.004, 4, 4);
            const tip = new THREE.Mesh(tipGeometry, antennaMaterial);
            tip.position.copy(antenna.position);
            tip.position.y += 0.03;
            tip.position.z -= 0.06;
            butterfly.add(tip);
        }
        
        function createWing(isLeft) {
            const wingGroup = new THREE.Group();
            
            const upperWingShape = new THREE.Shape();
            
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
            
            const wingMaterial = new THREE.MeshStandardMaterial({
                color: butterflyColor,
                transparent: true,
                opacity: 0.95,
                side: THREE.DoubleSide,
                roughness: 0.5
            });
            
            const upperWing = new THREE.Mesh(upperWingGeometry, wingMaterial);
            
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
            
            const lowerWingMaterial = new THREE.MeshStandardMaterial({
                color: secondaryColor,
                transparent: true,
                opacity: 0.95,
                side: THREE.DoubleSide,
                roughness: 0.5
            });
            
            const lowerWing = new THREE.Mesh(lowerWingGeometry, lowerWingMaterial);
            
            if (Math.random() < 0.7) {
                const patternCount = Math.floor(Math.random() * 3) + 1;
                
                for (let i = 0; i < patternCount; i++) {
                    if (Math.random() < 0.5) {
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
            
            if (!isLeft) {
                wingGroup.scale.x = -1;
            }
            
            return wingGroup;
        }
        
        const leftWing = createWing(true);
        leftWing.position.set(-0.01, 0, 0);
        butterfly.add(leftWing);
        
        const rightWing = createWing(false);
        rightWing.position.set(0.01, 0, 0);
        butterfly.add(rightWing);
        
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
    
    const butterflies = [];
    for (let i = 0; i < 10; i++) {
        const butterfly = createButterfly();
        
        if (STATE.flowers.length > 0) {
            const randomFlower = STATE.flowers[Math.floor(Math.random() * STATE.flowers.length)];
            
            const offsetX = (Math.random() - 0.5) * 3;
            const offsetZ = (Math.random() - 0.5) * 3;
            
            butterfly.position.set(
                randomFlower.position.x + offsetX,
                randomFlower.position.y + 0.5,
                randomFlower.position.z + offsetZ
            );
            
            const waypointCount = 3 + Math.floor(Math.random() * 3);
            for (let j = 0; j < waypointCount; j++) {
                butterfly.userData.waypoints.push(new THREE.Vector3(
                    randomFlower.position.x + (Math.random() - 0.5) * 3,
                    randomFlower.position.y + 0.3 + Math.random() * 0.7,
                    randomFlower.position.z + (Math.random() - 0.5) * 3
                ));
            }
            
            butterfly.userData.targetPosition.copy(butterfly.userData.waypoints[0]);
            
            scene.add(butterfly);
            butterflies.push(butterfly);
        }
    }
    
    function createPollenParticles() {
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 400;
        
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            if (STATE.flowers.length > 0) {
                const randomFlower = STATE.flowers[Math.floor(Math.random() * STATE.flowers.length)];
                
                const offsetX = (Math.random() - 0.5) * 4;
                const offsetZ = (Math.random() - 0.5) * 4;
                const offsetY = Math.random() * 2;
                
                positions[i * 3] = randomFlower.position.x + offsetX;
                positions[i * 3 + 1] = randomFlower.position.y + offsetY;
                positions[i * 3 + 2] = randomFlower.position.z + offsetZ;
            } else {
                positions[i * 3] = (Math.random() - 0.5) * 40;
                positions[i * 3 + 1] = 0.5 + Math.random() * 2;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
            }
            
            velocities.push({
                x: (Math.random() - 0.5) * 0.005,
                y: (Math.random() - 0.5) * 0.005,
                z: (Math.random() - 0.5) * 0.005
            });
            
            sizes[i] = 0.025 + Math.random() * 0.025;
        }
        
        particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = canvas.width / 2 - 2;
        
        const gradient = context.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 0, 1)');
        gradient.addColorStop(0.7, 'rgba(255, 255, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
        
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, Math.PI * 2);
        context.fill();
        
        const texture = new THREE.CanvasTexture(canvas);
        
        const particlesMaterial = new THREE.PointsMaterial({
            color: 0xffff00,
            size: 0.075,
            map: texture,
            transparent: true,
            opacity: 1.0,
            alphaTest: 0.1,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        const pollenSystem = new THREE.Points(particlesGeometry, particlesMaterial);
        pollenSystem.userData = {
            velocities: velocities,
            positions: positions,
            originalSizes: [...sizes],
            material: particlesMaterial
        };
        
        return pollenSystem;
    }
    
    const pollenSystem = createPollenParticles();
    scene.add(pollenSystem);

    
    function createGroundMist() {
        const mistGroup = new THREE.Group();
        const mistPatchCount = 10;
        
        for (let i = 0; i < mistPatchCount; i++) {
            const mistPatch = new THREE.Group();
            const particleCount = 3 + Math.floor(Math.random() * 5);
            
            const baseX = (Math.random() - 0.5) * 80;
            const baseZ = (Math.random() - 0.5) * 80;
            const baseY = Math.sin(baseX * 0.5) * Math.cos(baseZ * 0.5) * 0.5 +
                          Math.sin(baseX * 0.2) * Math.cos(baseZ * 0.3) * 1;
            
            const mistColor = new THREE.Color(0x5ab950).lerp(
                new THREE.Color(0xd8eeff), 
                0.9 + Math.random() * 0.1
            );
            
            for (let j = 0; j < particleCount; j++) {
                const individualMaterial = new THREE.MeshStandardMaterial({
                    color: mistColor,
                    transparent: true,
                    opacity: 0.03 + Math.random() * 0.02,
                    roughness: 1,
                    metalness: 0,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending
                });
                
                const radius = 1.5 + Math.random() * 2.5;
                const mistParticle = new THREE.Mesh(
                    new THREE.SphereGeometry(radius, 
                    Math.max(5, Math.floor(radius * 1.5)),
                    Math.max(3, Math.floor(radius * 0.75))),
                    individualMaterial
                );
                
                const angle = (j / particleCount) * Math.PI * 2 + Math.random() * 0.7;
                const distance = 5 + Math.random() * 12;
                
                mistParticle.position.set(
                    baseX + Math.cos(angle) * distance,
                    baseY + 0.01 + Math.random() * 0.06,
                    baseZ + Math.sin(angle) * distance
                );
                
                mistParticle.scale.y = 0.02 + Math.random() * 0.03;
                
                mistParticle.userData = {
                    originalY: mistParticle.position.y,
                    floatSpeed: 0.001 + Math.random() * 0.003,
                    floatHeight: 0.01 + Math.random() * 0.02,
                    phase: Math.random() * Math.PI * 2,
                    originalOpacity: mistParticle.material.opacity,
                    opacitySpeed: 0.0002 + Math.random() * 0.0003
                };
                
                mistPatch.add(mistParticle);
            }
            
            mistGroup.add(mistPatch);
        }
        
        return mistGroup;
    }
    
    const groundMist = createGroundMist();
    scene.add(groundMist);

    const AnimationController = {
        animate: function() {
            STATE.time += 0.05;
            
            this.animateGrass();
            this.animateFlowers();
            this.animateTrees();
            this.animateBirds();
            this.animateClouds();
            this.animateButterflies();
            this.animatePollenParticles();
            this.animateMist();
            
            requestAnimationFrame(() => this.animate());
        },
        
        animateGrass: function() {
            const matrix = new THREE.Matrix4();
            const quaternion = new THREE.Quaternion();
            const targetQuaternion = new THREE.Quaternion();
            
            for (let i = 0; i < STATE.grassInstances.length; i++) {
                const grass = STATE.grassInstances[i];
                
                const windEffect = 
                    Math.sin(STATE.time * 0.8 + grass.position.x * 0.05) * 0.15 +
                    Math.sin(STATE.time + grass.position.z * 0.05) * 0.1;
                
                matrix.makeRotationY(grass.baseRotation);
                quaternion.setFromRotationMatrix(matrix);
                
                targetQuaternion.setFromEuler(new THREE.Euler(0, grass.baseRotation, windEffect));
                quaternion.slerp(targetQuaternion, 0.3);
                
                matrix.makeRotationFromQuaternion(quaternion);
                matrix.setPosition(grass.position.x, grass.position.y, grass.position.z);
                
                instancedGrass.setMatrixAt(i, matrix);
            }
            instancedGrass.instanceMatrix.needsUpdate = true;
        },
        
        animateFlowers: function() {
            STATE.flowers.forEach((flower, index) => {
                const windStrength = 0.05;
                flower.rotation.y = Math.sin(STATE.time * 0.5 + index) * 0.2;
                flower.rotation.z = Math.sin(STATE.time + flower.position.x * 0.1) * windStrength;
                flower.rotation.x = Math.sin(STATE.time * 0.7 + flower.position.z * 0.1) * (windStrength * 0.7);
            });
        },
        
        animateTrees: function() {
            STATE.trees.forEach((tree) => {
                const userData = tree.userData;
                const windIntensity = Math.sin(STATE.time * 0.5 + userData.phase) * 0.02 * userData.windFactor;
                
                if (userData.type === 0) {
                    userData.pineCones.forEach((cone, index) => {
                        const offsetFactor = (index + 1) / userData.pineCones.length;
                        cone.rotation.x = Math.sin(STATE.time * 0.3 + userData.phase) * 0.05 * offsetFactor * userData.windFactor;
                        cone.rotation.z = Math.sin(STATE.time * 0.4 + userData.phase) * 0.05 * offsetFactor * userData.windFactor;
                        
                        cone.position.x = Math.sin(STATE.time * 0.2 + userData.phase + index) * 0.02 * offsetFactor * userData.windFactor;
                        cone.position.z = Math.cos(STATE.time * 0.2 + userData.phase + index) * 0.02 * offsetFactor * userData.windFactor;
                    });
                } else if (userData.type === 1 || userData.type === 2) {
                    userData.foliages.forEach((foliage, index) => {
                        if (!foliage.userData.originalPos) {
                            foliage.userData.originalPos = foliage.position.clone();
                        }
                        
                        const originalPos = foliage.userData.originalPos;
                        
                        foliage.position.x = originalPos.x + 
                            Math.sin(STATE.time * 0.5 + index) * 0.05 * userData.windFactor +
                            Math.sin(STATE.time * 0.23 + index * 0.3) * 0.02 * userData.windFactor;
                            
                        foliage.position.z = originalPos.z + 
                            Math.sin(STATE.time * 0.4 + index * 0.7) * 0.05 * userData.windFactor +
                            Math.cos(STATE.time * 0.31 + index * 0.2) * 0.02 * userData.windFactor;
                        
                        foliage.rotation.x = Math.sin(STATE.time * 0.3 + userData.phase) * 0.06 * userData.windFactor;
                        foliage.rotation.z = Math.sin(STATE.time * 0.4 + userData.phase + index) * 0.06 * userData.windFactor;
                        foliage.rotation.y = Math.sin(STATE.time * 0.2 + userData.phase + index * 0.5) * 0.03 * userData.windFactor;
                    });
                    
                    userData.branches.forEach((branch, index) => {
                        branch.rotation.x += Math.sin(STATE.time * 0.3 + index) * 0.01 * userData.windFactor;
                        branch.rotation.z += Math.sin(STATE.time * 0.25 + index * 0.7) * 0.01 * userData.windFactor;
                    });
                }
            });
        },
        
        animateBirds: function() {
            STATE.birds.forEach(bird => {
                const userData = bird.userData;
                
                userData.angle += userData.speed;
                bird.position.x = Math.cos(userData.angle) * userData.radius;
                bird.position.z = Math.sin(userData.angle) * userData.radius;
                bird.position.y = userData.height + Math.sin(userData.angle * 2) * 0.5;
                
                bird.rotation.y = userData.angle + Math.PI / 2;
                
                const wingAngle = Math.sin(STATE.time * userData.wingSpeed * 10 + userData.flapPhase) * 0.5;
                userData.leftWing.rotation.z = -Math.abs(wingAngle);
                userData.rightWing.rotation.z = Math.abs(wingAngle);
                
                userData.tail.rotation.z = Math.sin(STATE.time * 0.5 + userData.flapPhase) * 0.1;
            });
        },
        
        animateClouds: function() {
            STATE.clouds.forEach(cloud => {
                const userData = cloud.userData;
                
                switch(userData.cloudType) {
                    case 0:
                        cloud.position.x += userData.direction.x * userData.speed;
                        cloud.position.z += userData.direction.z * userData.speed * 0.7;
                        cloud.position.y = userData.initialPosition.y + Math.sin(STATE.time * 0.03) * 0.3;
                        break;
                        
                    case 1:
                        cloud.position.x += userData.direction.x * userData.speed * (0.8 + Math.sin(STATE.time * 0.1) * 0.2);
                        cloud.position.z += userData.direction.z * userData.speed * (0.8 + Math.cos(STATE.time * 0.15) * 0.2);
                        cloud.position.y = userData.initialPosition.y + Math.sin(STATE.time * 0.04 + cloud.position.x * 0.01) * 0.5;
                        break;
                        
                    case 2:
                        cloud.position.x += userData.direction.x * userData.speed * 0.3;
                        cloud.position.z += userData.direction.z * userData.speed * 0.3;
                        cloud.position.y = userData.initialPosition.y + Math.sin(STATE.time * 0.02 + cloud.position.z * 0.02) * 0.7;
                        break;
                        
                    case 3:
                        cloud.position.x += userData.direction.x * userData.speed * 0.6;
                        cloud.position.z += userData.direction.z * userData.speed * 0.6;
                        const pulse = 1 + Math.sin(STATE.time * userData.pulseSpeed) * userData.pulseAmount;
                        cloud.scale.x = cloud.userData.originalScale * pulse;
                        cloud.scale.z = cloud.userData.originalScale * pulse;
                        break;
                        
                    case 4:
                        const circleRadius = 3;
                        const circleSpeed = 0.005;
                        cloud.position.x = userData.initialPosition.x + Math.cos(STATE.time * circleSpeed) * circleRadius;
                        cloud.position.z = userData.initialPosition.z + Math.sin(STATE.time * circleSpeed) * circleRadius;
                        cloud.position.y = userData.initialPosition.y + Math.sin(STATE.time * 0.03) * 0.4;
                        break;
                }
                
                cloud.rotation.y += userData.rotationSpeed * 0.5;
                
                if (cloud.position.x > 80) cloud.position.x = -80;
                if (cloud.position.x < -80) cloud.position.x = 80;
                if (cloud.position.z > 80) cloud.position.z = -80;
                if (cloud.position.z < -80) cloud.position.z = 80;
                
                if (userData.cloudType === 3 && !userData.originalScale) {
                    userData.originalScale = cloud.scale.x;
                }
            });
        },
        
        animateButterflies: function() {
            STATE.butterflies.forEach(butterfly => {
                const userData = butterfly.userData;
                
                if (!userData.isWaiting) {
                    const direction = new THREE.Vector3().subVectors(
                        userData.targetPosition,
                        butterfly.position
                    );
                    
                    direction.normalize();
                    direction.multiplyScalar(userData.speed);
                    
                    butterfly.position.add(direction);
                    
                    if (direction.length() > 0.01) {
                        const lookTarget = new THREE.Vector3().addVectors(
                            butterfly.position,
                            direction.clone().multiplyScalar(2)
                        );
                        
                        lookTarget.y += Math.sin(STATE.time * userData.bobSpeed) * 0.1;
                        
                        butterfly.lookAt(lookTarget);
                        
                        const turnFactor = Math.abs(direction.x) + Math.abs(direction.z);
                        butterfly.rotation.z = direction.x * 0.3 * turnFactor;
                        
                        butterfly.position.y += Math.sin(STATE.time * userData.bobSpeed) * userData.bobAmount;
                    }
                    
                    const distanceToTarget = butterfly.position.distanceTo(userData.targetPosition);
                    if (distanceToTarget < 0.2) {
                        userData.currentTarget = (userData.currentTarget + 1) % userData.waypoints.length;
                        userData.targetPosition.copy(userData.waypoints[userData.currentTarget]);
                        
                        if (Math.random() < 0.3) {
                            userData.isWaiting = true;
                            userData.waitTime = 0;
                        }
                    }
                    
                    const baseFlapSpeed = 10;
                    
                    const speedFactor = direction.length() * 20;
                    const flapSpeed = baseFlapSpeed + speedFactor;
                    
                    const flapPattern = Math.sin(STATE.time * userData.wingFlapSpeed * flapSpeed);
                    const wingAngle = Math.pow(Math.abs(flapPattern), 0.7) * Math.sign(flapPattern) * 0.9;
                    
                    userData.leftWing.rotation.y = wingAngle;
                    userData.rightWing.rotation.y = -wingAngle;
                } else {
                    userData.waitTime++;
                    
                    const restingFlapSpeed = 3;
                    const restingFlapAmount = 0.3;
                    
                    if (Math.sin(STATE.time * 2) > 0.7) {
                        const restingFlap = Math.sin(STATE.time * userData.wingFlapSpeed * restingFlapSpeed) * restingFlapAmount;
                        userData.leftWing.rotation.y = restingFlap;
                        userData.rightWing.rotation.y = -restingFlap;
                    } else {
                        userData.leftWing.rotation.y = 0.1;
                        userData.rightWing.rotation.y = -0.1;
                    }
                    
                    if (userData.waitTime > userData.maxWaitTime) {
                        userData.isWaiting = false;
                    }
                }
            });
        },
        
        animatePollenParticles: function() {
            const positions = pollenSystem.geometry.attributes.position.array;
            const velocities = pollenSystem.userData.velocities;
            const originalSizes = pollenSystem.userData.originalSizes;
            
            if (!pollenSystem.geometry.attributes.size) {
                pollenSystem.geometry.setAttribute('size', new THREE.Float32BufferAttribute(new Float32Array(originalSizes.length), 1));
            }
            
            const sizeAttribute = pollenSystem.geometry.attributes.size.array;
            
            for (let i = 0; i < positions.length / 3; i++) {
                positions[i * 3] += velocities[i].x + Math.sin(STATE.time * 0.5 + i) * 0.003;
                positions[i * 3 + 1] += velocities[i].y + Math.cos(STATE.time * 0.3 + i) * 0.003;
                positions[i * 3 + 2] += velocities[i].z + Math.sin(STATE.time * 0.4 + i) * 0.003;
                
                const sizePulse = 0.8 + 0.2 * Math.sin(STATE.time * 0.2 + i * 0.1);
                sizeAttribute[i] = originalSizes[i] * sizePulse;
                
                if (positions[i * 3 + 1] < 0.2) {
                    velocities[i].y = Math.abs(velocities[i].y);
                }
                
                if (Math.abs(positions[i * 3]) > 25) velocities[i].x *= -1;
                if (positions[i * 3 + 1] > 3) velocities[i].y *= -1;
                if (Math.abs(positions[i * 3 + 2]) > 25) velocities[i].z *= -1;
            }
            
            pollenSystem.geometry.attributes.position.needsUpdate = true;
            pollenSystem.geometry.attributes.size.needsUpdate = true;
        },
        
        animateMist: function() {
            groundMist.children.forEach(mistPatch => {
                mistPatch.children.forEach(mistParticle => {
                    const userData = mistParticle.userData;
                    
                    mistParticle.position.y = userData.originalY + 
                        Math.sin(STATE.time * userData.floatSpeed + userData.phase) * userData.floatHeight;
                    
                    const opacityFactor = 0.85 + Math.sin(STATE.time * userData.opacitySpeed + userData.phase) * 0.15;
                    mistParticle.material.opacity = Math.min(0.1, userData.originalOpacity * opacityFactor);
                    
                    mistParticle.position.x += Math.sin(STATE.time * 0.005 + userData.phase) * 0.001;
                    mistParticle.position.z += Math.cos(STATE.time * 0.005 + userData.phase + Math.PI/4) * 0.001;
                    
                    const newX = mistParticle.position.x;
                    const newZ = mistParticle.position.z;
                    
                    const terrainY = calculateTerrainHeight(newX, newZ);
                    
                    userData.originalY += (terrainY + 0.02 - userData.originalY) * 0.001;
                });
            });
        }
    };

    AnimationController.animate();
}

