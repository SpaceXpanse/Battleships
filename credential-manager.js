// credential-manager.js - Secure Credential Management for ROD Blockchain
// Uses Web Crypto API for AES-GCM encryption with PBKDF2 key derivation

class CredentialManager {
    constructor() {
        this.STORAGE_KEY = 'rod_rpc_credentials';
        this.CONFIG_VERSION = '1.0';
        this.PBKDF2_ITERATIONS = 100000;
    }

    // Generate cryptographically secure random bytes
    async generateRandomBytes(length) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return array;
    }

    // Derive encryption key from passphrase using PBKDF2
    async deriveKey(passphrase, salt) {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(passphrase),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: this.PBKDF2_ITERATIONS,
                hash: 'SHA-256'
            },
            keyMaterial,
            {
                name: 'AES-GCM',
                length: 256
            },
            false,
            ['encrypt', 'decrypt']
        );
    }

    // Encrypt credentials using AES-GCM
    async encryptCredentials(credentials, passphrase) {
        try {
            // Generate random salt and IV
            const salt = await this.generateRandomBytes(16);
            const iv = await this.generateRandomBytes(12);
            
            // Derive encryption key
            const key = await this.deriveKey(passphrase, salt);
            
            // Convert credentials to JSON string
            const encoder = new TextEncoder();
            const credentialsData = encoder.encode(JSON.stringify(credentials));
            
            // Encrypt data
            const encryptedData = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                credentialsData
            );

            // Create encrypted configuration
            const encryptedConfig = {
                version: this.CONFIG_VERSION,
                encryption: {
                    algorithm: 'AES-GCM',
                    keyDerivation: 'PBKDF2',
                    iterations: this.PBKDF2_ITERATIONS,
                    salt: this.arrayToBase64(salt),
                    iv: this.arrayToBase64(iv)
                },
                credentials: {
                    encrypted: this.arrayToBase64(new Uint8Array(encryptedData))
                },
                metadata: {
                    created: new Date().toISOString(),
                    modified: new Date().toISOString(),
                    rpcServer: 'localhost:11999'
                }
            };

            return encryptedConfig;

        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('Failed to encrypt credentials: ' + error.message);
        }
    }

    // Decrypt credentials using AES-GCM
    async decryptCredentials(encryptedConfig, passphrase) {
        try {
            // Validate configuration
            if (!encryptedConfig || !encryptedConfig.encryption || !encryptedConfig.credentials) {
                throw new Error('Invalid encrypted configuration format');
            }

            // Extract encryption parameters
            const { salt, iv } = encryptedConfig.encryption;
            const { encrypted } = encryptedConfig.credentials;

            // Convert from base64 to Uint8Array
            const saltArray = this.base64ToArray(salt);
            const ivArray = this.base64ToArray(iv);
            const encryptedArray = this.base64ToArray(encrypted);

            // Derive encryption key
            const key = await this.deriveKey(passphrase, saltArray);

            // Decrypt data
            const decryptedData = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: ivArray
                },
                key,
                encryptedArray
            );

            // Convert decrypted data to JSON
            const decoder = new TextDecoder();
            const credentialsJson = decoder.decode(decryptedData);
            
            // Parse and return credentials
            return JSON.parse(credentialsJson);

        } catch (error) {
            console.error('Decryption failed:', error);
            if (error.message.includes('bad')) {
                throw new Error('Invalid passphrase or corrupted data');
            }
            throw new Error('Failed to decrypt credentials: ' + error.message);
        }
    }

    // Store encrypted credentials in localStorage
    async saveCredentials(encryptedConfig) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(encryptedConfig));
            return true;
        } catch (error) {
            console.error('Failed to save credentials:', error);
            throw new Error('Storage error: ' + error.message);
        }
    }

    // Load encrypted credentials from localStorage
    async loadCredentials() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (!stored) {
                return null;
            }
            return JSON.parse(stored);
        } catch (error) {
            console.error('Failed to load credentials:', error);
            throw new Error('Failed to load stored credentials');
        }
    }

    // Clear stored credentials
    async clearCredentials() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('Failed to clear credentials:', error);
            throw new Error('Failed to clear credentials');
        }
    }

    // Check if credentials are configured
    async hasCredentials() {
        const stored = await this.loadCredentials();
        return stored !== null;
    }

    // Update credentials with new passphrase
    async rotateKeys(oldPassphrase, newPassphrase) {
        try {
            // Load and decrypt with old passphrase
            const encryptedConfig = await this.loadCredentials();
            if (!encryptedConfig) {
                throw new Error('No credentials found to rotate');
            }

            const credentials = await this.decryptCredentials(encryptedConfig, oldPassphrase);
            
            // Re-encrypt with new passphrase
            const newEncryptedConfig = await this.encryptCredentials(credentials, newPassphrase);
            
            // Save new configuration
            await this.saveCredentials(newEncryptedConfig);
            
            return true;

        } catch (error) {
            console.error('Key rotation failed:', error);
            throw new Error('Failed to rotate keys: ' + error.message);
        }
    }

    // Utility: Convert Uint8Array to base64
    arrayToBase64(array) {
        return btoa(String.fromCharCode(...array));
    }

    // Utility: Convert base64 to Uint8Array
    base64ToArray(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    // Validate passphrase strength
    validatePassphrase(passphrase) {
        if (!passphrase || passphrase.length < 8) {
            return {
                valid: false,
                message: 'Passphrase must be at least 8 characters long'
            };
        }

        // Check for complexity
        const hasUpperCase = /[A-Z]/.test(passphrase);
        const hasLowerCase = /[a-z]/.test(passphrase);
        const hasNumbers = /[0-9]/.test(passphrase);
        const hasSpecial = /[^A-Za-z0-9]/.test(passphrase);

        if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecial) {
            return {
                valid: false,
                message: 'Passphrase must include uppercase, lowercase, numbers, and special characters'
            };
        }

        return { valid: true, message: 'Strong passphrase' };
    }
}

// Create global instance
const credentialManager = new CredentialManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CredentialManager, credentialManager };
}