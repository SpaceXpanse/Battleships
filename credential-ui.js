// credential-ui.js - User Interface for Credential Management
// Provides setup wizard and credential management UI

class CredentialUI {
    constructor() {
        this.setupModal = null;
        this.updateModal = null;
        this.currentPassphrase = null;
    }

    // Initialize UI components
    init() {
        this.createSetupModal();
        this.createUpdateModal();
        this.bindGlobalEvents();
    }

    // Create setup wizard modal
    createSetupModal() {
        this.setupModal = document.createElement('div');
        this.setupModal.className = 'credential-modal';
        this.setupModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>ROD Blockchain Setup</h2>
                    <p>Configure your RPC server credentials securely</p>
                </div>
                <div class="modal-body">
                    <form id="setupForm">
                        <div class="form-group">
                            <label for="rpcUrl">RPC Server URL:</label>
                            <input type="url" id="rpcUrl" name="rpcUrl" value="http://localhost:11999" required>
                            <small>Default: http://localhost:11999</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="rpcUsername">RPC Username:</label>
                            <input type="text" id="rpcUsername" name="rpcUsername" placeholder="Your RPC username" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="rpcPassword">RPC Password:</label>
                            <input type="password" id="rpcPassword" name="rpcPassword" placeholder="Your RPC password" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="passphrase">Security Passphrase:</label>
                            <input type="password" id="passphrase" name="passphrase" placeholder="Create a strong passphrase" required>
                            <div class="passphrase-strength">
                                <div class="strength-meter"></div>
                                <span class="strength-text">Weak</span>
                            </div>
                            <small>This passphrase encrypts your credentials. It cannot be recovered if lost.</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="confirmPassphrase">Confirm Passphrase:</label>
                            <input type="password" id="confirmPassphrase" name="confirmPassphrase" placeholder="Confirm your passphrase" required>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">Save & Encrypt</button>
                            <button type="button" class="btn-secondary" onclick="credentialUI.cancelSetup()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.setupModal);
        this.bindSetupEvents();
    }

    // Create update credentials modal
    createUpdateModal() {
        this.updateModal = document.createElement('div');
        this.updateModal.className = 'credential-modal';
        this.updateModal.style.display = 'none';
        this.updateModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Update Credentials</h2>
                    <p>Modify your RPC server settings</p>
                </div>
                <div class="modal-body">
                    <form id="updateForm">
                        <div class="form-group">
                            <label for="currentPassphrase">Current Passphrase:</label>
                            <input type="password" id="currentPassphrase" name="currentPassphrase" placeholder="Enter current passphrase" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="updateRpcUrl">RPC Server URL:</label>
                            <input type="url" id="updateRpcUrl" name="updateRpcUrl" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="updateRpcUsername">RPC Username:</label>
                            <input type="text" id="updateRpcUsername" name="updateRpcUsername" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="updateRpcPassword">RPC Password:</label>
                            <input type="password" id="updateRpcPassword" name="updateRpcPassword" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Change Passphrase (optional):</label>
                            <input type="password" id="newPassphrase" name="newPassphrase" placeholder="New passphrase (leave blank to keep current)">
                            <input type="password" id="confirmNewPassphrase" name="confirmNewPassphrase" placeholder="Confirm new passphrase">
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">Update Credentials</button>
                            <button type="button" class="btn-secondary" onclick="credentialUI.cancelUpdate()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.updateModal);
        this.bindUpdateEvents();
    }

