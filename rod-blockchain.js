// rod-blockchain.js - ROD Blockchain Integration for SpaceXpanse Battleships
// Bitcoin/Namecoin compatible implementation using bitcoinjs-lib

class RODBlockchainService {
    constructor() {
        this.rpcClient = null;
        this.isConnected = false;
        this.currentAddress = null;
        
        // Use configuration from config.js
        this.rpcConfig = {
            url: ROD_CONFIG.RPC_SERVER.URL,
            username: ROD_CONFIG.RPC_SERVER.USERNAME,
            password: ROD_CONFIG.RPC_SERVER.PASSWORD
        };
        
        // Use network configuration from config.js
        this.network = ROD_CONFIG.NETWORK;
        
        // Use name operation configuration from config.js
        this.nameOperations = {
            registrationFee: ROD_CONFIG.NAME_OPERATIONS.REGISTRATION_FEE,
            updateFee: ROD_CONFIG.NAME_OPERATIONS.UPDATE_FEE,
            namePrefix: ROD_CONFIG.NAME_OPERATIONS.PREFIX,
            expirationTime: ROD_CONFIG.NAME_OPERATIONS.EXPIRATION_BLOCKS
        };
    }

    // Initialize RPC connection
    async init(rpcUser = null, rpcPassword = null) {
        try {
            // Update credentials if provided
            if (rpcUser !== null) this.rpcConfig.username = rpcUser;
            if (rpcPassword !== null) this.rpcConfig.password = rpcPassword;
            
            this.rpcClient = new RODRPCClient(this.rpcConfig.url);
            
            // Test connection with timeout
            const info = await Promise.race([
                this.rpcClient.call('getblockchaininfo'),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Connection timeout')), ROD_CONFIG.RPC_SERVER.TIMEOUT)
                )
            ]);
            
            if (info && info.result) {
                this.isConnected = true;
                console.log('ROD blockchain connected:', info.result.chain, 'Height:', info.result.blocks);
                return true;
            }
            
            throw new Error('Failed to connect to ROD blockchain');
            
        } catch (error) {
            console.error('ROD blockchain initialization failed:', error);
            this.handleBlockchainError(error);
            return false;
        }
    }

    // Register a new player name using name_new operation
    async registerName(name) {
        try {
            if (!this.isConnected) {
                throw new Error('ROD blockchain not connected');
            }

            if (!name || name.trim().length === 0) {
                throw new Error('Invalid name');
            }

            const fullName = `${this.nameOperations.namePrefix}${name.trim()}`;
            const value = JSON.stringify({
                type: 'player_registration',
                timestamp: Math.floor(Date.now() / 1000),
                status: 'active'
            });

            // Use name_register operation
            const result = await this.rpcClient.call('name_register', [
                fullName,
                value,
                {
                    registrationFee: this.nameOperations.registrationFee
                }
            ]);

            console.log('Name registration successful:', result);
            return result.result || result;
            
        } catch (error) {
            console.error('Name registration failed:', error);
            this.handleBlockchainError(error);
            throw error;
        }
    }

    // Get registered name information using name_show
    async getName(name) {
        try {
            if (!this.isConnected) {
                return null;
            }

            const fullName = `${this.nameOperations.namePrefix}${name}`;
            const result = await this.rpcClient.call('name_show', [fullName]);

            if (result && result.result) {
                try {
                    const data = JSON.parse(result.result.value);
                    return data;
                } catch (parseError) {
                    return result.result.value;
                }
            }
            
            return null;
            
        } catch (error) {
            console.error('Name retrieval failed:', error);
            this.handleBlockchainError(error);
            return null;
        }
    }

    // Update leaderboard score using name_update
    async updateLeaderboard(playerName, shots, hits) {
        try {
            if (!this.isConnected) {
                throw new Error('ROD blockchain not connected');
            }

            // Calculate score
            const score = hits > 0 ? (1 / (shots / hits)) : 0;
            const fullName = `${this.nameOperations.namePrefix}leaderboard:${playerName}`;

            const value = JSON.stringify({
                type: 'leaderboard_entry',
                player: playerName,
                score: Math.floor(score * 100),
                gamesPlayed: 1,
                hits: hits,
                shots: shots,
                timestamp: Math.floor(Date.now() / 1000),
                effectiveScore: hits > 0 ? (hits / shots) : 0
            });

            // Use name_update operation
            const result = await this.rpcClient.call('name_update', [
                fullName,
                value,
                {
                    updateFee: this.nameOperations.updateFee
                }
            ]);

            console.log('Leaderboard update successful:', result);
            return result.result || result;
            
        } catch (error) {
            console.error('Leaderboard update failed:', error);
            this.handleBlockchainError(error);
            throw error;
        }
    }

    // Get leaderboard data by scanning names
    async getLeaderboard(limit = 10) {
        try {
            if (!this.isConnected) {
                return [];
            }

            // For prototype, we'll use a simplified approach
            // In production, this would use name_scan or similar methods
            const leaderboard = [];
            
            // This is a placeholder - actual implementation would scan the blockchain
            // for leaderboard entries and aggregate them
            console.log('Leaderboard retrieval: Using placeholder implementation');
            
            return leaderboard.slice(0, limit);
            
        } catch (error) {
            console.error('Leaderboard retrieval failed:', error);
            this.handleBlockchainError(error);
            return [];
        }
    }

    // Handle blockchain errors gracefully
    handleBlockchainError(error) {
        // Handle RPC error codes
        if (error.code === -25) {
            throw new Error('Name already registered - this name exists already');
        } else if (error.code === -8) {
            if (error.message.includes('invalid-namespace')) {
                throw new Error('Invalid namespace - names must use d/ prefix (e.g., d/battleships:name)');
            } else if (error.message.includes('invalid-json')) {
                throw new Error('Invalid JSON format in name value');
            } else {
                throw new Error('Invalid name operation: ' + error.message);
            }
        } else if (error.message.includes('Connection')) {
            throw new Error('ROD blockchain connection failed');
        } else if (error.message.includes('name already exists') || error.message.includes('this name can not be updated')) {
            throw new Error('Name already registered or cannot be updated');
        } else if (error.message.includes('insufficient funds')) {
            throw new Error('Insufficient ROD coins for operation');
        } else if (error.message.includes('name not found') || error.message.includes('not found')) {
            throw new Error('Name not found - may need confirmations (ROD requires 6 confirmations)');
        } else if (error.message.includes('Method not found')) {
            throw new Error('Blockchain operation not supported - check RPC server configuration');
        } else if (error.message.includes('unconfirmed')) {
            throw new Error('Transaction not confirmed yet - ROD requires 6 confirmations (~3 minutes)');
        } else {
            throw new Error('Blockchain operation failed: ' + error.message);
        }
    }

    // Check if blockchain is available
    isBlockchainAvailable() {
        return this.isConnected;
    }

    // Set RPC credentials
    setRPCCredentials(username, password) {
        this.rpcConfig.username = username;
        this.rpcConfig.password = password;
        if (this.rpcClient) {
            this.rpcClient.updateCredentials(username, password);
        }
    }

    // Get current blockchain info
    async getBlockchainInfo() {
        try {
            if (!this.isConnected) {
                throw new Error('ROD blockchain not connected');
            }
            return await this.rpcClient.call('getblockchaininfo');
        } catch (error) {
            console.error('Failed to get blockchain info:', error);
            throw error;
        }
    }

    // Get network info
    async getNetworkInfo() {
        try {
            if (!this.isConnected) {
                throw new Error('ROD blockchain not connected');
            }
            return await this.rpcClient.call('getnetworkinfo');
        } catch (error) {
            console.error('Failed to get network info:', error);
            throw error;
        }
    }

    // Validate ROD address
    validateAddress(address) {
        // Basic address validation - in production, use proper Bitcoin address validation
        if (!address || typeof address !== 'string') return false;
        
        // Check for ROD-specific address formats
        if (address.startsWith('R') || address.startsWith('r')) {
            return address.length >= 26 && address.length <= 35;
        }
        
        // Check for bech32 addresses
        if (address.startsWith('rod1')) {
            return address.length > 10; // Minimum bech32 address length
        }
        
        return false;
    }
}

// ROD RPC Client implementation
class RODRPCClient {
    constructor(rpcUrl) {
        this.rpcUrl = rpcUrl;
    }

    async call(method, params = []) {
        try {
            const response = await fetch(this.rpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    jsonrpc: '1.0',
                    id: 'battleships',
                    method,
                    params
                })
            });

            if (!response.ok) {
                throw new Error(`RPC call failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.error) {
                // Preserve the full error object with code and message
                const rpcError = new Error(`RPC error: ${data.error.message}`);
                rpcError.code = data.error.code;
                rpcError.message = data.error.message;
                throw rpcError;
            }
            
            return data;
            
        } catch (error) {
            console.error('RPC call failed:', error);
            throw error;
        }
    }
}

// Create global instance - initialization will be handled by unified init.js
const rodBlockchainService = new RODBlockchainService();

// Expose to window for other modules to access
window.rodBlockchainService = rodBlockchainService;