// rpc-proxy.js - Simple RPC proxy server for SpaceXpanse Battleships
// This handles the authentication that browsers block (credentials in URL)

const http = require('http');
const https = require('https');

const PROXY_PORT = 3001;
const RPC_URL = 'http://127.0.0.1:11999';
const RPC_USERNAME = 'xuser1';
const RPC_PASSWORD = 'xpass1';

// Create proxy server
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

server.listen(PROXY_PORT, '127.0.0.1', () => {
    console.log(`🚀 RPC Proxy Server running on http://127.0.0.1:${PROXY_PORT}`);
    console.log(`📡 Proxying to: ${RPC_URL}`);
    console.log(`🔐 Using credentials: ${RPC_USERNAME}:${RPC_PASSWORD}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down RPC proxy server...');
    server.close(() => {
        process.exit(0);
    });
});

module.exports = server;