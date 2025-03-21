import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const CONFIG = {
    WORLD: {
        SIZE: 50,
        TERRAIN_SEGMENTS: 64,
        FOG_DENSITY: 0.005 + Math.random() * 0.02
    },
    
    COUNTS: {
        GRASS_INSTANCES_MAX: 200000,
        TREE_COUNT: 50,
        FLOWER_COUNT: 150,
        BIRD_COUNT: 10,
        BUTTERFLY_COUNT: 50,
        CLOUD_COUNT: 100,
        POLLEN_PARTICLES_COUNT: 1000
    },
    
    COLORS: {
        GROUND_COLOR: (() => {
            const groundColors = [
                0x5ab950, // Verde claro
                0x4a8e3f, // Verde oscuro
                0x7d5d3b, // Marrón tierra
                0x8b7355, // Marrón claro
                0x6b5335, // Marrón oscuro
                0x8e7f5d, // Beige tierra
                0x5c4033, // Marrón rojizo
                0xff6b6b, // Rojo coral
                0x9370db, // Púrpura medio
                0x00ced1, // Turquesa oscuro
                0xff8c00, // Naranja oscuro
                0x9932cc, // Orquídea oscuro
                0x1e90ff, // Azul dodger
                0xffd700  // Oro
            ];
            // Seleccionar un color aleatorio del array
            return groundColors[Math.floor(Math.random() * groundColors.length)];
        })(),
        GRASS_COLOR: 0x5ab950, // Verde claro
        TRUNK_COLOR: 0x4a2f21, // Marrón oscuro
        BIRCH_TRUNK_COLOR: 0xd3d3d3 // Gris
    },
    
    POSITIONS: {
        TREE_SPAWN_RADIUS: 50,
        BENCH_POSITION: new THREE.Vector3(-5, 0.5, 5),
        BENCH_INTERACTION_RADIUS: 2,
        MIN_TREE_DISTANCE_FROM_BENCH: 3,
        FLOWER_SPAWN_RADIUS: 50,
        CLOUD_SPAWN_RADIUS: 500,
        CLOUD_HEIGHT_MIN: 25,
        CLOUD_HEIGHT_MAX: 50,
        SUN_POSITION: { phi: Math.PI * 0.1, theta: Math.PI * 0.1 }
    },
    
    ANIMATION: {
        WIND_STRENGTH: 0.01 + Math.random() * 0.19,
        SKYBOX_ROTATION_SPEED: 0.0005,
        CLOUD_MOVEMENT_SPEED_MIN: 0.1,
        CLOUD_MOVEMENT_SPEED_MAX: 0.5,
        BIRD_SPEED_MIN: 0.0005,
        BIRD_SPEED_MAX: 0.0025,
        BUTTERFLY_SPEED_MIN: 0.01,
        BUTTERFLY_SPEED_MAX: 0.05
    },
    
    LIGHTING: {
        AMBIENT_LIGHT_INTENSITY: 1,
        SUN_LIGHT_INTENSITY: 100,
        SUN_LIGHT_COLOR: 0xfffaed,
        SKY_ANALYSIS: {
            ENABLED: true,
            SAMPLE_SIZE: 128,
            SUN_SEARCH_RADIUS: 0.1
        }
    }
};

const STATE = {
    grassInstances: [],
    grassVisibility: [],
    grassDistances: [],
    cullingFrequency: 0, // Variable abajo
    cullingFrameCount: 0,
    flowers: [],
    trees: [],
    birds: [],
    butterflies: [],
    clouds: [],
    time: 0,
    skyAnalysis: {
        dominantColor: new THREE.Color(CONFIG.LIGHTING.SUN_LIGHT_COLOR),
        sunPosition: new THREE.Vector3(5, 10, 5),
        lastUpdateTime: 0
    },
    fpsCounter: {
        enabled: false,
        frames: 0,
        lastTime: performance.now(),
        element: null
    }
};

export let sky = null;

