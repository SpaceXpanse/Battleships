# Test Execution Guide and Validation Documentation

## Overview
This document provides complete instructions for executing the SpaceXpanse Battleships end-to-end test suite using Puppeteer MCP and validating the results against a local ROD testnet node.

## Prerequisites

### Required Software
1. **Node.js** (v16 or higher)
2. **Puppeteer** (v20 or higher)
3. **Local ROD Testnet Node** running on `localhost:11999`
4. **RPC Proxy Server** running on `localhost:3001`
5. **Development Server** running on `localhost:3000`

### Test Credentials Setup
Create a `.env.test` file for test credentials:
```bash
RPC_URL=http://localhost:11999
RPC_USERNAME=testuser
RPC_PASSWORD=testpass
```

## Test Environment Setup

### 1. Start ROD Testnet Node
```bash
# Start your local ROD testnet node
# This command depends on your ROD node implementation
rod-testnet --rpcport=11999 --testnet
```

### 2. Start RPC Proxy Server
```bash
# Set environment variables
export RPC_URL=http://localhost:11999
export RPC_USERNAME=testuser
export RPC_PASSWORD=testpass

# Start proxy server
node rpc-proxy.js
```

### 3. Start Development Server
```bash
# Start the SpaceXpanse Battleships development server
npm start
```

### 4. Install Test Dependencies
```bash
npm install --save-dev puppeteer assert fs-extra path
```

## Test Execution

### Running Complete Test Suite
```bash
# Execute the full test suite
npm run test:e2e
```

### Running Individual Test Groups
```bash
# Run only credential management tests
node test-runner.js --group credential

# Run only blockchain service tests  
node test-runner.js --group blockchain

# Run only RPC proxy tests
node test-runner.js --group rpc-proxy

# Run only game state tests
node test-runner.js --group game-state
```

### Debug Mode Execution
```bash
# Run tests with visible browser for debugging
npm run test:e2e:debug

# Or with specific environment
HEADLESS=false node test-runner.js
```

### CI/CD Integration
```bash
# For continuous integration environments
npm run test:e2e:ci
```

## Test Validation

### Expected Output
Successful test execution should show:
```
=== Running Credential Management Tests ===
Running: testHasCredentialsInitialState
✓ testHasCredentialsInitialState (150ms)
Running: testCredentialSetupUI
✓ testCredentialSetupUI (1200ms)

=== Test Results ===
Total: 26, Passed: 26, Failed: 0
Duration: 45600ms
Report saved: results/json-results/test-report-1234567890.json
```

### Validation Checklist

#### Credential Management Validation
- [ ] ✅ Credentials encrypted with AES-GCM
- [ ] ✅ Passphrase strength validation working
- [ ] ✅ Authentication flow completes successfully
- [ ] ✅ Error handling for wrong passphrase
- [ ] ✅ Credential export/import functionality

#### Blockchain Service Validation
- [ ] ✅ Service initializes within 10 seconds
- [ ] ✅ Exponential backoff retry logic (1s, 2s, 4s, 8s, 16s)
- [ ] ✅ Max 5 retry attempts
- [ ] ✅ Connection timeout handling (5 seconds)
- [ ] ✅ Service availability detection

#### RPC Proxy Security Validation
- [ ] ✅ No hardcoded credentials in proxy code
- [ ] ✅ CORS headers properly configured
- [ ] ✅ Environment variable credential loading
- [ ] ✅ Secure error messages for missing credentials
- [ ] ✅ Proper authentication forwarding

#### Game State Persistence Validation
- [ ] ✅ localStorage fallback for offline mode
- [ ] ✅ Blockchain name registration working
- [ ] ✅ Name retrieval (`name_show`) functional
- [ ] ✅ Leaderboard updates working
- [ ] ✅ Score calculation accuracy
- [ ] ✅ State persistence across sessions

#### Transaction Processing Validation
- [ ] ✅ Name registration transactions confirmed
- [ ] ✅ Transaction error handling
- [ ] ✅ On-chain data verification
- [ ] ✅ Transaction status polling
- [ ] ✅ Sufficient funds checking

#### Error Handling Validation
- [ ] ✅ Graceful blockchain connectivity loss handling
- [ ] ✅ RPC authentication failure recovery
- [ ] ✅ Insufficient funds error handling
- [ ] ✅ Network timeout recovery
- [ ] ✅ User-friendly error messages

## Performance Metrics Validation

### Expected Performance Benchmarks
| Metric | Threshold | Actual | Status |
|--------|-----------|--------|---------|
| Blockchain Initialization | < 10s | | |
| Transaction Processing | < 30s | | |
| UI Responsiveness | < 100ms | | |
| Error Recovery | < 5s | | |
| Memory Usage | < 500MB | | |

### Performance Validation Commands
```bash
# Run performance-focused tests
node test-runner.js --performance

# Generate performance report
node utils/performance-metrics.js --report
```

## Screenshot Documentation

