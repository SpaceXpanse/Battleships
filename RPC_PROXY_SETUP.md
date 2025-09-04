# RPC Proxy Setup for SpaceXpanse Battleships

## Overview
This document explains the RPC proxy setup required for SpaceXpanse Battleships blockchain integration. The proxy is necessary because browsers block URL-based authentication (credentials in URLs) for security reasons, but the SpaceXpanse RPC server only supports this authentication method.

## Why a Proxy is Needed

1. **Browser Security Restrictions**: Modern browsers block HTTP requests with credentials embedded in URLs
2. **ROD RPC Server Limitation**: The SpaceXpanse RPC server only supports URL-based authentication (`http://user:pass@host:port`)
3. **CORS Requirements**: The proxy handles Cross-Origin Resource Sharing (CORS) headers

## ROD Blockchain Characteristics

- **Bitcoin-based protocol**: Uses Namecoin-style name operations
- **30-second block time**: Blocks are mined every 30 seconds
- **6-confirmation requirement**: ROD coins can be spent after 6 confirmations (~3 minutes)
- **Name operations**: Supports `name_register`, `name_show`, `name_update`, `name_list`
- **Namespace requirements**: Names must use `d/` prefix (e.g., `d/battleships:playername`)

## Setup Instructions

### 1. Start the RPC Proxy Server

```bash
node rpc-proxy.js
```

The proxy server will:
- Run on `http://127.0.0.1:3001`
- Forward requests to `http://127.0.0.1:11999` (ROD RPC server)
- Handle authentication with credentials: `xuser1:xpass1`
- Add CORS headers for browser compatibility

### 2. Configure the Application

The [`config.js`](config.js:7) file is already configured to use the proxy:

```javascript
RPC_SERVER: {
    URL: 'http://127.0.0.1:3001', // RPC proxy endpoint
    USERNAME: '', // Not needed for proxy
    PASSWORD: '', // Not needed for proxy
    TIMEOUT: 30000,
},
```

### 3. Verify the Setup

Test the proxy connection:

```bash
# Test with curl
curl --data-binary '{"jsonrpc": "1.0", "id": "test", "method": "getblockchaininfo", "params": []}' -H "content-type: application/json;" http://127.0.0.1:3001/
```

### 4. Test in Browser

Open the test page:
```
http://localhost:3000/blockchain-test.html
```

## Architecture

```
Browser → RPC Proxy (3001) → ROD RPC Server (11999)
```

- **Browser**: Makes requests to proxy without credentials
- **Proxy**: Adds credentials and forwards to RPC server
- **RPC Server**: Processes requests with URL-based auth

## Security Considerations

1. **Local Only**: The proxy runs on localhost (`127.0.0.1`) for security
2. **CORS Restricted**: Only allows requests from same origin
3. **Credentials Protected**: RPC credentials are stored in the proxy, not exposed to browser

## Troubleshooting

### Common Issues

1. **Proxy not running**: Ensure `node rpc-proxy.js` is running
2. **ROD RPC server not running**: Check SpaceXpanse RPC server on port 11999
3. **Port conflicts**: Change proxy port in `rpc-proxy.js` if needed

### Error Messages

- **"Connection failed"**: Proxy or RPC server not running
- **"Credentials incorrect"**: Check `spacexpanse.conf` credentials
- **"CORS error"**: Browser blocking cross-origin requests (should be handled by proxy)
- **"Name not found"**: Name may need confirmations (ROD requires 6 confirmations)
- **"Transaction not confirmed"**: Wait for block confirmations (30-second blocks)

## Production Deployment

For production, consider:
1. Running the proxy on a secure server
2. Adding HTTPS encryption
3. Implementing rate limiting
4. Adding request logging and monitoring

## Files

- [`rpc-proxy.js`](rpc-proxy.js:1) - Proxy server implementation
- [`config.js`](config.js:7) - Application configuration
- [`spacexpanse.conf`](spacexpanse.conf:1) - RPC server configuration
- [`blockchain-test.html`](blockchain-test.html:1) - Test page

## Support

If you encounter issues:
1. Check all servers are running
2. Verify credentials in `spacexpanse.conf`
3. Test with curl commands first
4. Check browser console for error messages