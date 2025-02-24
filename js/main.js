import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { LoadingManager } from './loaders.js';
import { sceneInit } from './world.js';
import { update } from './update.js';

class Scene {
    constructor() {
        this.loadingManager = new LoadingManager();
        this.init();
        this.setupControls();
        this.setupEventListeners();
        sceneInit(this.scene);
        this.animate();
    }

    init() {
        // Inicializar three.js
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb);
        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('scene-container').appendChild(this.renderer.domElement);
        //Estado inicial
        this.controls = null;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.prevTime = performance.now();
        this.camera.position.y = 1.6; // Altura de la camara, mas o menos
        this.isPaused = false;
    }

    setupControls() {
        this.controls = new PointerLockControls(this.camera, document.body);
        //Contenedor de la escena
        const sceneContainer = document.getElementById('scene-container');
        sceneContainer.style.filter = 'blur(5px)';
        sceneContainer.style.transition = 'filter 1.2s';
        const startButton = document.createElement('button');
        startButton.id = 'start-button';
        startButton.textContent = 'Empezar';
        document.body.appendChild(startButton);
        // Boton para empezar el juego
        startButton.addEventListener('click', () => {
            this.controls.lock();
            startButton.style.display = 'none';
            startButton.textContent = 'Continuar';
        });
        //Boton para continuar el juego
        this.controls.addEventListener('lock', () => {
            sceneContainer.style.filter = 'none';
            startButton.style.display = 'none';
            this.isPaused = false;
        });
        //Boton para parar el juego
        this.controls.addEventListener('unlock', () => {
            sceneContainer.style.filter = 'blur(5px)';
            startButton.style.opacity = '0';
            startButton.style.display = 'block';
            setTimeout(() => {
                startButton.style.opacity = '1';
            }, 1000);
            this.isPaused = true;
            //Para que el jugador no se mueva
            this.velocity.set(0, 0, 0);
            this.moveForward = this.moveBackward = this.moveLeft = this.moveRight = false;
        });
        // Verifica si la pantalla de carga esta oculta
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
        // Para ajustar la camara a la pantalla
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        // Movimiento del jugador
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
        // Movimiento del jugador
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

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        update(this);
        this.renderer.render(this.scene, this.camera);
    }
}

new Scene();