### Critical Junctions to Document
1. **Initial App Load**: Application starting screen
2. **Credential Setup**: RPC configuration modal
3. **Authentication**: Passphrase prompt dialog
4. **Blockchain Connected**: Successful connection status
5. **Name Registration**: Name registration completion
6. **Game Start**: Game initialization screen
7. **Game Completion**: Victory/defeat screen
8. **Leaderboard**: Updated leaderboard display
9. **Error States**: Various error conditions
10. **Recovery**: Successful error recovery

### Screenshot Review Checklist
- [ ] ✅ All critical workflow junctions captured
- [ ] ✅ Error states properly documented
- [ ] ✅ Screenshots include timestamps
- [ ] ✅ Image quality sufficient for analysis
- [ ] ✅ File naming convention followed

## Test Results Analysis

### JSON Report Structure
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "duration": 45600,
  "totalTests": 26,
  "passed": 26,
  "failed": 0,
  "results": [
    {
      "group": "Credential Management",
      "test": "testHasCredentialsInitialState",
      "status": "passed",
      "duration": 150
    }
  ]
}
```

### HTML Report Features
- Interactive test results display
- Performance charts and graphs
- Screenshot gallery integration
- Error analysis and recommendations
- Export functionality for sharing

## Common Issues and Troubleshooting

### Issue: RPC Proxy Not Starting
**Solution**: Check environment variables and port availability
```bash
# Verify environment variables
echo $RPC_URL
echo $RPC_USERNAME
echo $RPC_PASSWORD

# Check port 3001 availability
netstat -an | grep 3001
```

### Issue: Blockchain Node Unavailable
**Solution**: Ensure ROD testnet node is running
```bash
# Check if ROD node is running
curl http://localhost:11999

# Restart ROD node if needed
rod-testnet --rpcport=11999 --testnet
```

### Issue: Authentication Failures
**Solution**: Verify test credentials and passphrase
```bash
# Check credential configuration
cat .env.test

# Test RPC connection manually
curl -u testuser:testpass http://localhost:11999
```

### Issue: Puppeteer Timeouts
**Solution**: Increase timeouts or check browser installation
```bash
# Reinstall Puppeteer if needed
npm uninstall puppeteer
npm install puppeteer

# Or use system Chrome
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser npm run test:e2e
```

## Continuous Integration Setup

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    - name: Install dependencies
      run: npm install
    - name: Start ROD testnet
      run: |
        rod-testnet --rpcport=11999 --testnet &
        sleep 10
    - name: Start RPC proxy
      run: |
        export RPC_URL=http://localhost:11999
        export RPC_USERNAME=testuser
        export RPC_PASSWORD=testpass
        node rpc-proxy.js &
        sleep 2
    - name: Start dev server
      run: npm start &
      env:
        PORT: 3000
    - name: Run E2E tests
      run: npm run test:e2e:ci
      timeout-minutes: 30
    - name: Upload test results
      uses: actions/upload-artifact@v3
      with:
        name: e2e-test-results
        path: results/
```

### Docker Test Environment
```dockerfile
FROM node:18-alpine

# Install dependencies
RUN apk add --no-cache chromium
WORKDIR /app
COPY package*.json ./
RUN npm install

# Copy test files
COPY puppeteer-e2e-tests/ ./puppeteer-e2e-tests/
COPY rpc-proxy.js ./
COPY .env.test ./

# Expose ports
EXPOSE 3000 3001 11999

# Start test environment
CMD ["sh", "-c", "node rpc-proxy.js & npm start & sleep 10 && npm run test:e2e"]
```

## Maintenance and Updates

### Regular Validation Tasks
1. **Monthly**: Update Puppeteer and dependencies
2. **Quarterly**: Review performance thresholds
3. **Bi-annually**: Audit test coverage and add new scenarios
4. **Annually**: Security review of test credentials handling

### Test Environment Refresh
```bash
# Clean and rebuild test environment
npm run clean
npm install
npm run test:setup
npm run test:e2e
```

## Security Considerations

### Test Credential Management
- Use dedicated test credentials only
- Never use production credentials in tests
- Rotate test credentials periodically
- Store credentials in environment variables only

### Data Privacy
- Test data should be synthetic only
- No real user data in test environment
- Clean test data after test execution
- Secure storage of test results

## Support and Resources

### Documentation References
- [Puppeteer Documentation](https://pptr.dev/)
- [ROD Blockchain API](https://rod.tech/docs)
- [Node.js Assert Module](https://nodejs.org/api/assert.html)

### Troubleshooting Resources
- Test execution logs in `results/` directory
- Screenshot documentation in `screenshots/`
- Performance metrics in `results/performance-data/`
- JSON reports for detailed analysis

### Getting Help
1. Check test execution logs for error details
2. Review screenshot documentation for visual context
3. Examine JSON reports for specific test failures
4. Consult performance metrics for timing issues
5. Verify environment setup and dependencies

## Conclusion
This comprehensive test execution guide provides all necessary instructions for running, validating, and maintaining the SpaceXpanse Battleships end-to-end test suite. Regular execution of these tests ensures the blockchain integration remains robust and reliable across all development cycles.