function analyzeSkyTexture(texture, options = {}) {
    if (!texture || !texture.image) return null;
    
    const defaults = {
        sampleSize: CONFIG.LIGHTING.SKY_ANALYSIS.SAMPLE_SIZE,
        sunSearchRadius: CONFIG.LIGHTING.SKY_ANALYSIS.SUN_SEARCH_RADIUS,
        sunPhi: CONFIG.POSITIONS.SUN_POSITION.phi,
        sunTheta: CONFIG.POSITIONS.SUN_POSITION.theta
    };
    
    const opts = {...defaults, ...options};
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    canvas.width = texture.image.width;
    canvas.height = texture.image.height;
    ctx.drawImage(texture.image, 0, 0);
    
    const sunX = Math.floor(canvas.width * (0.5 + opts.sunTheta / Math.PI));
    const sunY = Math.floor(canvas.height * (0.5 - opts.sunPhi / Math.PI));
    
    const halfSize = Math.floor(opts.sampleSize / 2);
    const startX = Math.max(0, sunX - halfSize);
    const startY = Math.max(0, sunY - halfSize);
    const endX = Math.min(canvas.width, sunX + halfSize);
    const endY = Math.min(canvas.height, sunY + halfSize);
    
    const imageData = ctx.getImageData(startX, startY, endX - startX, endY - startY);
    const pixels = imageData.data;
    
    let maxBrightness = 0;
    let brightestColor = {r: 255, g: 255, b: 237};
    
    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        
        if (brightness > maxBrightness) {
            maxBrightness = brightness;
            brightestColor = {r, g, b};
        }
    }
    
    const skyAnalysisSize = canvas.width / 3;
    const skyImageData = ctx.getImageData(
        canvas.width / 3, 
        canvas.height / 4, 
        skyAnalysisSize, 
        skyAnalysisSize / 2
    );
    const skyPixels = skyImageData.data;
    
    let totalR = 0, totalG = 0, totalB = 0;
    let count = 0;
    
    for (let i = 0; i < skyPixels.length; i += 4) {
        const r = skyPixels[i];
        const g = skyPixels[i + 1];
        const b = skyPixels[i + 2];
        
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        if (brightness < maxBrightness * 0.9 && brightness > 50) {
            totalR += r;
            totalG += g;
            totalB += b;
            count++;
        }
    }
    
    const skyColor = count > 0 ? 
        {
            r: Math.floor(totalR / count),
            g: Math.floor(totalG / count),
            b: Math.floor(totalB / count)
        } : 
        {r: 135, g: 206, b: 235};
    
    const sunColorHex = (brightestColor.r << 16) | (brightestColor.g << 8) | brightestColor.b;
    const skyColorHex = (skyColor.r << 16) | (skyColor.g << 8) | skyColor.b;
    
    const sunDirection = new THREE.Vector3();
    sunDirection.setFromSphericalCoords(1, opts.sunPhi, opts.sunTheta);
    
    return {
        dominantColor: new THREE.Color(sunColorHex),
        skyColor: new THREE.Color(skyColorHex),
        sunDirection: sunDirection
    };
}

function updateLightingFromSky(scene, sunLight, ambientLight, skyAnalysis) {
    if (!skyAnalysis) return;
    
    sunLight.color.copy(skyAnalysis.dominantColor);
    
    const luminance = 0.299 * skyAnalysis.dominantColor.r + 
                     0.587 * skyAnalysis.dominantColor.g + 
                     0.114 * skyAnalysis.dominantColor.b;
    
    const normalizedLuminance = luminance / 255;
    const minIntensity = 0.2;
    const maxIntensity = 2; 
    sunLight.intensity = minIntensity + normalizedLuminance * (maxIntensity - minIntensity);
    
    const distance = 50;
    sunLight.position.copy(skyAnalysis.sunDirection).multiplyScalar(distance);
    sunLight.lookAt(0, 0, 0);
    
    ambientLight.color.copy(skyAnalysis.skyColor);
    
    ambientLight.intensity = CONFIG.LIGHTING.AMBIENT_LIGHT_INTENSITY * 
                           (1 - normalizedLuminance * 0.3);
    
    if (scene.fog) {
        scene.fog.color.copy(skyAnalysis.skyColor);
    }
    
    updateEnvironmentColors(scene, skyAnalysis);
}

