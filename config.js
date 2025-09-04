// config.js - ROD Blockchain Configuration for SpaceXpanse Battleships
// Users can modify these settings to configure their ROD blockchain connection

const ROD_CONFIG = {
    // RPC Server Configuration
    RPC_SERVER: {
        URL: 'http://127.0.0.1:3001', // RPC proxy endpoint
        USERNAME: '', // Not needed for proxy
        PASSWORD: '', // Not needed for proxy
        TIMEOUT: 30000, // 30 second timeout for RPC calls
    },

    // Network Configuration
    NETWORK: {
        // ROD-specific network parameters (Bitcoin-based)
        MESSAGE_PREFIX: '\x18ROD Signed Message:\n',
        BECH32_HRP: 'rod',
        PUBKEY_HASH: 0x3c, // ROD address prefix
        SCRIPT_HASH: 0x32,
        WIF: 0xbc,
        COIN: 'ROD',
        // BIP32 parameters
        BIP32: {
            PUBLIC: 0x0488b21e,
            PRIVATE: 0x0488ade4
        }
    },

    // Name Operation Configuration
    NAME_OPERATIONS: {
        PREFIX: 'd/battleships:', // Namecoin-style namespace
        REGISTRATION_FEE: 0.01, // ROD coins for name registration
        UPDATE_FEE: 0.001,      // ROD coins for name updates
        EXPIRATION_BLOCKS: 36000, // ~10 hours in blocks
        RENEWAL_PERIOD: 3600,   // ~1 hour in blocks
    },

    // Transaction Settings
    TRANSACTION: {
        MIN_CONFIRMATIONS: 6,   // ROD requires 6 confirmations for spending
        BLOCK_TIME: 30,         // ROD blocks are mined every 30 seconds
        MAX_FEE: 0.01,          // Maximum fee in ROD coins
        FEE_RATE: 0.0001,       // Fee rate per byte (satoshis/byte equivalent)
        DUST_LIMIT: 0.00001,    // Minimum output amount
        CONFIRMATION_WAIT: 180,  // Approximate wait time for 6 confirmations (180 seconds)
    },

    // Game-Specific Settings
    GAME: {
        MAX_NAME_LENGTH: 20,     // Maximum player name length
        MIN_NAME_LENGTH: 3,      // Minimum player name length
        LEADERBOARD_LIMIT: 10,   // Number of entries to show in leaderboard
        SCORE_PRECISION: 100,    // Score precision multiplier (store as integer)
    },

    // UI Settings
    UI: {
        AUTO_RECONNECT: true,    // Automatically reconnect to blockchain
        CONNECTION_RETRY: 3,     // Number of connection retry attempts
        RETRY_DELAY: 2000,       // Delay between retry attempts in ms
        SHOW_DEBUG_INFO: false,  // Show debug information in console
    },

    // Migration Settings
    MIGRATION: {
        BATCH_SIZE: 5,           // Number of records to migrate per batch
        BATCH_DELAY: 2000,       // Delay between batches in ms
        CONFIRMATION_WAIT: 3000, // Wait for confirmations between operations
    }
};

// Make configuration available globally
window.ROD_CONFIG = ROD_CONFIG;

// Helper function to update configuration
function updateRODConfig(newConfig) {
    Object.assign(ROD_CONFIG, newConfig);
    console.log('ROD configuration updated');
}

// Helper function to get RPC credentials
function getRPCCredentials() {
    return {
        url: ROD_CONFIG.RPC_SERVER.URL,
        username: ROD_CONFIG.RPC_SERVER.USERNAME,
        password: ROD_CONFIG.RPC_SERVER.PASSWORD
    };
}

console.log('ROD blockchain configuration loaded. Modify ROD_CONFIG to change settings.');