    // Bind setup form events
    bindSetupEvents() {
        const form = this.setupModal.querySelector('#setupForm');
        const passphraseInput = this.setupModal.querySelector('#passphrase');
        const confirmInput = this.setupModal.querySelector('#confirmPassphrase');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSetupSubmit();
        });

        passphraseInput.addEventListener('input', () => {
            this.updatePassphraseStrength(passphraseInput.value);
        });

        confirmInput.addEventListener('input', () => {
            this.validatePassphraseMatch();
        });
    }

    // Bind update form events
    bindUpdateEvents() {
        const form = this.updateModal.querySelector('#updateForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleUpdateSubmit();
        });
    }

    // Bind global events
    bindGlobalEvents() {
        // Listen for credential management requests
        document.addEventListener('showCredentialSetup', () => {
            this.showSetupModal();
        });

        document.addEventListener('showCredentialUpdate', () => {
            this.showUpdateModal();
        });
    }

    // Handle setup form submission
    async handleSetupSubmit() {
        const form = this.setupModal.querySelector('#setupForm');
        const formData = new FormData(form);
        
        const credentials = {
            url: formData.get('rpcUrl') || 'http://localhost:11999',
            username: formData.get('rpcUsername'),
            password: formData.get('rpcPassword')
        };

        const passphrase = formData.get('passphrase');
        const confirmPassphrase = formData.get('confirmPassphrase');

        // Validate inputs
        if (!this.validateSetupInputs(credentials, passphrase, confirmPassphrase)) {
            return;
        }

        try {
            // Encrypt and save credentials
            const encryptedConfig = await credentialManager.encryptCredentials(credentials, passphrase);
            await credentialManager.saveCredentials(encryptedConfig);
            
            this.showSuccess('Credentials saved securely!');
            this.hideSetupModal();
            
            // Notify other components that credentials are ready
            document.dispatchEvent(new CustomEvent('credentialsReady'));
            
        } catch (error) {
            this.showError('Failed to save credentials: ' + error.message);
        }
    }

    // Handle update form submission
    async handleUpdateSubmit() {
        const form = this.updateModal.querySelector('#updateForm');
        const formData = new FormData(form);
        
        const currentPassphrase = formData.get('currentPassphrase');
        const newCredentials = {
            url: formData.get('updateRpcUrl'),
            username: formData.get('updateRpcUsername'),
            password: formData.get('updateRpcPassword')
        };
        
        const newPassphrase = formData.get('newPassphrase') || currentPassphrase;
        const confirmNewPassphrase = formData.get('confirmNewPassphrase') || newPassphrase;

        // Validate inputs
        if (!this.validateUpdateInputs(newCredentials, newPassphrase, confirmNewPassphrase)) {
            return;
        }

        try {
            if (newPassphrase !== currentPassphrase) {
                // Rotate keys with new passphrase
                await credentialManager.rotateKeys(currentPassphrase, newPassphrase);
            }
            
            // Update credentials with current passphrase
            const encryptedConfig = await credentialManager.encryptCredentials(newCredentials, newPassphrase);
            await credentialManager.saveCredentials(encryptedConfig);
            
            this.showSuccess('Credentials updated successfully!');
            this.hideUpdateModal();
            
        } catch (error) {
            this.showError('Failed to update credentials: ' + error.message);
        }
    }

    // Validate setup inputs
    validateSetupInputs(credentials, passphrase, confirmPassphrase) {
        if (!credentials.url) {
            this.showError('RPC URL is required');
            return false;
        }

        if (!credentials.username) {
            this.showError('RPC username is required');
            return false;
        }

        if (!credentials.password) {
            this.showError('RPC password is required');
            return false;
        }

        const passphraseValidation = credentialManager.validatePassphrase(passphrase);
        if (!passphraseValidation.valid) {
            this.showError(passphraseValidation.message);
            return false;
        }

        if (passphrase !== confirmPassphrase) {
            this.showError('Passphrases do not match');
            return false;
        }

        return true;
    }

    // Validate update inputs
    validateUpdateInputs(credentials, newPassphrase, confirmNewPassphrase) {
        if (!credentials.url) {
            this.showError('RPC URL is required');
            return false;
        }

        if (newPassphrase && newPassphrase !== confirmNewPassphrase) {
            this.showError('New passphrases do not match');
            return false;
        }

        if (newPassphrase) {
            const passphraseValidation = credentialManager.validatePassphrase(newPassphrase);
            if (!passphraseValidation.valid) {
                this.showError(passphraseValidation.message);
                return false;
            }
        }

        return true;
    }

    // Update passphrase strength indicator
    updatePassphraseStrength(passphrase) {
        const strengthMeter = this.setupModal.querySelector('.strength-meter');
        const strengthText = this.setupModal.querySelector('.strength-text');
        
        if (!passphrase) {
            strengthMeter.style.width = '0%';
            strengthText.textContent = 'Weak';
            strengthMeter.style.backgroundColor = '#ff4757';
            return;
        }

        let strength = 0;
        if (passphrase.length >= 8) strength += 25;
        if (/[A-Z]/.test(passphrase)) strength += 25;
        if (/[0-9]/.test(passphrase)) strength += 25;
        if (/[^A-Za-z0-9]/.test(passphrase)) strength += 25;

        strengthMeter.style.width = strength + '%';
        
        if (strength <= 25) {
            strengthText.textContent = 'Weak';
            strengthMeter.style.backgroundColor = '#ff4757';
        } else if (strength <= 50) {
            strengthText.textContent = 'Fair';
            strengthMeter.style.backgroundColor = '#ffa500';
        } else if (strength <= 75) {
            strengthText.textContent = 'Good';
            strengthMeter.style.backgroundColor = '#2ed573';
        } else {
            strengthText.textContent = 'Strong';
            strengthMeter.style.backgroundColor = '#1e90ff';
        }
    }

    // Validate passphrase match
    validatePassphraseMatch() {
        const passphrase = this.setupModal.querySelector('#passphrase').value;
        const confirm = this.setupModal.querySelector('#confirmPassphrase').value;
        const confirmInput = this.setupModal.querySelector('#confirmPassphrase');

        if (confirm && passphrase !== confirm) {
            confirmInput.setCustomValidity('Passphrases do not match');
        } else {
            confirmInput.setCustomValidity('');
        }
    }

    // Show setup modal
    showSetupModal() {
        this.setupModal.style.display = 'flex';
        this.setupModal.querySelector('#rpcUrl').focus();
    }

    // Hide setup modal
    hideSetupModal() {
        this.setupModal.style.display = 'none';
        this.clearSetupForm();
    }

    // Show update modal
    async showUpdateModal() {
        try {
            const encryptedConfig = await credentialManager.loadCredentials();
            if (encryptedConfig) {
                const urlInput = this.updateModal.querySelector('#updateRpcUrl');
                const usernameInput = this.updateModal.querySelector('#updateRpcUsername');
                const passwordInput = this.updateModal.querySelector('#updateRpcPassword');
                
                // You might want to decrypt to show current values, but this requires passphrase
                // For security, we'll just clear the form
                urlInput.value = 'http://localhost:11999';
                usernameInput.value = '';
                passwordInput.value = '';
            }
            
            this.updateModal.style.display = 'flex';
            this.updateModal.querySelector('#currentPassphrase').focus();
            
        } catch (error) {
            this.showError('Failed to load current credentials');
        }
    }

    // Hide update modal
    hideUpdateModal() {
        this.updateModal.style.display = 'none';
        this.clearUpdateForm();
    }

    // Cancel setup
    cancelSetup() {
        this.hideSetupModal();
        this.showInfo('Setup cancelled. RPC features will not be available.');
    }

    // Cancel update
    cancelUpdate() {
        this.hideUpdateModal();
    }

    // Clear setup form
    clearSetupForm() {
        this.setupModal.querySelector('#setupForm').reset();
        this.updatePassphraseStrength('');
    }

    // Clear update form
    clearUpdateForm() {
        this.updateModal.querySelector('#updateForm').reset();
    }

    // Show success message
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    // Show error message
    showError(message) {
        this.showMessage(message, 'error');
    }

    // Show info message
    showInfo(message) {
        this.showMessage(message, 'info');
    }

    // Show message with type
    showMessage(message, type) {
        // Create or reuse message element
        let messageEl = document.querySelector('.credential-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.className = 'credential-message';
            document.body.appendChild(messageEl);
        }

        messageEl.textContent = message;
        messageEl.className = `credential-message ${type}`;
        messageEl.style.display = 'block';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }

    // Check if setup is needed and show modal if required
    async checkSetupNeeded() {
        try {
            const hasCredentials = await credentialManager.hasCredentials();
            if (!hasCredentials) {
                setTimeout(() => this.showSetupModal(), 1000);
            }
        } catch (error) {
            console.error('Failed to check credentials:', error);
        }
    }
}

// Create global instance - initialization will be handled by unified init.js
const credentialUI = new CredentialUI();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CredentialUI, credentialUI };
}