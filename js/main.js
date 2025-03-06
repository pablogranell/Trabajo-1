import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { LoadingManager } from './loaders.js';
import { sceneInit } from './world.js';
import { update } from './update.js';

class Scene {
    constructor() {
        window.mainScene = this;
        this.loadingManager = new LoadingManager();
        this.init();
        this.setupControls();
        this.setupAudio();
        this.setupEventListeners();
        sceneInit(this.scene, this.loadingManager);
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
        this.blurAmount = 5; // Valor inicial del blur
        this.showingControls = true;
        this.isSitting = false;
        this.nearBench = false;
        this.bench = null;
        this.standingHeight = 1.6;
        this.sittingHeight = 1.8;
    }

    setupControls() {
        this.controls = new PointerLockControls(this.camera, document.body);
        const sceneContainer = document.getElementById('scene-container');
        sceneContainer.style.filter = `blur(${this.blurAmount}px)`;
        sceneContainer.style.transition = 'filter 1.2s';
        const startContainer = document.getElementById('start-container');
        const startButton = document.getElementById('start-button');

        startButton.addEventListener('click', () => {
            // Intentar reproducir la música cuando el usuario hace clic
            if (!this.audioInitialized && this.backgroundMusic) {
                this.backgroundMusic.play().then(() => {
                    this.audioInitialized = true;
                });
            }
            this.controls.lock();
            startContainer.style.display = 'none';
            startButton.textContent = 'Continuar';
        });

        this.controls.addEventListener('lock', () => {
            sceneContainer.style.filter = 'none';
            startContainer.style.display = 'none';
            // Reañade el mensaje de interacion del banco solo si esta sentado
            const helpMsg = document.getElementById('help-message');
            if (helpMsg && this.isSitting) helpMsg.style.display = 'block';
            this.isPaused = false;
        });

        this.controls.addEventListener('unlock', () => {
            sceneContainer.style.filter = `blur(${this.blurAmount}px)`;
            startContainer.style.opacity = '0';
            startContainer.style.display = 'flex';
            if (this.showingControls) {
                setTimeout(() => {
                    startContainer.style.opacity = '1';
                }, 1000);
            } else {
                startContainer.style.opacity = '1';
            }
            this.isPaused = true;
            this.showingControls = true;
            // Oculta los mensajes de ayuda cuando está en pausa
            const helpMsg = document.getElementById('help-message');
            const benchIndicator = document.getElementById('bench-indicator');
            if (helpMsg) helpMsg.style.display = 'none';
            if (benchIndicator) benchIndicator.style.display = 'none';
            //Para que el jugador no se mueva
            this.velocity.set(0, 0, 0);
            this.moveForward = this.moveBackward = this.moveLeft = this.moveRight = false;
        });

        // Verifica si la pantalla de carga esta oculta
        const loadingScreen = document.getElementById('loading-screen');
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.style.display === 'none') {
                    startContainer.style.display = 'flex';
                    startContainer.style.opacity = '1';
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
        
        const onKeyDown = (event) => {
            // Permite teclas [P, K, L] cuando el juego está pausado o en pantalla inicial
            if (event.code === 'KeyP' || event.code === 'KeyK' || event.code === 'KeyL') {
                switch (event.code) {
                    case 'KeyP':
                        const startContainer = document.getElementById('start-container');
                        this.showingControls = !this.showingControls;
                        if (this.isPaused || !this.controls.isLocked) {
                            startContainer.style.display = this.showingControls ? 'flex' : 'none';
                            if (this.showingControls) {
                                startContainer.style.opacity = '1';
                            }
                        }
                        break;
                    case 'KeyK':
                        this.blurAmount = Math.max(0, this.blurAmount - 1);
                        if (this.isPaused || !this.controls.isLocked) {
                            document.getElementById('scene-container').style.filter = `blur(${this.blurAmount}px)`;
                        }
                        break;
                    case 'KeyL':
                        this.blurAmount = Math.min(20, this.blurAmount + 1);
                        if (this.isPaused || !this.controls.isLocked) {
                            document.getElementById('scene-container').style.filter = `blur(${this.blurAmount}px)`;
                        }
                        break;
                }
                return;
            }

            // Para el resto de teclas, no mover si está pausado
            if (this.isPaused) return;
            
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
                case 'KeyE':
                    if (this.nearBench && !this.isSitting) {
                        this.sitOnBench();
                    } else if (this.isSitting) {
                        this.standUp();
                    }
                    break;
                case 'KeyZ':
                    if (this.isSitting) {
                        location.reload();
                    }
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

    sitOnBench() {
        this.isSitting = true;
        const height = this.bench.position.clone();
        height.y += this.sittingHeight;
        this.standingPosition = this.camera.position.clone();
        this.camera.position.copy(height);
        this.showHelpMessage("Pulsa E para levantarte, Z para recargar el jardín");
    }

    standUp() {
        this.isSitting = false;
        
        if (this.standingPosition) {
            // Restaurar posición anterior, pero manteniendo la rotación actual
            const currentRotation = this.camera.rotation.clone();
            this.camera.position.copy(this.standingPosition);
            this.camera.rotation.copy(currentRotation);
        }

        // Ocultar mensaje de ayuda
        const helpMsg = document.getElementById('help-message');
        helpMsg.style.display = 'none';
    }

    showHelpMessage(text) {
        let helpMsg = document.getElementById('help-message');
        
        // La primera vez
        if (!helpMsg) {
            helpMsg = document.createElement('div');
            helpMsg.id = 'help-message';
            helpMsg.style.position = 'fixed';
            helpMsg.style.bottom = '20px';
            helpMsg.style.left = '50%';
            helpMsg.style.transform = 'translateX(-50%)';
            helpMsg.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            helpMsg.style.color = 'white';
            helpMsg.style.padding = '10px 20px';
            helpMsg.style.borderRadius = '5px';
            helpMsg.style.fontFamily = 'Arial, sans-serif';
            document.body.appendChild(helpMsg);
        }
        
        helpMsg.textContent = text;
        helpMsg.style.display = 'block';
    }

    setupAudio() {
        this.backgroundMusic = new Audio('modelos/01ambienteparque01.wav');
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.2;
        this.audioInitialized = false;
        
        // Silenciar cuando se cambia de pestaña
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.audioInitialized) {
                    this.backgroundMusic.pause();
                }
            } else if (this.audioInitialized) {
                this.backgroundMusic.play();
            }
        });
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        update(this);
        this.renderer.render(this.scene, this.camera);
    }
}

new Scene();
