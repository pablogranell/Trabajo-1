import * as THREE from 'three';

export class LoadingManager {
    constructor() {
        this.manager = new THREE.LoadingManager();
        this.textureLoader = new THREE.TextureLoader(this.manager);
        this.loadingScreen = document.getElementById('loading-screen');
        this.loadingBar = document.getElementById('loading-bar');
        this.loadingPercentage = document.getElementById('loading-percentage');
        this.isLoading = true;
        this.setupLoadingManager();
        this.preloadTextures();
    }

    setupLoadingManager() {
        this.manager.onStart = (url, itemsTotal) => {
            this.isLoading = true;
        };

        this.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            this.loadingBar.style.width = `${progress}%`;
            this.loadingPercentage.textContent = `${Math.round(progress)}%`;
        };

        this.manager.onLoad = () => {
            this.isLoading = false;
            
            setTimeout(() => {
                this.loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    // Para que "empezar" se alinee con el fade in
                    this.loadingScreen.style.display = 'none';
                }, 1000);
            }, 1000);
        };
    }

    getManager() {
        return this.manager;
    }

    preloadTextures() {
        // Cargar texturas en la pantalla de carga
        for(let i = 0; i < 200; i++) {
            this.textureLoader.load('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAwAEAAAIBRAA7');
            this.textureLoader.load('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAAdBAAEAAAIBRAA7');
            this.textureLoader.load('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBrRAA7');
            this.textureLoader.load('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAArIBRAA7');
            this.textureLoader.load('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAw2AAIBRAA7');
            this.textureLoader.load('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRArA7');
        }
    }  
}
