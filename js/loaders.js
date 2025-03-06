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
}
