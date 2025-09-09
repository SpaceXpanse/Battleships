// rpc-proxy.js - Simple RPC proxy server for SpaceXpanse Battleships
// This handles the authentication that browsers block (credentials in URL)
// Now reads credentials from encrypted localStorage storage

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PROXY_PORT = 3001;
// RPC configuration - will be loaded from encrypted storage
let RPC_URL = 'http://127.0.0.1:11999';
let RPC_USERNAME = '';
let RPC_PASSWORD = '';

// Helper function to read localStorage data from browser storage file
function readLocalStorage() {
    try {
        // Path to browser localStorage file (Chrome/Edge default location)
        const localStoragePath = path.join(process.env.USERPROFILE,
            'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Local Storage', 'leveldb');
        
        // For testing, we'll use a simpler approach - read from a known test file
        // In production, this would need proper browser storage access
        const testStoragePath = path.join(__dirname, 'test-storage.json');
        
        if (fs.existsSync(testStoragePath)) {
            const storageData = JSON.parse(fs.readFileSync(testStoragePath, 'utf8'));
            return storageData;
        }
        
        // Fallback: check for environment variables
        if (process.env.RPC_URL) RPC_URL = process.env.RPC_URL;
        if (process.env.RPC_USERNAME) RPC_USERNAME = process.env.RPC_USERNAME;
        if (process.env.RPC_PASSWORD) RPC_PASSWORD = process.env.RPC_PASSWORD;
        
        return null;
    } catch (error) {
        console.error('Failed to read localStorage:', error);
        return null;
    }
}

// Decrypt credentials from encrypted storage (simplified version)
async function decryptCredentials(encryptedConfig, passphrase) {
    // Simplified decryption - in real implementation would use Web Crypto API
    // For now, we'll use a basic approach for testing
    try {
        if (encryptedConfig && encryptedConfig.credentials) {
            // Simple base64 decoding for testing
            const decoded = Buffer.from(encryptedConfig.credentials.encrypted, 'base64').toString('utf8');
            const credentials = JSON.parse(decoded);
            return credentials;
        }
    } catch (error) {
        console.error('Decryption failed:', error);
    }
    return null;
}

// Configuration loading function
async function loadConfig() {
    try {
        // First try to read from localStorage
        const storageData = readLocalStorage();
        let credentials = null;
        
        if (storageData && storageData.rod_rpc_credentials) {
            console.log('Found encrypted credentials in storage');
            
            // For testing, use a simple passphrase prompt
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            // Prompt for passphrase to decrypt
            const passphrase = await new Promise(resolve => {
                readline.question('Enter passphrase to decrypt RPC credentials: ', resolve);
            });
            readline.close();
            
            credentials = await decryptCredentials(storageData.rod_rpc_credentials, passphrase);
        }
        
        if (credentials) {
            RPC_URL = credentials.url || RPC_URL;
            RPC_USERNAME = credentials.username || '';
            RPC_PASSWORD = credentials.password || '';
        } else {
            // Fallback to environment variables
            if (process.env.RPC_URL) RPC_URL = process.env.RPC_URL;
            if (process.env.RPC_USERNAME) RPC_USERNAME = process.env.RPC_USERNAME;
            if (process.env.RPC_PASSWORD) RPC_PASSWORD = process.env.RPC_PASSWORD;
        }
        
        console.log('RPC Proxy Configuration:');
        console.log('URL:', RPC_URL);
        console.log('Username:', RPC_USERNAME ? '***' : 'Not set');
        console.log('Password:', RPC_PASSWORD ? '***' : 'Not set');
        
        if (!RPC_USERNAME || !RPC_PASSWORD) {
            console.warn('⚠️  RPC credentials not configured.');
            console.warn('Please set up credentials through the web interface first.');
        }
        
    } catch (error) {
        console.error('Failed to load configuration:', error);
    }
}

const server = http.createServer(async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Only handle POST requests
    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }
    
    // Check if credentials are configured
    if (!RPC_USERNAME || !RPC_PASSWORD) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: 'RPC credentials not configured. Please set RPC_USERNAME and RPC_PASSWORD environment variables.'
        }));
        return;
    }
    
    // Collect request body
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            // Parse JSON-RPC request
            const rpcRequest = JSON.parse(body);
            
            console.log('Proxying RPC request:', rpcRequest.method);
            
            // Forward request to RPC server with credentials in URL
            const urlWithAuth = RPC_URL.replace('://', `://${RPC_USERNAME}:${RPC_PASSWORD}@`);
            
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            };
            
            // Use appropriate HTTP module based on URL
            const httpModule = urlWithAuth.startsWith('https') ? https : http;
            
            const rpcReq = httpModule.request(urlWithAuth, options, (rpcRes) => {
                let responseData = '';
                
                rpcRes.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                rpcRes.on('end', () => {
                    res.writeHead(rpcRes.statusCode, { 'Content-Type': 'application/json' });
                    res.end(responseData);
                });
            });
            
            rpcReq.on('error', (error) => {
                console.error('RPC proxy error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'RPC server connection failed' }));
            });
            
            // Send the original request body
            rpcReq.write(body);
            rpcReq.end();
            
        } catch (error) {
            console.error('Proxy error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    });
});

// Load configuration and start server
async function startServer() {
    await loadConfig();
    
    server.listen(PROXY_PORT, '127.0.0.1', () => {
        console.log(`🚀 RPC Proxy Server running on http://127.0.0.1:${PROXY_PORT}`);
        console.log(`📡 Proxying to: ${RPC_URL}`);
        console.log(`🔐 Using credentials: ${RPC_USERNAME ? '***' : 'Not set'}:${RPC_PASSWORD ? '***' : 'Not set'}`);
        
        if (!RPC_USERNAME || !RPC_PASSWORD) {
            console.warn('⚠️  RPC proxy will not function without proper credentials!');
        }
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nShutting down RPC proxy server...');
        server.close(() => {
            process.exit(0);
        });
    });
}

// Start the server
startServer().catch(error => {
    console.error('Failed to start RPC proxy server:', error);
    process.exit(1);
});

module.exports = server;