function updateEnvironmentColors(scene, skyAnalysis) {
    if (!skyAnalysis) return;
    
    const skyColor = skyAnalysis.skyColor;
    
    const groundColor = new THREE.Color();
    groundColor.copy(skyColor);
    
    groundColor.r = Math.max(0.2, Math.min(0.8, groundColor.r * 0.8));
    groundColor.g = Math.max(0.3, Math.min(0.9, groundColor.g * 1.2));
    groundColor.b = Math.max(0.1, Math.min(0.7, groundColor.b * 0.6));
    
    const grassColor = new THREE.Color();
    grassColor.copy(skyColor);
    
    grassColor.r = Math.max(0.1, Math.min(0.6, grassColor.r * 0.5));
    grassColor.g = Math.max(0.4, Math.min(1.0, grassColor.g * 1.5));
    grassColor.b = Math.max(0.1, Math.min(0.5, grassColor.b * 0.4));
    
    const flowerColor = new THREE.Color();
    flowerColor.copy(skyColor);
    
    flowerColor.r = Math.max(0.5, Math.min(1.0, flowerColor.r * 1.5));
    flowerColor.g = Math.max(0.3, Math.min(0.9, flowerColor.g * 0.9));
    flowerColor.b = Math.max(0.4, Math.min(1.0, flowerColor.b * 1.2));
    
    const leafColor = new THREE.Color();
    leafColor.copy(skyColor);
    
    leafColor.r = Math.max(0.1, Math.min(0.5, leafColor.r * 0.4));
    leafColor.g = Math.max(0.3, Math.min(0.9, leafColor.g * 1.3));
    leafColor.b = Math.max(0.1, Math.min(0.4, leafColor.b * 0.3));
    
    CONFIG.COLORS.GROUND_COLOR = groundColor.getHex();
    CONFIG.COLORS.GRASS_COLOR = grassColor.getHex();
    scene.traverse((object) => {
        if (object.isMesh) {
            if (object.name === 'ground' && object.material) {
                object.material.color.copy(groundColor);
                object.material.needsUpdate = true;
            }
            
            if (object.isInstancedMesh && object.userData.type === 'grass') {
                object.material.color.copy(grassColor);
                object.material.needsUpdate = true;
            }
            
            if (object.userData.type === 'flower') {
                const hue = (flowerColor.getHSL({}).h + Math.random() * 0.2 - 0.1) % 1;
                const saturation = Math.min(1, flowerColor.getHSL({}).s * (0.8 + Math.random() * 0.4));
                const lightness = Math.min(0.8, flowerColor.getHSL({}).l * (0.8 + Math.random() * 0.4));
                
                object.material.color.setHSL(hue, saturation, lightness);
                object.material.needsUpdate = true;
            }
            
            if (object.userData.type === 'leaf') {
                object.material.color.copy(leafColor);
                object.material.needsUpdate = true;
            }
        }
    });
}

function createGrassBlade() {
    const height = 0.5 + Math.random() * 0.5;
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
    group.userData.type = 'treeGroup';
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
            trunk.userData.type = 'trunk';
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
                cone.userData.type = 'leaf';
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
            oakTrunk.userData.type = 'trunk';
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
                
                foliage.userData.type = 'leaf';
                foliages.push(foliage);
                
                group.add(foliage);
            }
            break;

        case 2:
            const birchTrunkHeight = 4 + Math.random() * 0.5;
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
            birchTrunk.userData.type = 'trunk';
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
                leaves.userData.type = 'leaf';
                
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

function createFlower(loadingManager, type = Math.floor(Math.random() * 4)) {
    const group = new THREE.Group();
    group.userData.type = 'flowerGroup';
    
    switch(type) {
        case 0:
            const fbxLoader = new FBXLoader(loadingManager.getManager());
            fbxLoader.load('modelos/3D/dandelion-low-poly/source/Dandelion Unwrapped.fbx', (dandelion) => {
                const textureLoader = loadingManager.textureLoader;
                const texture = textureLoader.load('modelos/3D/dandelion-low-poly/source/Dandelion Texture.png');
                texture.colorSpace = THREE.sRGBEncoding;
                texture.flipY = true;
                
                dandelion.scale.set(0.01, 0.01, 0.01);
                
                dandelion.traverse((child) => {
                    if (child.isMesh) {
                        const material = new THREE.MeshStandardMaterial({
                            map: texture,
                        });
                        
                        child.material = material;
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.userData.type = 'flower';
                    }
                });
                
                group.add(dandelion);
            });
            break;
        case 1:
            const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8);
            const stemMaterial = new THREE.MeshPhongMaterial({ color: 0x2d5a27 });
            const stem = new THREE.Mesh(stemGeometry, stemMaterial);
            stem.position.y = 0.25;
            stem.userData.type = 'stem';
            group.add(stem);

            const bellGeometry = new THREE.ConeGeometry(0.12, 0.2, 8, 1, true);
            const bellMaterial = new THREE.MeshPhongMaterial({ 
                color: new THREE.Color().setHSL(Math.random() * 0.2 + 0.7, 0.8, 0.6),
                side: THREE.DoubleSide
            });
            const bell = new THREE.Mesh(bellGeometry, bellMaterial);
            bell.position.y = 0.72;
            bell.rotation.x = Math.PI;
            bell.userData.type = 'flower';
            group.add(bell);
            break;

        case 2:
            const fbxLoader2 = new FBXLoader(loadingManager.getManager());
            fbxLoader2.load('modelos/3D/vervain-low-poly/source/Vervain Unwrapped.fbx', (vervain) => {
                const textureLoader = loadingManager.textureLoader;
                const texture = textureLoader.load('modelos/3D/vervain-low-poly/source/Vervain Texture.png');
                texture.colorSpace = THREE.sRGBEncoding;
                texture.flipY = true;
                
                vervain.scale.set(0.003, 0.003, 0.003);
                
                vervain.traverse((child) => {
                    if (child.isMesh) {
                        const material = new THREE.MeshStandardMaterial({
                            map: texture,
                        });
                        
                        child.material = material;
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.userData.type = 'flower';
                    }
                });
                
                group.add(vervain);
            });
            break;
        case 3:
            const glbLoader = new GLTFLoader(loadingManager.getManager());
            glbLoader.load('modelos/3D/low_poly_flowers.glb', (rose) => {
                group.add(rose.scene);
            });
            break;
    }

    return group;
}

