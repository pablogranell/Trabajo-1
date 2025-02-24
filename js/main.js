import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { LoadingManager } from './loaders.js';

class Scene {
    constructor() {
        this.loading();
        this.init();
        this.setupControls();
        this.setupEventListeners();
        this.sceneInit();
        this.animate();
    }

    loading() {
        this.loadingManager = new LoadingManager();
        
        const textureLoader = new THREE.TextureLoader(this.loadingManager.getManager());
        
        // Cargar texturas en la pantalla de carga
        for(let i = 0; i < 200; i++) {
            textureLoader.load('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAwAEAAAIBRAA7');
            textureLoader.load('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAAdBAAEAAAIBRAA7');
            textureLoader.load('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBrRAA7');
            textureLoader.load('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAArIBRAA7');
            textureLoader.load('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAw2AAIBRAA7');
            textureLoader.load('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRArA7');
            
        }
    }

    init() {
        // Inicializar motor de renderizado
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = null;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.prevTime = performance.now();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('scene-container').appendChild(this.renderer.domElement);
        this.camera.position.y = 1.6; // Altura de la camara, mas o menos
        this.isPaused = false;
    }

    setupControls() {
        this.controls = new PointerLockControls(this.camera, document.body);

        const sceneContainer = document.getElementById('scene-container');
        sceneContainer.style.filter = 'blur(5px)';
        sceneContainer.style.transition = 'filter 0.5s';
        const startButton = document.createElement('button');
        startButton.textContent = 'Empezar';
        startButton.style.position = 'absolute';
        startButton.style.top = '50%';
        startButton.style.left = '50%';
        startButton.style.transform = 'translate(-50%, -50%)';
        startButton.style.padding = '40px 80px';
        startButton.style.borderRadius = '50px';
        startButton.style.fontSize = '40px';
        startButton.style.fontWeight = 'bold';
        startButton.style.borderColor = 'white';
        startButton.style.borderWidth = '2px';
        startButton.style.borderStyle = 'solid';
        document.body.appendChild(startButton);

        startButton.addEventListener('click', () => {
            this.controls.lock();
            startButton.style.display = 'none';
            startButton.textContent = 'Continuar';
        });
        
        this.controls.addEventListener('lock', () => {
            startButton.style.display = 'none';
            this.isPaused = false;
            sceneContainer.style.filter = 'none';
        });
        this.controls.addEventListener('unlock', () => {
            startButton.style.display = 'block';
            this.isPaused = true;
            sceneContainer.style.filter = 'blur(5px)';
            this.velocity.set(0, 0, 0);
            
        });

        const loadingScreen = document.getElementById('loading-screen');
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.style.display === 'none') {
                    startButton.style.display = 'block';
                    observer.disconnect();
                }
            });
        });
        observer.observe(loadingScreen, { attributes: true, attributeFilter: ['style'] });
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Movement controls
        const onKeyDown = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = true;
                    break;
            }
        };

        const onKeyUp = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = false;
                    break;
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
    }

    sceneInit() {
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x808080,
            side: THREE.DoubleSide 
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = Math.PI / 2;
        this.scene.add(floor);

        // Add some cubes for reference
        for (let i = 0; i < 10; i++) {
            const geometry = new THREE.BoxGeometry();
            const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.x = (Math.random() - 0.5) * 10;
            cube.position.z = (Math.random() - 0.5) * 10;
            cube.position.y = 0.5;
            this.scene.add(cube);
        }

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
    }

    updateMovement() {
        if (this.isPaused) return;

        const time = performance.now();
        const delta = (time - this.prevTime) / 1000;

        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;

        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        if (this.moveForward || this.moveBackward) {
            this.velocity.z -= this.direction.z * 50.0 * delta;
        }
        if (this.moveLeft || this.moveRight) {
            this.velocity.x -= this.direction.x * 50.0 * delta;
        }

        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);

        this.prevTime = time;
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.updateMovement();
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the application
new Scene();
