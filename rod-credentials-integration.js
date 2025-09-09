// rod-credentials-integration.js - Integration between Credential Manager and ROD Blockchain Service

class RODCredentialsIntegration {
    constructor() {
        this.credentials = null;
        this.isAuthenticated = false;
        this.authPromptActive = false;
        this.retryCount = 0;
        this.maxRetries = 5;
        this.retryDelay = 1000; // Base delay in ms
    }

    // Initialize the integration
    async init() {
        // Listen for credential events
        this.bindEvents();
        
        // Check if we have stored credentials
        await this.checkStoredCredentials();
    }

    // Bind event listeners
    bindEvents() {
        // Listen for credentials ready event
        document.addEventListener('credentialsReady', () => {
            this.handleCredentialsReady();
        });

        // Listen for credential updates
        document.addEventListener('credentialsUpdated', () => {
            this.handleCredentialsUpdate();
        });

        // Listen for RPC authentication requests
        document.addEventListener('rpcAuthenticationRequired', (event) => {
            this.handleAuthenticationRequired(event.detail);
        });
    }

    // Check for stored credentials and attempt to load them
    async checkStoredCredentials() {
        try {
            const hasCredentials = await credentialManager.hasCredentials();
            if (hasCredentials) {
                console.log('Stored credentials found, ready for authentication');
                // We have credentials, but need passphrase to decrypt
                this.promptForPassphrase();
            } else {
                console.log('No stored credentials found');
                // No credentials, setup will be handled by credentialUI
            }
        } catch (error) {
            console.error('Failed to check stored credentials:', error);
        }
    }

    // Prompt user for passphrase to decrypt credentials
    async promptForPassphrase() {
        if (this.authPromptActive) return false;
        
        this.authPromptActive = true;
        
        const passphrase = prompt('Enter your passphrase to unlock RPC credentials:');
        if (!passphrase) {
            this.authPromptActive = false;
            this.showInfo('RPC access requires passphrase authentication');
            return false;
        }

        try {
            await this.loadAndDecryptCredentials(passphrase);
            this.showSuccess('Credentials unlocked successfully!');
            return true;
        } catch (error) {
            this.showError('Failed to unlock credentials: ' + error.message);
            // Retry if it was a wrong passphrase
            if (error.message.includes('Invalid passphrase')) {
                setTimeout(() => this.promptForPassphrase(), 1000);
            }
            return false;
        } finally {
            this.authPromptActive = false;
        }
    }

    // Load and decrypt credentials with passphrase
    async loadAndDecryptCredentials(passphrase) {
        try {
            const encryptedConfig = await credentialManager.loadCredentials();
            if (!encryptedConfig) {
                throw new Error('No stored credentials found');
            }

            this.credentials = await credentialManager.decryptCredentials(encryptedConfig, passphrase);
            this.isAuthenticated = true;
            
            // Update ROD configuration with decrypted credentials
            this.updateRODConfig();
            
            // Notify that credentials are ready
            document.dispatchEvent(new CustomEvent('rpcCredentialsReady', {
                detail: this.credentials
            }));

        } catch (error) {
            this.isAuthenticated = false;
            this.credentials = null;
            throw error;
        }
    }

