// init.js - Unified Initialization Script for SpaceXpanse Battleships
// Coordinates all components and prevents initialization conflicts

class AppInitializer {
    constructor() {
        this.initialized = false;
        this.components = {
            config: false,
            credentialManager: false,
            credentialUI: false,
            rodBlockchain: false,
            rodCredentials: false,
            registration: false,
            game: false
        };
    }

    async initialize() {
        if (this.initialized) {
            console.log('App already initialized');
            return;
        }

        console.log('🚀 Starting SpaceXpanse Battleships initialization...');

        try {
            // Step 1: Load configuration first
            await this.initializeConfig();
            
            // Step 2: Initialize credential manager
            await this.initializeCredentialManager();
            
            // Step 3: Initialize credential UI
            await this.initializeCredentialUI();
            
            // Step 4: Initialize ROD blockchain service (with proper error handling)
            await this.initializeRODBlockchain();
            
            // Step 4: Initialize credential integration
            await this.initializeRODCredentials();
            
            // Step 5: Initialize registration manager
            await this.initializeRegistration();
            
            // Step 6: Initialize game engine
            await this.initializeGame();
            
            this.initialized = true;
            console.log('✅ App initialization completed successfully');
            
            // Notify that app is ready
            document.dispatchEvent(new CustomEvent('appReady'));
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    async initializeConfig() {
        console.log('📋 Loading configuration...');
        // config.js is loaded via script tag and runs immediately
        this.components.config = true;
        console.log('✅ Configuration loaded');
    }

    async initializeCredentialManager() {
        console.log('🔐 Initializing credential manager...');
        // credential-manager.js creates global instance immediately
        if (typeof credentialManager !== 'undefined') {
            this.components.credentialManager = true;
            console.log('✅ Credential manager initialized');
        } else {
            throw new Error('Credential manager not loaded');
        }
    }

    async initializeCredentialUI() {
        console.log('🎨 Initializing credential UI...');
        
        if (typeof credentialUI !== 'undefined') {
            credentialUI.init();
            this.components.credentialUI = true;
            console.log('✅ Credential UI initialized');
        } else {
            console.warn('Credential UI not loaded - continuing without UI components');
        }
    }

    async initializeRODBlockchain() {
        console.log('⛓️ Initializing ROD blockchain service...');
        
        // Don't auto-init with empty credentials - wait for proper credentials
        // The original auto-init in rod-blockchain.js is problematic
        if (typeof rodBlockchainService !== 'undefined') {
            this.components.rodBlockchain = true;
            console.log('✅ ROD blockchain service available (will connect when credentials are ready)');
        } else {
            throw new Error('ROD blockchain service not loaded');
        }
    }

    async initializeRODCredentials() {
        console.log('🔑 Initializing ROD credentials integration...');
        
        if (typeof rodCredentials !== 'undefined') {
            // Initialize but don't auto-prompt for passphrase immediately
            await rodCredentials.init();
            this.components.rodCredentials = true;
            console.log('✅ ROD credentials integration initialized');
        } else {
            throw new Error('ROD credentials integration not loaded');
        }
    }

    async initializeRegistration() {
        console.log('👤 Initializing registration manager...');
        
        if (typeof registrationManager !== 'undefined') {
            // Initialize but don't auto-bind events immediately
            registrationManager.initializeEventListeners();
            this.components.registration = true;
            console.log('✅ Registration manager initialized');
            
            // Update blockchain status after initialization
            if (registrationManager.updateBlockchainStatusAfterInit) {
                registrationManager.updateBlockchainStatusAfterInit();
            }
        } else {
            throw new Error('Registration manager not loaded');
        }
    }

    async initializeGame() {
        console.log('🎮 Initializing game engine...');
        
        if (typeof gameEngine !== 'undefined') {
            // Initialize but don't auto-start game immediately
            gameEngine.initializeEventListeners();
            this.components.game = true;
            console.log('✅ Game engine initialized');
        } else {
            throw new Error('Game engine not loaded');
        }
    }

    handleInitializationError(error) {
        console.error('Initialization error details:', error);
        
        // Show user-friendly error message
        const errorMessage = `Initialization failed: ${error.message}. Please check the console for details.`;
        
        // Dispatch error event for UI to handle
        document.dispatchEvent(new CustomEvent('appError', {
            detail: { message: errorMessage }
        }));
    }

    getStatus() {
        return {
            initialized: this.initialized,
            components: this.components
        };
    }
}

// Create global instance
const appInitializer = new AppInitializer();

// Initialize when DOM is ready - this is the ONLY DOMContentLoaded listener needed
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM content loaded, starting unified initialization...');
    appInitializer.initialize();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppInitializer, appInitializer };
}