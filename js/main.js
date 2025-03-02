import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import { LoadingManager } from './loaders.js';
import { sceneInit } from './world.js';
import { update } from './update.js';

class Scene {
    constructor() {
        // Asignar la instancia actual a window.mainScene para acceso global
        window.mainScene = this;
        
        this.loadingManager = new LoadingManager();
        this.init();
        this.setupControls();
        this.setupEventListeners();
        // Pass loadingManager as the second parameter
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
        
        // Variables para el banco
        this.isSitting = false;
        this.nearBench = false;
        this.bench = null;
        this.standingHeight = 1.8; // Altura normal de pie
        this.sittingHeight = 1.8; // Altura cuando está sentado
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
                    // Interacción con el banco
                    if (this.nearBench && !this.isSitting) {
                        this.sitOnBench();
                    } else if (this.isSitting) {
                        this.standUp();
                    }
                    break;
                case 'KeyZ':
                    // Recargar página si está sentado
                    if (this.isSitting) {
                        location.reload();
                    }
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

    // Método para sentarse en el banco
    sitOnBench() {
        if (!this.bench) return;
        
        this.isSitting = true;
        
        // Posicionar al jugador en el banco
        const benchPosition = this.bench.position.clone();
        
        // Ajustar la posición para que el jugador quede correctamente sentado
        benchPosition.y += this.sittingHeight;
        
        // Orientar la cámara para mirar al frente del banco
        const currentRotation = this.camera.rotation.y;
        
        // Guardar la posición actual para cuando se levante
        this.standingPosition = this.camera.position.clone();
        
        // Posicionar cámara en el banco
        this.camera.position.copy(benchPosition);
        
        // Deshabilitar movimiento
        this.moveForward = this.moveBackward = this.moveLeft = this.moveRight = false;
        
        // Mostrar mensaje de ayuda
        this.showHelpMessage("Pulsa E para levantarte, Z para recargar el jardín");
    }

    // Método para levantarse del banco
    standUp() {
        this.isSitting = false;
        
        if (this.standingPosition) {
            // Restaurar posición anterior, pero manteniendo la rotación actual
            const currentRotation = this.camera.rotation.clone();
            this.camera.position.copy(this.standingPosition);
            this.camera.rotation.copy(currentRotation);
        } else {
            // Si no tenemos posición anterior, simplemente nos levantamos en el mismo sitio
            this.camera.position.y = this.standingHeight;
        }
        
        // Ocultar mensaje de ayuda
        this.hideHelpMessage();
    }

    // Método para mostrar mensaje de ayuda
    showHelpMessage(text) {
        let helpMsg = document.getElementById('help-message');
        
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
            helpMsg.style.zIndex = '1000';
            document.body.appendChild(helpMsg);
        }
        
        helpMsg.textContent = text;
        helpMsg.style.display = 'block';
    }

    // Método para ocultar mensaje de ayuda
    hideHelpMessage() {
        const helpMsg = document.getElementById('help-message');
        if (helpMsg) {
            helpMsg.style.display = 'none';
        }
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        update(this);
        this.renderer.render(this.scene, this.camera);
    }
}

new Scene();