function createFPSCounter() {
    const fpsDiv = document.createElement('div');
    fpsDiv.id = 'fps-counter';
    fpsDiv.style.position = 'fixed';
    fpsDiv.style.top = '10px';
    fpsDiv.style.left = '10px';
    fpsDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    fpsDiv.style.color = 'white';
    fpsDiv.style.padding = '5px 10px';
    fpsDiv.style.borderRadius = '5px';
    fpsDiv.style.fontFamily = 'Arial, sans-serif';
    fpsDiv.style.fontSize = '14px';
    fpsDiv.style.display = 'none';
    document.body.appendChild(fpsDiv);
    return fpsDiv;
}

export function toggleFPSCounter() {
    STATE.fpsCounter.enabled = !STATE.fpsCounter.enabled;
    if (!STATE.fpsCounter.element) {
        STATE.fpsCounter.element = createFPSCounter();
    }
    STATE.fpsCounter.element.style.display = STATE.fpsCounter.enabled ? 'block' : 'none';
    STATE.fpsCounter.lastTime = performance.now();
    STATE.fpsCounter.frames = 0;
}

export function sceneInit(scene, loadingManager) {
    const size = CONFIG.WORLD.SIZE;
    const segments = CONFIG.WORLD.TERRAIN_SEGMENTS;
    const halfSize = size / 2;
    
    if (!STATE.fpsCounter.element) {
        STATE.fpsCounter.element = createFPSCounter();
        document.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'f') {
                toggleFPSCounter();
            }
        });
    }
    
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
    ground.name = 'ground';
    ground.userData.type = 'ground';
    scene.add(ground);

    const skyboxNumber = Math.floor(Math.random() * 13) + 1; // Fondo aleatorio (13)
    sky = skyboxNumber;
    const skyboxPath = `modelos/Cielos/sky${skyboxNumber}.png`;
    console.log(`Cargando skybox: ${skyboxPath}`);

    const skyTexture = loadingManager.textureLoader.load(skyboxPath, (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        
        if (CONFIG.LIGHTING.SKY_ANALYSIS.ENABLED && texture.image) {
            const skyAnalysis = analyzeSkyTexture(texture);
            if (skyAnalysis) {
                STATE.skyAnalysis.dominantColor = skyAnalysis.dominantColor;
                STATE.skyAnalysis.sunPosition = skyAnalysis.sunDirection.clone().multiplyScalar(50);
                
                if (window.mainScene && window.mainScene.sunLight && window.mainScene.ambientLight) {
                    updateLightingFromSky(
                        scene,
                        window.mainScene.sunLight,
                        window.mainScene.ambientLight,
                        skyAnalysis
                    );
                } else {
                    updateEnvironmentColors(scene, skyAnalysis);
                }
            }
        }
    });

    scene.background = skyTexture;
    scene.fog = new THREE.FogExp2(CONFIG.COLORS.FOG_COLOR, CONFIG.WORLD.FOG_DENSITY);

    const fbxLoader = new FBXLoader(loadingManager.getManager());
    fbxLoader.load('modelos/3D/StoneBench_01_M13/Source/stone_bench_01_m13.fbx', (bench) => {
        // Cargar texturas (creo que js ya hace algo implicito)
        const textureLoader = loadingManager.textureLoader;
        const baseColorTexture = textureLoader.load('modelos/3D/StoneBench_01_M13/Textures/stone_bench_01_m13_Base_color.png');
        const normalTexture = textureLoader.load('modelos/3D/StoneBench_01_M13/Textures/stone_bench_01_m13_Normal_GL.png');
        const roughnessTexture = textureLoader.load('modelos/3D/StoneBench_01_M13/Textures/stone_bench_01_m13_Roughness.png');

        // Configurar texturas (blender standar)
        baseColorTexture.colorSpace = THREE.sRGBEncoding;
        baseColorTexture.flipY = true;
        normalTexture.flipY = true;
        roughnessTexture.flipY = true;

        bench.scale.set(0.7, 1.2, 0.7);
        bench.position.copy(CONFIG.POSITIONS.BENCH_POSITION);
        
        bench.traverse((child) => {
            if (child.isMesh) {
                const material = new THREE.MeshStandardMaterial({
                    map: baseColorTexture,
                    normalMap: normalTexture,
                    roughnessMap: roughnessTexture,
                    roughness: 1.0,
                    metalness: 0.0,
                    emissive: new THREE.Color(0x88ffaa),
                    emissiveIntensity: 0.1
                });
                
                child.onBeforeRender = function(renderer, scene, camera) {
                    const cameraPosition = new THREE.Vector3();
                    camera.getWorldPosition(cameraPosition);
                    const objectPosition = new THREE.Vector3();
                    child.getWorldPosition(objectPosition);
                    const viewDirection = new THREE.Vector3().subVectors(cameraPosition, objectPosition).normalize();
                    const normal = new THREE.Vector3(0, 1, 0);
                    const fresnelFactor = Math.pow(1.0 - Math.abs(normal.dot(viewDirection)), 4.0);
                    material.emissiveIntensity = 0.1 + fresnelFactor * 0.5;
                };
                
                child.material = material;
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
    // Para que no se vea raro el cesped
    CONFIG.COLORS.GRASS_COLOR = CONFIG.COLORS.GROUND_COLOR;
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

    instancedGrass.name = 'grass';
    instancedGrass.userData.type = 'grass';
    instancedGrass.castShadow = true;
    instancedGrass.receiveShadow = true;
    instancedGrass.material.side = THREE.DoubleSide;
    instancedGrass.frustumCulled = false; //Manual para asi ajustar tambien el viento
    
    const matrix = new THREE.Matrix4();
    let instanceCount = 0;
    
    for (let i = 0; i < CONFIG.COUNTS.GRASS_INSTANCES_MAX; i++) {
        const x = (Math.random() - 0.5) * CONFIG.WORLD.SIZE;
        const z = (Math.random() - 0.5) * CONFIG.WORLD.SIZE;
        const angle = Math.random() * Math.PI;
        const y = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.5 +
                    Math.sin(x * 0.2) * Math.cos(z * 0.3);
        
        const scale = 1 + Math.random() * 0.5;
        
        matrix.makeRotationY(angle);
        matrix.scale(new THREE.Vector3(scale, 1, scale));
        matrix.setPosition(x, y, z);
        
        instancedGrass.setMatrixAt(instanceCount, matrix);
        STATE.grassInstances.push({
            position: new THREE.Vector3(x, y, z),
            baseRotation: angle,
            scale: scale
        });
        
        STATE.grassVisibility.push(true);
        STATE.grassDistances.push(0);
        
        instanceCount++;
    }
    instancedGrass.count = instanceCount;
    instancedGrass.instanceMatrix.needsUpdate = true;
    scene.add(instancedGrass);

    STATE.grassMesh = instancedGrass;

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
                 Math.sin(x * 0.2) * Math.cos(z * 0.3);
        
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
                 Math.sin(x * 0.2) * Math.cos(z * 0.3);
        
        const flower = createFlower(loadingManager);
        flower.position.set(x, y, z);
        flower.rotation.y = Math.random() * Math.PI * 2;
        STATE.flowers.push(flower);
        scene.add(flower);
    }

    //Luces iniciales
    const ambientLight = new THREE.AmbientLight(0xffffff, CONFIG.LIGHTING.AMBIENT_LIGHT_INTENSITY);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(CONFIG.LIGHTING.SUN_LIGHT_COLOR, CONFIG.LIGHTING.SUN_LIGHT_INTENSITY);
    sunLight.position.set(5, 10, 5);
    sunLight.castShadow = true;
    
    scene.add(sunLight);
    
    window.mainScene.sunLight = sunLight;
    window.mainScene.ambientLight = ambientLight;
    
    // Generador de ambiente v2
    if (STATE.skyAnalysis.dominantColor) {
        const skyAnalysis = {
            dominantColor: STATE.skyAnalysis.dominantColor,
            skyColor: scene.fog.color,
            sunDirection: STATE.skyAnalysis.sunPosition.clone().normalize()
        };
        updateLightingFromSky(scene, sunLight, ambientLight, skyAnalysis);
    }

    function createBird() {
        const bird = new THREE.Group();
        
        const bodyGeometry = new THREE.SphereGeometry(0.05, 8, 6);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.7
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        bird.add(body);
        
        const wingShape = new THREE.Shape();
        
        wingShape.moveTo(0, 0);
        wingShape.bezierCurveTo(
            0.1, 0.02,
            0.2, 0.05,
            0.3, 0.02
        );
        wingShape.bezierCurveTo(
            0.25, 0.1,
            0.15, 0.15,
            0, 0.1
        );
        wingShape.bezierCurveTo(
            -0.05, 0.05,
            -0.05, 0.02,
            0, 0
        );
        
        const wingGeometry = new THREE.ShapeGeometry(wingShape);
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.7,
            side: THREE.DoubleSide
        });
        
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-0.1, 0, 0);
        leftWing.rotation.z = Math.PI * 0.1;
        bird.add(leftWing);
        
        const rightWing = new THREE.Mesh(wingGeometry.clone(), wingMaterial);
        rightWing.position.set(0.1, 0, 0);
        rightWing.rotation.z = -Math.PI * 0.1;
        rightWing.scale.x = -1; // Invertir el ala derecha
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
    const night = new Array(13).fill(false);
    // Manualmente, no tiene algortimo
    night[1] = true;
    night[5] = true;
    night[9] = true;
    night[10] = true;
    night[12] = true;
    if (!night[sky]) {
        for (let i = 0; i < CONFIG.COUNTS.BIRD_COUNT; i++) {
            const bird = createBird();
            scene.add(bird);
            birds.push(bird);
        }
    }
    STATE.birds = birds;

    function createCloud() {
        const cloud = new THREE.Group();
        
        const sphereCount = 3 + Math.floor(Math.random() * 3);
        
        const cloudMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: false,
            opacity: 1.0,
            roughness: 0.8
        });
        
        const coreRadius = 2.5 + Math.random() * 2;
        const core = new THREE.Mesh(
            new THREE.SphereGeometry(coreRadius, 8, 6),
            cloudMaterial
        );
        
        const flattenY = 1 + Math.random() * 0.5;
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
            speed: (CONFIG.ANIMATION.CLOUD_MOVEMENT_SPEED_MIN + Math.random() * (CONFIG.ANIMATION.CLOUD_MOVEMENT_SPEED_MAX - CONFIG.ANIMATION.CLOUD_MOVEMENT_SPEED_MIN)) * (1 + CONFIG.ANIMATION.WIND_STRENGTH),
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
        
        const y = CONFIG.POSITIONS.CLOUD_HEIGHT_MIN + Math.random() * (CONFIG.POSITIONS.CLOUD_HEIGHT_MAX - CONFIG.POSITIONS.CLOUD_HEIGHT_MIN);
        
        cloud.position.set(x, y, z);
        cloud.userData.initialPosition.copy(cloud.position);
        
        const scale = 0.4 + Math.random() * 3.0;
        cloud.scale.set(scale, scale, scale);
        
        cloud.rotation.y = Math.random() * Math.PI * 2;
        
        scene.add(cloud);
        clouds.push(cloud);
    }
    STATE.clouds = clouds;
    
    function createButterfly() {
        const butterfly = new THREE.Group();
        const night = new Array(13).fill(false);
        // Manualmente, no tiene algortimo
        night[1] = true;
        night[5] = true;
        night[9] = true;
        night[10] = true;
        night[12] = true;
        
        const isNight = night[sky];
        const hue = Math.random();
        let butterflyColor, secondaryColor;
        let luminosity = isNight ? 0.8 : 0.6;
        let saturation = isNight ? 0.9 : 0.85;
        
        if (Math.random() < 0.5) {
            butterflyColor = new THREE.Color().setHSL(hue, saturation, luminosity);
            secondaryColor = new THREE.Color().setHSL((hue + 0.1) % 1, saturation - 0.05, luminosity - 0.1);
        } else {
            butterflyColor = new THREE.Color().setHSL(hue, saturation - 0.35, luminosity + 0.1);
            secondaryColor = new THREE.Color().setHSL((hue + 0.5) % 1, saturation - 0.45, luminosity);
        }
        
        const bodyGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.1, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.8
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        butterfly.add(body);
        
        const headGeometry = new THREE.SphereGeometry(0.015, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0x303030,
            roughness: 0.7
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 0.05, 0);
        butterfly.add(head);
        
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
                roughness: 1,
                emissive: isNight ? butterflyColor : 0x000000,
                emissiveIntensity: isNight ? 1 : 0
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
                roughness: 1,
                emissive: isNight ? secondaryColor : 0x000000,
                emissiveIntensity: isNight ? 1 : 0
            });
            
            const lowerWing = new THREE.Mesh(lowerWingGeometry, lowerWingMaterial);
            
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
            bobAmount: 0.005 + Math.random() * 0.01,
            bobSpeed: 0.1 + Math.random() * 0.2
        };
        
        return butterfly;
    }
    
    const butterflies = [];
    for (let i = 0; i < CONFIG.COUNTS.BUTTERFLY_COUNT; i++) {
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
    STATE.butterflies = butterflies;
    
    function createPollenParticles() {
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = CONFIG.COUNTS.POLLEN_PARTICLES_COUNT;
        
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
            color: new THREE.Color().setHSL(Math.random(), Math.random(), Math.random()),
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


    const AnimationController = {
        lastFrameTime: performance.now(),
        animate: function() {
            const currentTime = performance.now();
            const deltaTime = (currentTime - this.lastFrameTime) / 1000;
            this.lastFrameTime = currentTime;
            
            STATE.time += deltaTime;
            
            if (STATE.fpsCounter.enabled) {
                STATE.fpsCounter.frames++;
                const elapsedTime = currentTime - STATE.fpsCounter.lastTime;
                
                if (elapsedTime >= 1000) {
                    const fps = Math.round((STATE.fpsCounter.frames * 1000) / elapsedTime);
                    if (STATE.fpsCounter.element) {
                        STATE.fpsCounter.element.textContent = `FPS: ${fps}`;
                    }
                    STATE.fpsCounter.frames = 0;
                    STATE.fpsCounter.lastTime = currentTime;
                }
            }
            
            if (window.mainScene && window.mainScene.camera) {
                const camera = window.mainScene.camera;
                STATE.cullingFrameCount++;
                if (STATE.cullingFrameCount > STATE.cullingFrequency) {
                    this.updateGrassCulling(camera);
                    STATE.cullingFrameCount = 0;
                }
            }
            
            const fps = 1000 / deltaTime;
            switch (true) {
                case fps < 20:
                    STATE.cullingFrequency = 50; // Menos frecuente si hay bajo rendimiento
                    break;
                case fps > 59:
                    STATE.cullingFrequency = 1; // Más frecuente si hay buen rendimiento
                    break;
                case fps > 40:
                    STATE.cullingFrequency = 10;
                    break;
                case fps < 30:
                    STATE.cullingFrequency = 30;
                    break;
                default:
                    STATE.cullingFrequency = 20;
                    break;
            }
            
            this.animateGrass();
            this.animateFlowers();
            this.animateTrees();
            this.animateBirds();
            this.animateClouds();
            this.animateButterflies(deltaTime);
            this.animatePollenParticles();
            
            requestAnimationFrame(() => this.animate());
        },
        
        updateGrassCulling: function(camera) {
            if (!camera || !STATE.grassMesh) return;
            
            const frustum = new THREE.Frustum();
            const projScreenMatrix = new THREE.Matrix4();
            projScreenMatrix.multiplyMatrices(
                camera.projectionMatrix,
                camera.matrixWorldInverse
            );
            frustum.setFromProjectionMatrix(projScreenMatrix);
            
            const cameraPosition = camera.position;
            const MAX_DISTANCE = 25;
            
            for (let i = 0; i < STATE.grassInstances.length; i++) {
                const grass = STATE.grassInstances[i];
                const distance = grass.position.distanceTo(cameraPosition);
                
                STATE.grassDistances[i] = distance;
                
                const isInFrustum = frustum.intersectsSphere(
                    new THREE.Sphere(grass.position, 0.5)
                );
                
                STATE.grassVisibility[i] = isInFrustum && distance < MAX_DISTANCE;
            }
        },
        
        animateGrass: function() {
            if (!STATE.grassMesh) return;
            
            const matrix = new THREE.Matrix4();
            const quaternion = new THREE.Quaternion();
            const targetQuaternion = new THREE.Quaternion();
            const zeroMatrix = new THREE.Matrix4().scale(new THREE.Vector3(0, 0, 0));
            
            const CLOSE_DISTANCE = 10;
            const MID_DISTANCE = 20;
            
            for (let i = 0; i < STATE.grassInstances.length; i++) {
                const grass = STATE.grassInstances[i];
                
                if (!STATE.grassVisibility[i]) {
                    STATE.grassMesh.setMatrixAt(i, zeroMatrix);
                    continue;
                }
                
                const distance = STATE.grassDistances[i];
                
                let windEffect;
                
                if (distance < CLOSE_DISTANCE) {
                    windEffect = 
                        Math.sin(STATE.time * 0.8 + grass.position.x * 0.05) * 0.15 +
                        Math.sin(STATE.time + grass.position.z * 0.05) * 0.1;
                } else if (distance < MID_DISTANCE) {
                    windEffect = Math.sin(STATE.time * 0.8 + grass.position.x * 0.05) * 0.1;
                }
                
                matrix.makeRotationY(grass.baseRotation);
                quaternion.setFromRotationMatrix(matrix);
                
                targetQuaternion.setFromEuler(new THREE.Euler(0, grass.baseRotation, windEffect));
                const slerpFactor = distance < CLOSE_DISTANCE ? 0.3 : 0.1;
                quaternion.slerp(targetQuaternion, slerpFactor);
                
                matrix.makeRotationFromQuaternion(quaternion);
                matrix.setPosition(grass.position.x, grass.position.y, grass.position.z);
                matrix.scale(new THREE.Vector3(grass.scale, 1, grass.scale));
                
                STATE.grassMesh.setMatrixAt(i, matrix);
            }
            STATE.grassMesh.instanceMatrix.needsUpdate = true;
        },
        
        animateFlowers: function() {
            STATE.flowers.forEach((flower, index) => {
                flower.rotation.y = Math.sin(STATE.time * 0.5 + index) * 0.2;
                flower.rotation.z = Math.sin(STATE.time + flower.position.x * 0.1) * CONFIG.ANIMATION.WIND_STRENGTH;
                flower.rotation.x = Math.sin(STATE.time * 0.7 + flower.position.z * 0.1) * (CONFIG.ANIMATION.WIND_STRENGTH * 0.7);
            });
        },
        
        animateTrees: function() {
            STATE.trees.forEach((tree) => {
                const userData = tree.userData;
                
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
                
                userData.angle += userData.speed * STATE.time * 0.05;
                bird.position.x = Math.cos(userData.angle) * userData.radius * 3;
                bird.position.z = Math.sin(userData.angle) * userData.radius * 3;
                bird.position.y = userData.height + Math.sin(userData.angle * 2) * 0.5;
                
                bird.rotation.y = userData.angle + Math.PI / 2;
                
                const wingAngle = Math.sin(STATE.time * userData.wingSpeed * 10 + userData.flapPhase) * 0.5;
                userData.leftWing.rotation.z = -Math.abs(wingAngle);
                userData.rightWing.rotation.z = Math.abs(wingAngle);
                
                userData.tail.rotation.z = Math.sin(STATE.time * 0.5 + userData.flapPhase) * 0.1;
            });
        },
        
        animateClouds: function() {
            const deltaTime = (performance.now() - this.lastFrameTime) / 1000; // Tiempo en segundos
            
            STATE.clouds.forEach(cloud => {
                const userData = cloud.userData;
                
                switch(userData.cloudType) {
                    case 0:
                        cloud.position.x += userData.direction.x * userData.speed * deltaTime;
                        cloud.position.z += userData.direction.z * userData.speed * 0.7 * deltaTime;
                        cloud.position.y = userData.initialPosition.y + Math.sin(STATE.time * 0.03) * 0.3;
                        break;
                        
                    case 1:
                        cloud.position.x += userData.direction.x * userData.speed * (0.8 + Math.sin(STATE.time * 0.1) * 0.2) * deltaTime;
                        cloud.position.z += userData.direction.z * userData.speed * (0.8 + Math.cos(STATE.time * 0.15) * 0.2) * deltaTime;
                        cloud.position.y = userData.initialPosition.y + Math.sin(STATE.time * 0.04 + cloud.position.x * 0.01) * 0.5;
                        break;
                        
                    case 2:
                        cloud.position.x += userData.direction.x * userData.speed * 0.3 * deltaTime;
                        cloud.position.z += userData.direction.z * userData.speed * 0.3 * deltaTime;
                        cloud.position.y = userData.initialPosition.y + Math.sin(STATE.time * 0.02 + cloud.position.z * 0.02) * 0.7;
                        break;
                        
                    case 3:
                        cloud.position.x += userData.direction.x * userData.speed * 0.6 * deltaTime;
                        cloud.position.z += userData.direction.z * userData.speed * 0.6 * deltaTime;
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
        
        animateButterflies: function(deltaTime) {
            STATE.butterflies.forEach(butterfly => {
                const userData = butterfly.userData;
                
                if (!userData.isWaiting) {
                    const direction = new THREE.Vector3().subVectors(
                        userData.targetPosition,
                        butterfly.position
                    );
                    
                    direction.normalize();
                    direction.multiplyScalar(userData.speed * deltaTime * 20);
                    
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
                        
                        if (Math.random() < 0.9) {
                            userData.isWaiting = true;
                            userData.waitTime = 0;
                        }
                    }
                    
                    const baseFlapSpeed = 100;
                    
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
                positions[i * 3] += (velocities[i].x + Math.sin(STATE.time * 0.5 + i) * 0.0003) * STATE.time * 0.05;
                positions[i * 3 + 1] += (velocities[i].y + Math.cos(STATE.time * 0.3 + i) * 0.0003) * STATE.time * 0.05;
                positions[i * 3 + 2] += (velocities[i].z + Math.sin(STATE.time * 0.4 + i) * 0.0003) * STATE.time * 0.05;
                
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
        }
    };

    AnimationController.animate();
}

