// game.js - Core Game Logic for SpaceXpanse Battleships

class GameEngine {
    constructor() {
        this.state = {
            playerBoard: Array(10).fill().map(() => Array(10).fill(0)),
            computerBoard: Array(10).fill().map(() => Array(10).fill(0)),
            playerShips: [],
            computerShips: [],
            playerShots: 0,
            playerHits: 0,
            playerMisses: 0,
            gameStarted: false,
            gameOver: false,
            placingShip: null,
            shipOrientation: 'horizontal',
            currentShipIndex: 0,
            previewCells: [],
            playerName: '',
            leaderboard: []
        };

        this.shipTypes = [
            { name: 'Carrier', size: 5, color: '#1565c0' },
            { name: 'Battleship', size: 4, color: '#1976d2' },
            { name: 'Cruiser', size: 3, color: '#1e88e5' },
            { name: 'Submarine', size: 3, color: '#2196f3' },
            { name: 'Destroyer', size: 2, color: '#42a5f5' }
        ];

        // Don't initialize event listeners here - wait for DOM to be ready
    }

    initializeEventListeners() {
        // Game control buttons
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        document.getElementById('rotate-btn').addEventListener('click', () => this.rotateShip());
        document.getElementById('leaderboard-btn').addEventListener('click', () => this.viewLeaderboard());

        // Keyboard shortcut for rotation
        document.addEventListener('keydown', (e) => {
            if ((e.key === 'r' || e.key === 'R') && document.getElementById('game-screen').classList.contains('active')) {
                this.rotateShip();
            }
        });
    }

    async initGame() {
        await this.loadLeaderboard();
        this.createBoards();
        this.placeComputerShips();
        this.updateShipStatus();
        this.updateOrientationIndicator();
        this.setMessage("Place your ships on your board!");
    }

