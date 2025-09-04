// migration-tool.js - Data Migration Utility for EVM to ROD Blockchain Transition
// This tool helps migrate existing data from EVM-based to Bitcoin-based architecture

class MigrationTool {
    constructor() {
        this.evmData = null;
        this.migrationStatus = {
            totalRecords: 0,
            migrated: 0,
            failed: 0,
            skipped: 0
        };
    }

    // Extract data from existing EVM contract (placeholder implementation)
    async extractEVMData() {
        console.log('Starting EVM data extraction...');
        
        // In a real implementation, this would connect to the EVM contract
        // and extract all registered names and leaderboard data
        
        // For now, we'll use a placeholder with sample data structure
        this.evmData = {
            registeredNames: [
                { name: 'testplayer', address: '0x123...', timestamp: 1736000000 },
                { name: 'captain', address: '0x456...', timestamp: 1736001000 }
            ],
            leaderboard: [
                { name: 'testplayer', score: 85, gamesPlayed: 1, hits: 17 },
                { name: 'captain', score: 72, gamesPlayed: 1, hits: 14 }
            ]
        };
        
        this.migrationStatus.totalRecords = this.evmData.registeredNames.length + this.evmData.leaderboard.length;
        console.log(`Found ${this.migrationStatus.totalRecords} records to migrate`);
        
        return this.evmData;
    }

    // Migrate names to ROD blockchain using name_new operations
    async migrateNames() {
        if (!this.evmData || !this.evmData.registeredNames) {
            console.log('No names data to migrate');
            return;
        }

        console.log('Migrating registered names to ROD blockchain...');
        
        for (const nameRecord of this.evmData.registeredNames) {
            try {
                // Convert EVM name record to ROD name operation
                const value = JSON.stringify({
                    type: 'player_registration_migrated',
                    original_timestamp: nameRecord.timestamp,
                    migrated_timestamp: Math.floor(Date.now() / 1000),
                    status: 'migrated',
                    original_address: nameRecord.address
                });

                // Use name_new operation on ROD blockchain
                const result = await rodBlockchainService.registerName(nameRecord.name);
                
                if (result) {
                    this.migrationStatus.migrated++;
                    console.log(`✓ Migrated name: ${nameRecord.name}`);
                } else {
                    this.migrationStatus.failed++;
                    console.log(`✗ Failed to migrate name: ${nameRecord.name}`);
                }
                
                // Add delay to avoid rate limiting
                await this.delay(1000);
                
            } catch (error) {
                this.migrationStatus.failed++;
                console.error(`Error migrating name ${nameRecord.name}:`, error.message);
            }
        }
    }

    // Migrate leaderboard data to ROD blockchain
    async migrateLeaderboard() {
        if (!this.evmData || !this.evmData.leaderboard) {
            console.log('No leaderboard data to migrate');
            return;
        }

        console.log('Migrating leaderboard data to ROD blockchain...');
        
        for (const entry of this.evmData.leaderboard) {
            try {
                // Convert EVM leaderboard entry to ROD format
                const result = await rodBlockchainService.updateLeaderboard(
                    entry.name,
                    entry.hits * 2, // Estimate shots based on hits
                    entry.hits
                );
                
                if (result) {
                    this.migrationStatus.migrated++;
                    console.log(`✓ Migrated leaderboard entry: ${entry.name}`);
                } else {
                    this.migrationStatus.failed++;
                    console.log(`✗ Failed to migrate leaderboard entry: ${entry.name}`);
                }
                
                // Add delay to avoid rate limiting
                await this.delay(1500);
                
            } catch (error) {
                this.migrationStatus.failed++;
                console.error(`Error migrating leaderboard entry ${entry.name}:`, error.message);
            }
        }
    }

    // Run complete migration process
    async runMigration() {
        console.log('=== Starting EVM to ROD Blockchain Migration ===');
        
        try {
            // Step 1: Extract data from EVM contract
            await this.extractEVMData();
            
            // Step 2: Ensure ROD blockchain is connected
            if (!rodBlockchainService.isBlockchainAvailable()) {
                console.log('Please configure ROD blockchain connection first');
                return false;
            }
            
            // Step 3: Migrate names
            await this.migrateNames();
            
            // Step 4: Migrate leaderboard
            await this.migrateLeaderboard();
            
            // Step 5: Report results
            this.reportMigrationStatus();
            
            return true;
            
        } catch (error) {
            console.error('Migration failed:', error);
            return false;
        }
    }

    // Report migration status
    reportMigrationStatus() {
        console.log('\n=== Migration Complete ===');
        console.log(`Total records: ${this.migrationStatus.totalRecords}`);
        console.log(`Successfully migrated: ${this.migrationStatus.migrated}`);
        console.log(`Failed: ${this.migrationStatus.failed}`);
        console.log(`Skipped: ${this.migrationStatus.skipped}`);
        
        const successRate = this.migrationStatus.totalRecords > 0 ? 
            (this.migrationStatus.migrated / this.migrationStatus.totalRecords) * 100 : 0;
        
        console.log(`Success rate: ${successRate.toFixed(1)}%`);
    }

    // Utility function for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get migration status
    getStatus() {
        return this.migrationStatus;
    }

    // Reset migration status
    reset() {
        this.migrationStatus = {
            totalRecords: 0,
            migrated: 0,
            failed: 0,
            skipped: 0
        };
        this.evmData = null;
    }
}

// Create global instance
const migrationTool = new MigrationTool();

// Export for use in console or other scripts
window.migrationTool = migrationTool;

console.log('Migration tool loaded. Use migrationTool.runMigration() to start migration.');