    // Update ROD configuration with decrypted credentials and initialize blockchain
    async updateRODConfig() {
        console.log('updateRODConfig called - credentials:', this.credentials);
        
        if (!this.credentials) {
            console.log('No credentials available, skipping update');
            return;
        }

        if (window.ROD_CONFIG && window.updateRODConfig) {
            console.log('Updating ROD configuration with credentials');
            console.log('Current RPC URL before update:', window.ROD_CONFIG.RPC_SERVER.URL);
            
            window.updateRODConfig({
                RPC_SERVER: {
                    URL: this.credentials.url,
                    USERNAME: this.credentials.username,
                    PASSWORD: this.credentials.password
                }
            });
            
            console.log('ROD configuration updated with decrypted credentials');
            console.log('New RPC URL after update:', window.ROD_CONFIG.RPC_SERVER.URL);
            
            // Initialize blockchain service with the new credentials
            const rodService = window.rodBlockchainService;
            if (rodService && typeof rodService.init === 'function') {
                try {
                    console.log('Attempting to initialize ROD blockchain service...');
                    console.log('Current blockchain service connection status before init:', rodService.isConnected);
                    
                    // Reinitialize the blockchain service - it will use the updated ROD_CONFIG
                    const connected = await rodService.init();
                    
                    if (connected) {
                        console.log('✅ ROD blockchain service initialized successfully');
                        console.log('Blockchain service connection status after init:', rodService.isConnected);
                        // Notify that blockchain is ready
                        document.dispatchEvent(new CustomEvent('blockchainReady'));
                        
                        // Force update of registration manager status
                        if (window.registrationManager && typeof window.registrationManager.updateBlockchainStatus === 'function') {
                            window.registrationManager.updateBlockchainStatus();
                        }
                    } else {
                        console.warn('❌ ROD blockchain service initialization failed');
                        console.log('Blockchain service connection status after failed init:', rodService.isConnected);
                        
                        // Retry initialization if we haven't reached max retries
                        if (this.retryCount < this.maxRetries) {
                            this.retryCount++;
                            const delay = this.retryDelay * Math.pow(2, this.retryCount - 1); // Exponential backoff
                            console.log(`⏳ Retrying blockchain service initialization (attempt ${this.retryCount}/${this.maxRetries}) in ${delay}ms...`);
                            setTimeout(() => {
                                this.updateRODConfig();
                            }, delay);
                        } else {
                            console.warn('⛔ Max retry attempts reached. Blockchain service not available.');
                            this.showError('Failed to connect to ROD blockchain after multiple attempts. Please check your RPC server.');
                        }
                    }
                } catch (error) {
                    console.error('💥 Failed to initialize blockchain service:', error);
                    console.log('Blockchain service connection status after error:', rodService.isConnected);
                    
                    // Retry on error with exponential backoff
                    if (this.retryCount < this.maxRetries) {
                        this.retryCount++;
                        const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);
                        console.log(`⏳ Retrying after error (attempt ${this.retryCount}/${this.maxRetries}) in ${delay}ms...`);
                        setTimeout(() => {
                            this.updateRODConfig();
                        }, delay);
                    } else {
                        console.warn('⛔ Max retry attempts reached after errors.');
                        this.showError(`Blockchain connection failed: ${error.message}`);
                    }
                }
            } else {
                console.warn('rodBlockchainService not available or init method missing');
                console.log('Available window properties:', Object.keys(window).filter(key =>
                    key.includes('rod') || key.includes('blockchain') || key.includes('service')
                ));
                
                // Retry after a short delay - the service might still be loading
                if (this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);
                    console.log(`⏳ Retrying blockchain service access (attempt ${this.retryCount}/${this.maxRetries}) in ${delay}ms...`);
                    setTimeout(() => {
                        this.updateRODConfig();
                    }, delay);
                } else {
                    console.warn('⛔ Max retry attempts reached. Blockchain service not available.');
                    this.showError('Blockchain service not loaded. Please refresh the page.');
                }
            }
        } else {
            console.warn('ROD_CONFIG or updateRODConfig not available');
        }
    }

    // Handle credentials ready event
    handleCredentialsReady() {
        console.log('New credentials ready, attempting authentication...');
        this.promptForPassphrase();
    }

    // Handle credentials update event
    handleCredentialsUpdate() {
        console.log('Credentials updated, reloading...');
        this.checkStoredCredentials();
    }

    // Handle authentication requirement from ROD service
    handleAuthenticationRequired(detail) {
        console.log('RPC authentication required:', detail);
        
        if (this.isAuthenticated && this.credentials) {
            // We're already authenticated, provide credentials
            detail.callback(this.credentials);
        } else {
            // Need to authenticate first
            this.promptForPassphrase().then(() => {
                if (this.isAuthenticated) {
                    detail.callback(this.credentials);
                } else {
                    detail.callback(null);
                }
            });
        }
    }

    // Get current credentials (for ROD service)
    getCredentials() {
        return this.isAuthenticated ? this.credentials : null;
    }

    // Check if authenticated
    isAuthenticated() {
        return this.isAuthenticated;
    }

    // Check if credentials are stored (delegates to credentialManager)
    async hasCredentials() {
        try {
            return await credentialManager.hasCredentials();
        } catch (error) {
            console.error('Failed to check stored credentials:', error);
            return false;
        }
    }

    // Clear credentials from memory
    clearCredentials() {
        this.credentials = null;
        this.isAuthenticated = false;
        console.log('Credentials cleared from memory');
    }

    // Export credentials for backup (encrypted)
    async exportCredentials(passphrase) {
        try {
            const encryptedConfig = await credentialManager.loadCredentials();
            if (!encryptedConfig) {
                throw new Error('No credentials to export');
            }

            // Create downloadable JSON file
            const dataStr = JSON.stringify(encryptedConfig, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            
            const exportLink = document.createElement('a');
            exportLink.setAttribute('href', dataUri);
            exportLink.setAttribute('download', 'rod-credentials-backup.json');
            exportLink.style.display = 'none';
            
            document.body.appendChild(exportLink);
            exportLink.click();
            document.body.removeChild(exportLink);
            
            this.showSuccess('Credentials exported successfully!');
            return true;

        } catch (error) {
            this.showError('Failed to export credentials: ' + error.message);
            return false;
        }
    }

    // Import credentials from backup
    async importCredentials(file, passphrase) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                try {
                    const encryptedConfig = JSON.parse(event.target.result);
                    
                    // Verify the config can be decrypted
                    const testCredentials = await credentialManager.decryptCredentials(encryptedConfig, passphrase);
                    
                    // Save the imported config
                    await credentialManager.saveCredentials(encryptedConfig);
                    
                    this.showSuccess('Credentials imported successfully!');
                    resolve(true);
                    
                } catch (error) {
                    this.showError('Failed to import credentials: ' + error.message);
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                this.showError('Failed to read file');
                reject(new Error('File read error'));
            };
            
            reader.readAsText(file);
        });
    }

    // Show success message
    showSuccess(message) {
        const event = new CustomEvent('showMessage', {
            detail: { message, type: 'success' }
        });
        document.dispatchEvent(event);
    }

    // Show error message
    showError(message) {
        const event = new CustomEvent('showMessage', {
            detail: { message, type: 'error' }
        });
        document.dispatchEvent(event);
    }

    // Show info message
    showInfo(message) {
        const event = new CustomEvent('showMessage', {
            detail: { message, type: 'info' }
        });
        document.dispatchEvent(event);
    }

    // Create management interface
    createManagementInterface() {
        const container = document.createElement('div');
        container.className = 'credential-management-interface';
        container.innerHTML = `
            <div class="management-header">
                <h3>RPC Credential Management</h3>
                <div class="auth-status ${this.isAuthenticated ? 'authenticated' : 'not-authenticated'}">
                    ${this.isAuthenticated ? '🔓 Authenticated' : '🔒 Not Authenticated'}
                </div>
            </div>
            <div class="management-actions">
                <button class="manage-btn" onclick="rodCredentials.reauthenticate()">
                    ${this.isAuthenticated ? 'Reauthenticate' : 'Authenticate'}
                </button>
                <button class="manage-btn" onclick="rodCredentials.updateCredentials()">
                    Update Credentials
                </button>
                <button class="manage-btn" onclick="rodCredentials.exportCredentialsPrompt()">
                    Export Backup
                </button>
                <button class="manage-btn" onclick="rodCredentials.importCredentialsPrompt()">
                    Import Backup
                </button>
                <button class="manage-btn" onclick="rodCredentials.clearCredentials()">
                    Clear Memory
                </button>
            </div>
        `;
        
        return container;
    }

    // Public methods for UI
    reauthenticate() {
        this.promptForPassphrase();
    }

    updateCredentials() {
        document.dispatchEvent(new CustomEvent('showCredentialUpdate'));
    }

    exportCredentialsPrompt() {
        const passphrase = prompt('Enter passphrase to export credentials:');
        if (passphrase) {
            this.exportCredentials(passphrase);
        }
    }

    importCredentialsPrompt() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                const passphrase = prompt('Enter passphrase for imported credentials:');
                if (passphrase) {
                    this.importCredentials(file, passphrase);
                }
            }
        };
        input.click();
    }
}

// Create global instance - initialization will be handled by unified init.js
const rodCredentials = new RODCredentialsIntegration();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RODCredentialsIntegration, rodCredentials };
}