    createBoards() {
        const playerGrid = document.getElementById('player-grid');
        const computerGrid = document.getElementById('computer-grid');
        
        playerGrid.innerHTML = '';
        computerGrid.innerHTML = '';
        
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                // Player grid
                const playerCell = document.createElement('div');
                playerCell.className = 'cell';
                playerCell.dataset.row = i;
                playerCell.dataset.col = j;
                playerCell.addEventListener('click', () => this.handlePlayerCellClick(i, j));
                playerCell.addEventListener('mouseover', () => this.showShipPreview(i, j));
                playerCell.addEventListener('mouseout', () => this.clearShipPreview());
                playerGrid.appendChild(playerCell);
                
                // Computer grid
                const computerCell = document.createElement('div');
                computerCell.className = 'cell';
                computerCell.dataset.row = i;
                computerCell.dataset.col = j;
                computerCell.addEventListener('click', () => this.handleComputerCellClick(i, j));
                computerGrid.appendChild(computerCell);
            }
        }
    }

    placeComputerShips() {
        this.state.computerShips = [];
        this.state.computerBoard = Array(10).fill().map(() => Array(10).fill(0));
        
        this.shipTypes.forEach((ship, index) => {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 100) {
                const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
                const row = Math.floor(Math.random() * 10);
                const col = Math.floor(Math.random() * 10);
                
                if (this.canPlaceShip(this.state.computerBoard, row, col, ship.size, orientation)) {
                    this.placeShip(this.state.computerBoard, row, col, ship.size, orientation, index + 1);
                    this.state.computerShips.push({
                        id: index + 1,
                        name: ship.name,
                        size: ship.size,
                        hits: 0,
                        sunk: false
                    });
                    placed = true;
                }
                attempts++;
            }
        });
    }

    showShipPreview(row, col) {
        if (this.state.gameStarted || this.state.gameOver || this.state.currentShipIndex >= this.shipTypes.length) return;
        
        const ship = this.shipTypes[this.state.currentShipIndex];
        this.clearShipPreview();
        
        if (this.canPlaceShip(this.state.playerBoard, row, col, ship.size, this.state.shipOrientation)) {
            this.state.previewCells = [];
            
            if (this.state.shipOrientation === 'horizontal') {
                for (let i = 0; i < ship.size; i++) {
                    const cell = document.querySelector(`#player-grid .cell[data-row="${row}"][data-col="${col + i}"]`);
                    if (cell) {
                        cell.classList.add('ship-preview');
                        this.state.previewCells.push(cell);
                    }
                }
            } else {
                for (let i = 0; i < ship.size; i++) {
                    const cell = document.querySelector(`#player-grid .cell[data-row="${row + i}"][data-col="${col}"]`);
                    if (cell) {
                        cell.classList.add('ship-preview');
                        this.state.previewCells.push(cell);
                    }
                }
            }
        }
    }

    clearShipPreview() {
        this.state.previewCells.forEach(cell => {
            cell.classList.remove('ship-preview');
        });
        this.state.previewCells = [];
    }

    handlePlayerCellClick(row, col) {
        if (this.state.gameStarted || this.state.gameOver) return;
        
        if (this.state.currentShipIndex < this.shipTypes.length) {
            const ship = this.shipTypes[this.state.currentShipIndex];
            
            if (this.canPlaceShip(this.state.playerBoard, row, col, ship.size, this.state.shipOrientation)) {
                this.placeShip(this.state.playerBoard, row, col, ship.size, this.state.shipOrientation, this.state.currentShipIndex + 1);
                this.state.playerShips.push({
                    id: this.state.currentShipIndex + 1,
                    name: ship.name,
                    size: ship.size,
                    hits: 0,
                    sunk: false
                });
                this.state.currentShipIndex++;
                this.updateBoardDisplay();
                this.updateShipStatus();
                this.clearShipPreview();
                
                if (this.state.currentShipIndex < this.shipTypes.length) {
                    this.setMessage(`Place your ${this.shipTypes[this.state.currentShipIndex].name} (${this.shipTypes[this.state.currentShipIndex].size} cells)`);
                } else {
                    this.setMessage("All ships placed! Click 'Start Game' to begin.");
                    document.getElementById('start-btn').disabled = false;
                }
            } else {
                this.setMessage("Can't place ship there!");
            }
        }
    }

    handleComputerCellClick(row, col) {
        if (!this.state.gameStarted || this.state.gameOver) return;
        
        const cell = this.state.computerBoard[row][col];
        const cellElement = document.querySelector(`#computer-grid .cell[data-row="${row}"][data-col="${col}"]`);
        
        // Skip if already attacked
        if (cell === -1 || cell === -2) return;
        
        this.state.playerShots++;
        
        if (cell > 0) {
            // Hit
            this.state.computerBoard[row][col] = -1;
            cellElement.classList.add('hit');
            this.state.playerHits++;
            
            // Check if ship is sunk
            const shipId = cell;
            const ship = this.state.computerShips.find(s => s.id === shipId);
            ship.hits++;
            
            if (ship.hits === ship.size) {
                ship.sunk = true;
                this.setMessage(`You sunk the ${ship.name}!`);
                
                // Check for win
                if (this.state.computerShips.every(s => s.sunk)) {
                    this.endGame(true);
                    return;
                }
            } else {
                this.setMessage("Hit!");
            }
        } else {
            // Miss
            this.state.computerBoard[row][col] = -2;
            cellElement.classList.add('miss');
            this.state.playerMisses++;
            this.setMessage("Miss!");
        }
        
        this.updateStats();
        
        // Computer's turn
        setTimeout(() => this.computerTurn(), 600);
    }

    computerTurn() {
        if (this.state.gameOver) return;
        
        let row, col;
        let validMove = false;
        
        // Simple AI: random valid move
        while (!validMove) {
            row = Math.floor(Math.random() * 10);
            col = Math.floor(Math.random() * 10);
            
            // Only attack if not already attacked
            if (this.state.playerBoard[row][col] !== -1 && this.state.playerBoard[row][col] !== -2) {
                validMove = true;
            }
        }
        
        const cell = this.state.playerBoard[row][col];
        const cellElement = document.querySelector(`#player-grid .cell[data-row="${row}"][data-col="${col}"]`);
        
        if (cell > 0) {
            // Hit
            this.state.playerBoard[row][col] = -1;
            cellElement.classList.add('hit');
            this.setMessage("Enemy hit your ship!");
            
            // Check if ship is sunk
            const shipId = cell;
            const ship = this.state.playerShips.find(s => s.id === shipId);
            ship.hits++;
            
            if (ship.hits === ship.size) {
                ship.sunk = true;
                this.setMessage(`Enemy sunk your ${ship.name}!`);
                
                // Check for loss
                if (this.state.playerShips.every(s => s.sunk)) {
                    this.endGame(false);
                    return;
                }
            }
        } else {
            // Miss
            this.state.playerBoard[row][col] = -2;
            cellElement.classList.add('miss');
            this.setMessage("Enemy missed!");
        }
        
        this.updateBoardDisplay();
    }

    canPlaceShip(board, row, col, size, orientation) {
        if (orientation === 'horizontal') {
            if (col + size > 10) return false;
            for (let i = 0; i < size; i++) {
                if (board[row][col + i] !== 0) return false;
            }
        } else {
            if (row + size > 10) return false;
            for (let i = 0; i < size; i++) {
                if (board[row + i][col] !== 0) return false;
            }
        }
        return true;
    }

    placeShip(board, row, col, size, orientation, shipId) {
        if (orientation === 'horizontal') {
            for (let i = 0; i < size; i++) {
                board[row][col + i] = shipId;
            }
        } else {
            for (let i = 0; i < size; i++) {
                board[row + i][col] = shipId;
            }
        }
    }

    updateBoardDisplay() {
        // Update player board
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                const cell = this.state.playerBoard[i][j];
                const cellElement = document.querySelector(`#player-grid .cell[data-row="${i}"][data-col="${j}"]`);
                
                cellElement.className = 'cell';
                if (cell > 0) {
                    cellElement.classList.add('ship');
                } else if (cell === -1) {
                    cellElement.classList.add('hit');
                } else if (cell === -2) {
                    cellElement.classList.add('miss');
                }
            }
        }
        
        // Update computer board (only show hits and misses)
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                const cell = this.state.computerBoard[i][j];
                const cellElement = document.querySelector(`#computer-grid .cell[data-row="${i}"][data-col="${j}"]`);
                
                cellElement.className = 'cell';
                if (cell === -1) {
                    cellElement.classList.add('hit');
                } else if (cell === -2) {
                    cellElement.classList.add('miss');
                }
            }
        }
    }

    updateStats() {
        document.getElementById('shots').textContent = this.state.playerShots;
        document.getElementById('hits').textContent = this.state.playerHits;
        document.getElementById('misses').textContent = this.state.playerMisses;
        document.getElementById('sunk').textContent = 
            `${this.state.computerShips.filter(s => s.sunk).length}/${this.state.computerShips.length}`;
    }

    updateShipStatus() {
        const shipStatus = document.getElementById('ship-status');
        shipStatus.innerHTML = '';
        
        this.shipTypes.forEach((ship, index) => {
            const shipItem = document.createElement('div');
            shipItem.className = 'ship-item';
            if (this.state.playerShips[index] && this.state.playerShips[index].sunk) {
                shipItem.classList.add('sunk');
            }
            
            shipItem.innerHTML = `
                <div class="ship-icon" style="background: ${ship.color}"></div>
                <span>${ship.name}</span>
            `;
            
            shipStatus.appendChild(shipItem);
        });
    }

    updateOrientationIndicator() {
        const icon = document.getElementById('orientation-icon');
        icon.textContent = this.state.shipOrientation === 'horizontal' ? '.Horizontal' : '.Vertical';
    }

    rotateShip() {
        if (this.state.gameStarted || this.state.gameOver) return;
        
        this.state.shipOrientation = this.state.shipOrientation === 'horizontal' ? 'vertical' : 'horizontal';
        this.updateOrientationIndicator();
        this.clearShipPreview();
        
        // Trigger preview for current mouse position if over player grid
        const hoveredCell = document.querySelector('#player-grid .cell:hover');
        if (hoveredCell) {
            const row = parseInt(hoveredCell.dataset.row);
            const col = parseInt(hoveredCell.dataset.col);
            this.showShipPreview(row, col);
        }
    }

    async endGame(playerWon) {
        this.state.gameOver = true;
        document.getElementById('start-btn').disabled = true;
        document.getElementById('rotate-btn').disabled = true;
        
        if (playerWon) {
            this.setMessage(`🎉 Victory! You sunk all enemy ships in ${this.state.playerShots} shots! 🎉`);
            
            // Add to leaderboard
            const playerName = registrationManager.getPlayerName() || 'Anonymous';
            
            if (registrationManager.isUsingBlockchain() && rodBlockchainService.isBlockchainAvailable()) {
                try {
                    await rodBlockchainService.updateLeaderboard(playerName, this.state.playerShots, this.state.playerHits);
                    console.log('Leaderboard updated on ROD blockchain');
                } catch (error) {
                    console.error('Failed to update ROD blockchain leaderboard:', error);
                    // Fallback to local storage
                    this.addToLocalLeaderboard(playerName, this.state.playerShots);
                }
            } else {
                this.addToLocalLeaderboard(playerName, this.state.playerShots);
            }
        } else {
            this.setMessage(`💀 Defeat! All your ships have been sunk! 💀`);
        }
        
        // Reveal computer ships
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                const cell = this.state.computerBoard[i][j];
                const cellElement = document.querySelector(`#computer-grid .cell[data-row="${i}"][data-col="${j}"]`);
                
                if (cell > 0) {
                    cellElement.classList.add('ship');
                }
            }
        }
    }

    addToLocalLeaderboard(name, shots) {
        this.state.leaderboard.push({ name, shots, date: new Date().toLocaleDateString() });
        this.state.leaderboard.sort((a, b) => a.shots - b.shots);
        this.state.leaderboard = this.state.leaderboard.slice(0, 10);
        this.saveLeaderboard();
    }

    async loadLeaderboard() {
        if (registrationManager.isUsingBlockchain() && rodBlockchainService.isBlockchainAvailable()) {
            try {
                const blockchainLeaderboard = await rodBlockchainService.getLeaderboard();
                this.state.leaderboard = blockchainLeaderboard.map(entry => ({
                    name: entry.name,
                    shots: entry.effectiveScore * 100, // Convert back from score format
                    date: 'Blockchain'
                }));
            } catch (error) {
                console.error('Failed to load ROD blockchain leaderboard:', error);
                // Fallback to local storage
                const saved = localStorage.getItem('battleshipsLeaderboard');
                this.state.leaderboard = saved ? JSON.parse(saved) : [];
            }
        } else {
            const saved = localStorage.getItem('battleshipsLeaderboard');
            this.state.leaderboard = saved ? JSON.parse(saved) : [];
        }
    }

    saveLeaderboard() {
        localStorage.setItem('battleshipsLeaderboard', JSON.stringify(this.state.leaderboard));
    }

    startGame() {
        if (this.state.currentShipIndex === this.shipTypes.length) {
            this.state.gameStarted = true;
            document.getElementById('start-btn').disabled = true;
            document.getElementById('rotate-btn').disabled = true;
            this.setMessage("Game started! Attack the enemy waters!");
        }
    }

    resetGame() {
        this.state.playerBoard = Array(10).fill().map(() => Array(10).fill(0));
        this.state.computerBoard = Array(10).fill().map(() => Array(10).fill(0));
        this.state.playerShips = [];
        this.state.computerShips = [];
        this.state.playerShots = 0;
        this.state.playerHits = 0;
        this.state.playerMisses = 0;
        this.state.gameStarted = false;
        this.state.gameOver = false;
        this.state.currentShipIndex = 0;
        this.state.shipOrientation = 'horizontal';
        this.state.previewCells = [];
        
        this.createBoards();
        this.placeComputerShips();
        this.updateStats();
        this.updateShipStatus();
        this.updateOrientationIndicator();
        document.getElementById('start-btn').disabled = true;
        document.getElementById('rotate-btn').disabled = false;
        this.setMessage("Place your ships on your board!");
    }

    setMessage(text) {
        document.getElementById('message').textContent = text;
    }

    viewLeaderboard() {
        registrationManager.viewLeaderboard();
    }

    setPlayerName(name) {
        this.state.playerName = name;
        document.getElementById('player-display-name').textContent = name;
    }
}

// Create global instance - initialization will be handled by unified init.js
const gameEngine = new GameEngine();