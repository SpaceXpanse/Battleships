// registration.js - Blockchain Registration Interface for SpaceXpanse Battleships

class RegistrationManager {
    constructor() {
        this.currentPlayerName = '';
        this.isOfflineMode = false;
        // Don't initialize event listeners here - wait for DOM to be ready
        // Don't update blockchain status here - wait for unified initialization
    }

    initializeEventListeners() {
        // Wallet connection
        document.getElementById('connect-wallet-btn').addEventListener('click', () => this.connectWallet());
        
        // Name registration
        document.getElementById('register-name-btn').addEventListener('click', () => this.registerName());
        
        // Use registered name
        document.getElementById('use-registered-name').addEventListener('click', () => this.useRegisteredName());
        
        // Start game
        document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());
        
        // Offline mode
        document.getElementById('offline-mode-btn').addEventListener('click', () => this.enableOfflineMode());
        
        // View leaderboard
        document.getElementById('view-leaderboard-btn').addEventListener('click', () => this.viewLeaderboard());
        
        // Back to registration
        document.getElementById('back-to-registration').addEventListener('click', () => this.showRegistrationScreen());
    }

    initializeEventListeners() {
        // Wallet connection
        document.getElementById('connect-wallet-btn').addEventListener('click', () => this.connectWallet());
        
        // Name registration
        document.getElementById('register-name-btn').addEventListener('click', () => this.registerName());
        
        // Use registered name
        document.getElementById('use-registered-name').addEventListener('click', () => this.useRegisteredName());
        
        // Start game
        document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());
        
        // Offline mode
        document.getElementById('offline-mode-btn').addEventListener('click', () => this.enableOfflineMode());
        
        // View leaderboard
        document.getElementById('view-leaderboard-btn').addEventListener('click', () => this.viewLeaderboard());
        
        // Back to registration
        document.getElementById('back-to-registration').addEventListener('click', () => this.showRegistrationScreen());

        // Listen for credential ready events
        document.addEventListener('credentialsReady', () => {
            this.updateBlockchainStatusAfterInit();
        });

        // Listen for blockchain ready events
        document.addEventListener('blockchainReady', () => {
            this.updateBlockchainStatusAfterInit();
        });
    }

    async connectWallet() {
        try {
            this.showStatus('wallet-status', 'Configuring RPC connection...', 'info');
            
            // Check if credential manager and ROD credentials integration are available
            if (typeof credentialManager === 'undefined' || typeof rodCredentials === 'undefined') {
                throw new Error('Credential system not available');
            }
            
            // Check if we have stored credentials
            const hasCredentials = await credentialManager.hasCredentials();
            
            if (!hasCredentials) {
                // No credentials stored, show credential setup UI
                this.showStatus('wallet-status', 'No RPC credentials found. Please configure RPC settings.', 'info');
                document.dispatchEvent(new CustomEvent('showCredentialSetup'));
                return;
            }
            
            // We have credentials, but need passphrase to decrypt
            this.showStatus('wallet-status', 'Credentials found. Please enter passphrase to authenticate...', 'info');
            
            // Prompt for passphrase to decrypt credentials and wait for result
            const authSuccess = await rodCredentials.promptForPassphrase();
            
            // Check if authentication was successful
            if (authSuccess && rodCredentials.isAuthenticated) {
                this.showStatus('wallet-status', 'ROD blockchain authenticated successfully!', 'connected');
                
                // Show name section after successful authentication
                document.getElementById('name-section').style.display = 'block';
                
                // Check if name is already registered
                await this.checkRegisteredName();
            } else {
                this.showStatus('wallet-status', 'Authentication failed or cancelled', 'error');
                // Show credential setup UI on authentication failure
                document.dispatchEvent(new CustomEvent('showCredentialSetup'));
            }
            
        } catch (error) {
            this.showStatus('wallet-status', `Configuration failed: ${error.message}`, 'error');
            console.error('Blockchain configuration error:', error);
            
            // Show credential setup UI on error
            document.dispatchEvent(new CustomEvent('showCredentialSetup'));
        }
    }

    async checkRegisteredName() {
        try {
            this.showStatus('name-status', 'Checking for registered name...', 'info');
            
            // Check if blockchain service is connected
            if (!rodBlockchainService || !rodBlockchainService.isBlockchainAvailable()) {
                this.showStatus('name-status', 'ROD blockchain not connected. Please configure RPC first.', 'error');
                return;
            }
            
            // For ROD blockchain, we need to handle name retrieval differently
            const nameInput = document.getElementById('player-name');
            const name = nameInput.value.trim();
            
            if (name) {
                const nameData = await rodBlockchainService.getName(name);
                
                if (nameData) {
                    document.getElementById('current-registered-name').textContent = name;
                    document.getElementById('registered-name').style.display = 'block';
                    this.showStatus('name-status', `Found registered name: ${name}`, 'success');
                } else {
                    this.showStatus('name-status', 'No registered name found. You can register a new name.', 'info');
                }
            } else {
                this.showStatus('name-status', 'Enter a name to check registration', 'info');
            }
            
        } catch (error) {
            this.showStatus('name-status', `Name check failed: ${error.message}`, 'error');
            console.error('Name check error:', error);
        }
    }

    async registerName() {
        try {
            const nameInput = document.getElementById('player-name');
            const name = nameInput.value.trim();
            
            if (!name) {
                this.showStatus('name-status', 'Please enter a name', 'error');
                return;
            }
            
            if (name.length < 3 || name.length > 20) {
                this.showStatus('name-status', 'Name must be between 3-20 characters', 'error');
                return;
            }
            
            // Check if blockchain service is connected
            if (!rodBlockchainService || !rodBlockchainService.isBlockchainAvailable()) {
                this.showStatus('name-status', 'ROD blockchain not connected. Please configure RPC first.', 'error');
                return;
            }
            
            this.showStatus('name-status', 'Registering name on blockchain...', 'info');
            
            await rodBlockchainService.registerName(name);
            this.showStatus('name-status', 'Name registered successfully on ROD blockchain!', 'success');
            
            // Update UI to show registered name
            document.getElementById('current-registered-name').textContent = name;
            document.getElementById('registered-name').style.display = 'block';
            
        } catch (error) {
            this.showStatus('name-status', `Registration failed: ${error.message}`, 'error');
            console.error('Name registration error:', error);
        }
    }

    useRegisteredName() {
        const registeredName = document.getElementById('current-registered-name').textContent;
        this.prepareGameStart(registeredName);
    }

    async startGame() {
        const nameInput = document.getElementById('player-name');
        const name = nameInput.value.trim();
        
        if (!name) {
            this.showStatus('name-status', 'Please enter a name', 'error');
            return;
        }
        
        this.prepareGameStart(name);
    }

    prepareGameStart(playerName) {
        this.currentPlayerName = playerName;
        
        // Show game start section
        document.getElementById('player-ready-name').textContent = `Welcome, ${playerName}!`;
        document.getElementById('game-start-section').style.display = 'block';
        document.getElementById('name-section').style.display = 'none';
    }

    enableOfflineMode() {
        this.isOfflineMode = true;
        document.getElementById('blockchain-status').textContent = 
            'Offline mode enabled. Leaderboard will be stored locally.';
        
        // Show name input for offline mode
        document.getElementById('name-section').style.display = 'block';
        document.getElementById('wallet-section').style.display = 'none';
    }

    async viewLeaderboard() {
        try {
            let leaderboardData;
            
            if (this.isOfflineMode || !rodBlockchainService || !rodBlockchainService.isBlockchainAvailable()) {
                // Use local leaderboard
                const saved = localStorage.getItem('battleshipsLeaderboard');
                leaderboardData = saved ? JSON.parse(saved) : [];
            } else {
                // Get leaderboard from ROD blockchain
                leaderboardData = await rodBlockchainService.getLeaderboard();
            }
            
            this.displayLeaderboard(leaderboardData);
            this.showLeaderboardScreen();
            
        } catch (error) {
            console.error('Leaderboard retrieval error:', error);
            // Fallback to local leaderboard
            const saved = localStorage.getItem('battleshipsLeaderboard');
            const leaderboardData = saved ? JSON.parse(saved) : [];
            this.displayLeaderboard(leaderboardData);
            this.showLeaderboardScreen();
        }
    }

    displayLeaderboard(leaderboardData) {
        const leaderboardElement = document.getElementById('leaderboard');
        leaderboardElement.innerHTML = '';
        
        if (leaderboardData.length === 0) {
            leaderboardElement.innerHTML = '<div class="leaderboard-item">No scores yet!</div>';
            return;
        }
        
        leaderboardData.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            
            // Calculate score: games played divided by hits until victory
            const score = entry.gamesPlayed > 0 ? (entry.hits / entry.gamesPlayed).toFixed(2) : '0.00';
            
            item.innerHTML = `
                <span>${index + 1}. ${entry.name}</span>
                <span>Score: ${score}</span>
                <span>Games: ${entry.gamesPlayed}</span>
            `;
            leaderboardElement.appendChild(item);
        });
    }

    showStatus(elementId, message, type = 'info') {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.className = `${elementId.split('-')[0]}-status ${type}`;
    }

    showRegistrationScreen() {
        document.getElementById('registration-screen').classList.add('active');
        document.getElementById('leaderboard-screen').classList.remove('active');
        document.getElementById('game-screen').classList.remove('active');
    }

    showLeaderboardScreen() {
        document.getElementById('registration-screen').classList.remove('active');
        document.getElementById('leaderboard-screen').classList.add('active');
        document.getElementById('game-screen').classList.remove('active');
    }

    showGameScreen() {
        document.getElementById('registration-screen').classList.remove('active');
        document.getElementById('leaderboard-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
    }

    updateBlockchainStatus() {
        const statusElement = document.getElementById('blockchain-status');
        const isAvailable = rodBlockchainService && rodBlockchainService.isBlockchainAvailable();
        
        console.log('updateBlockchainStatus called - isAvailable:', isAvailable);
        
        if (isAvailable) {
            statusElement.textContent = 'ROD blockchain connection available. Configure RPC to play.';
            document.getElementById('offline-mode-btn').style.display = 'none';
        } else {
            statusElement.textContent = 'ROD blockchain not available. You can play in offline mode.';
            document.getElementById('offline-mode-btn').style.display = 'block';
        }
    }

    getPlayerName() {
        return this.currentPlayerName;
    }

    isUsingBlockchain() {
        return !this.isOfflineMode && rodBlockchainService && rodBlockchainService.isBlockchainAvailable();
    }

    // Update blockchain status after initialization
    updateBlockchainStatusAfterInit() {
        this.updateBlockchainStatus();
    }
}

// Create global instance - initialization will be handled by unified init.js
const registrationManager = new RegistrationManager();