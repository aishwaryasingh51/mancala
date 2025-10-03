/**
 * Mancala Game - Complete Implementation with AI
 */

class MancalaGame {
    constructor() {
        // Game state
        this.board = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0]; // 14 positions: 0-5 human pits, 6 human store, 7-12 AI pits, 13 AI store
        this.currentPlayer = 0; // 0 = human, 1 = AI
        this.gameOver = false;
        this.animationInProgress = false;
        
        // DOM elements
        this.initializeDOM();
        this.setupEventListeners();
        this.renderBoard();
        this.showMessage("Your turn! Click on any of your pits to start.", "info");
    }

    initializeDOM() {
        this.humanPits = [];
        this.aiPits = [];
        
        // Get human pits (0-5)
        for (let i = 0; i <= 5; i++) {
            this.humanPits.push(document.querySelector(`[data-pit="${i}"]`));
        }
        
        // Get AI pits (7-12, but displayed as 12-7)
        for (let i = 12; i >= 7; i--) {
            this.aiPits.push(document.querySelector(`[data-pit="${i}"]`));
        }
        
        this.humanStore = document.getElementById('human-store');
        this.aiStore = document.getElementById('ai-store');
        this.turnIndicator = document.getElementById('turn-indicator');
        this.messageDisplay = document.getElementById('message-display');
        this.humanScoreDisplay = document.getElementById('human-score');
        this.aiScoreDisplay = document.getElementById('ai-score');
    }

    setupEventListeners() {
        // Human pit clicks
        this.humanPits.forEach((pit, index) => {
            pit.addEventListener('click', () => {
                if (this.currentPlayer === 0 && !this.gameOver && !this.animationInProgress) {
                    this.makeMove(index);
                }
            });
        });

        // Game controls
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
        
        // Rules modal
        const rulesBtn = document.getElementById('rules-btn');
        const rulesModal = document.getElementById('rules-modal');
        const closeModal = rulesModal.querySelector('.close-modal');
        
        rulesBtn.addEventListener('click', () => {
            rulesModal.style.display = 'block';
        });
        
        closeModal.addEventListener('click', () => {
            rulesModal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === rulesModal) {
                rulesModal.style.display = 'none';
            }
        });

        // Game over modal
        document.getElementById('play-again-btn').addEventListener('click', () => {
            document.getElementById('game-over-modal').style.display = 'none';
            this.newGame();
        });
    }

    renderBoard() {
        // Update pit displays
        this.humanPits.forEach((pit, index) => {
            this.updatePitDisplay(pit, this.board[index]);
        });
        
        this.aiPits.forEach((pit, index) => {
            const boardIndex = 12 - index; // AI pits are 12, 11, 10, 9, 8, 7
            this.updatePitDisplay(pit, this.board[boardIndex]);
        });
        
        // Update stores
        this.updateStoreDisplay(this.humanStore, this.board[6]);
        this.updateStoreDisplay(this.aiStore, this.board[13]);
        
        // Update scores
        this.humanScoreDisplay.textContent = this.board[6];
        this.aiScoreDisplay.textContent = this.board[13];
        
        // Update turn indicator
        this.updateTurnIndicator();
        
        // Update pit interactivity
        this.updatePitInteractivity();
    }

    updatePitDisplay(pitElement, stoneCount) {
        const stoneCountDisplay = pitElement.querySelector('.stone-count');
        const stonesContainer = pitElement.querySelector('.stones-container');
        
        stoneCountDisplay.textContent = stoneCount;
        
        // Clear existing stones
        stonesContainer.innerHTML = '';
        
        // Show all stones with truly random positioning within pit bounds
        for (let i = 0; i < stoneCount; i++) {
            const stone = document.createElement('div');
            stone.className = 'stone';
            
            // Assign a random color to each stone
            const colorIndex = Math.floor(Math.random() * 8);
            stone.classList.add(`stone-color-${colorIndex}`);
            
            // Adjust stone size based on count to fit more stones
            let stoneSize = 12;
            if (stoneCount > 8) stoneSize = 10;
            if (stoneCount > 15) stoneSize = 8;
            if (stoneCount > 25) stoneSize = 6;
            
            stone.style.width = stoneSize + 'px';
            stone.style.height = stoneSize + 'px';
            
            // Generate random position within circular bounds
            // Pit is 100x100, so we need to stay within a circle of radius ~35-40
            const centerX = 50;
            const centerY = 50;
            const maxRadius = 35; // Safe radius to stay well within the circular pit
            
            let x, y;
            let attempts = 0;
            do {
                // Generate random point within circle
                const angle = Math.random() * 2 * Math.PI;
                const radius = Math.random() * maxRadius;
                
                x = centerX + Math.cos(angle) * radius;
                y = centerY + Math.sin(angle) * radius;
                
                attempts++;
                // Fallback after 20 attempts to prevent infinite loop
                if (attempts > 20) {
                    x = centerX + (Math.random() - 0.5) * 60;
                    y = centerY + (Math.random() - 0.5) * 60;
                    break;
                }
            } while (Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)) > maxRadius);
            
            // Ensure stone doesn't go outside pit bounds (accounting for stone size)
            const halfStone = stoneSize / 2;
            x = Math.max(halfStone + 5, Math.min(95 - halfStone, x));
            y = Math.max(halfStone + 5, Math.min(95 - halfStone, y));
            
            stone.style.left = (x - halfStone) + 'px';
            stone.style.top = (y - halfStone) + 'px';
            stone.style.animationDelay = (i * 0.05) + 's';
            stone.style.zIndex = Math.min(i, 50); // Keep stone z-index below 100 to stay under count display
            
            stonesContainer.appendChild(stone);
        }
    }

    updateStoreDisplay(storeElement, stoneCount) {
        const stoneCountDisplay = storeElement.querySelector('.stone-count');
        const stonesContainer = storeElement.querySelector('.stones-container');
        
        stoneCountDisplay.textContent = stoneCount;
        
        // Clear existing stones
        stonesContainer.innerHTML = '';
        
        // Show all stones in store with random positioning
        for (let i = 0; i < stoneCount; i++) {
            const stone = document.createElement('div');
            stone.className = 'stone';
            
            // Assign a random color to each stone
            const colorIndex = Math.floor(Math.random() * 8);
            stone.classList.add(`stone-color-${colorIndex}`);
            
            // Adjust stone size based on count
            let stoneSize = 12;
            if (stoneCount > 16) stoneSize = 10;
            if (stoneCount > 25) stoneSize = 8;
            if (stoneCount > 40) stoneSize = 6;
            
            stone.style.width = stoneSize + 'px';
            stone.style.height = stoneSize + 'px';
            
            // Random positioning within store bounds (store is 120x200, oval shaped)
            const storeWidth = 120;
            const storeHeight = 200;
            const margin = 8;
            const halfStone = stoneSize / 2;
            
            // Generate random position within the oval store bounds
            let x, y;
            let attempts = 0;
            do {
                x = margin + halfStone + Math.random() * (storeWidth - 2 * margin - stoneSize);
                y = margin + halfStone + Math.random() * (storeHeight - 2 * margin - stoneSize);
                
                // Check if position is within the oval shape (roughly)
                const centerX = storeWidth / 2;
                const centerY = storeHeight / 2;
                const normalizedX = (x - centerX) / (centerX - margin);
                const normalizedY = (y - centerY) / (centerY - margin);
                const distanceFromCenter = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
                
                attempts++;
                if (attempts > 30) break; // Prevent infinite loop
                
            } while (distanceFromCenter > 0.9); // Keep within 90% of the oval
            
            // Ensure final bounds check
            x = Math.max(margin + halfStone, Math.min(storeWidth - margin - halfStone, x));
            y = Math.max(margin + halfStone, Math.min(storeHeight - margin - halfStone, y));
            
            stone.style.left = (x - halfStone) + 'px';
            stone.style.top = (y - halfStone) + 'px';
            stone.style.animationDelay = (i * 0.03) + 's';
            stone.style.zIndex = Math.min(i, 50); // Keep stone z-index below 100 to stay under count display
            
            stonesContainer.appendChild(stone);
        }
    }

    updateTurnIndicator() {
        if (this.gameOver) {
            this.turnIndicator.textContent = "Game Over";
            this.turnIndicator.className = "turn-indicator";
        } else {
            this.turnIndicator.textContent = this.currentPlayer === 0 ? "Your Turn" : "AI Thinking...";
            this.turnIndicator.className = "turn-indicator";
        }
    }

    updatePitInteractivity() {
        this.humanPits.forEach((pit, index) => {
            if (this.currentPlayer === 0 && !this.gameOver && this.board[index] > 0) {
                pit.classList.remove('disabled');
            } else {
                pit.classList.add('disabled');
            }
        });
    }

    async makeMove(pitIndex) {
        if (this.animationInProgress || this.gameOver) {
            console.log('Move blocked - animation in progress:', this.animationInProgress, 'game over:', this.gameOver);
            return;
        }
        
        console.log('Making move for pit:', pitIndex, 'player:', this.currentPlayer);
        this.animationInProgress = true;
        
        const stones = this.board[pitIndex];
        if (stones === 0) {
            this.animationInProgress = false;
            return;
        }
        
        // Show whose turn it is
        if (this.currentPlayer === 1) {
            this.showMessage("AI's turn", "info");
        }
        
        // Clear the selected pit
        this.board[pitIndex] = 0;
        
        // Distribute stones
        let currentPos = pitIndex;
        let remainingStones = stones;
        const distributionPath = [];
        
        while (remainingStones > 0) {
            currentPos = this.getNextPosition(currentPos);
            
            // Skip opponent's store
            if ((this.currentPlayer === 0 && currentPos === 13) || 
                (this.currentPlayer === 1 && currentPos === 6)) {
                continue;
            }
            
            this.board[currentPos]++;
            distributionPath.push(currentPos);
            remainingStones--;
        }
        
        // Animate stone distribution
        await this.animateStoneDistribution(pitIndex, distributionPath);
        
        const lastPosition = currentPos;
        let extraTurn = false;
        let captured = false;
        
        // Check for extra turn (landing in own store)
        if ((this.currentPlayer === 0 && lastPosition === 6) || 
            (this.currentPlayer === 1 && lastPosition === 13)) {
            extraTurn = true;
            if (this.currentPlayer === 0) {
                this.showMessage("Great! You get another turn!", "success");
            } else {
                this.showMessage("AI gets another turn!", "info");
            }
        }
        
        // Check for capture
        if (!extraTurn && this.board[lastPosition] === 1) {
            captured = this.checkCapture(lastPosition);
        }
        
        this.renderBoard();
        
        // Check for game end
        if (this.checkGameEnd()) {
            this.endGame();
        } else if (!extraTurn) {
            // Switch player
            this.currentPlayer = 1 - this.currentPlayer;
            this.renderBoard();
            
            if (this.currentPlayer === 1) {
                // AI turn
                setTimeout(() => this.makeAIMove(), 100);
            }
        } else if (extraTurn && this.currentPlayer === 1) {
            // AI gets another turn
            setTimeout(() => this.makeAIMove(), 100);
        }
        
        console.log('Move completed, resetting animation flag');
        this.animationInProgress = false;
    }

    getNextPosition(pos) {
        return (pos + 1) % 14;
    }

    async animateStoneDistribution(startPit, distributionPath) {
        return new Promise((resolve) => {
            let currentStep = 0;
            
            const animateStep = () => {
                if (currentStep < distributionPath.length) {
                    // Add visual feedback for stone placement
                    const targetPos = distributionPath[currentStep];
                    this.highlightPosition(targetPos);
                    
                    currentStep++;
                    setTimeout(animateStep, 200);
                } else {
                    resolve();
                }
            };
            
            animateStep();
        });
    }

    highlightPosition(position) {
        let element;
        
        if (position === 6) {
            element = this.humanStore;
        } else if (position === 13) {
            element = this.aiStore;
        } else if (position <= 5) {
            element = this.humanPits[position];
        } else {
            element = this.aiPits[12 - position];
        }
        
        if (element) {
            element.classList.add('highlighted');
            setTimeout(() => {
                element.classList.remove('highlighted');
            }, 300);
        }
    }

    checkCapture(lastPosition) {
        const isPlayerSide = (this.currentPlayer === 0 && lastPosition <= 5) || 
                           (this.currentPlayer === 1 && lastPosition >= 7 && lastPosition <= 12);
        
        if (!isPlayerSide) return false;
        
        const oppositePosition = 12 - lastPosition;
        const oppositeStonesCount = this.board[oppositePosition];
        
        if (oppositeStonesCount > 0) {
            // Capture stones
            const capturedStones = 1 + oppositeStonesCount;
            this.board[lastPosition] = 0;
            this.board[oppositePosition] = 0;
            
            // Add to player's store
            if (this.currentPlayer === 0) {
                this.board[6] += capturedStones;
                this.showMessage(`Captured ${capturedStones} stones!`, "success");
            } else {
                this.board[13] += capturedStones;
                this.showMessage(`AI captured ${capturedStones} stones!`, "warning");
            }
            
            return true;
        }
        
        return false;
    }

    checkGameEnd() {
        // Check if all pits on one side are empty
        const humanSideEmpty = this.board.slice(0, 6).every(count => count === 0);
        const aiSideEmpty = this.board.slice(7, 13).every(count => count === 0);
        
        return humanSideEmpty || aiSideEmpty;
    }

    endGame() {
        this.gameOver = true;
        
        // Move remaining stones to respective stores
        const humanRemaining = this.board.slice(0, 6).reduce((sum, count) => sum + count, 0);
        const aiRemaining = this.board.slice(7, 13).reduce((sum, count) => sum + count, 0);
        
        this.board[6] += humanRemaining;
        this.board[13] += aiRemaining;
        
        // Clear all pits
        for (let i = 0; i <= 5; i++) this.board[i] = 0;
        for (let i = 7; i <= 12; i++) this.board[i] = 0;
        
        this.renderBoard();
        
        // Show game result
        const humanScore = this.board[6];
        const aiScore = this.board[13];
        
        const modal = document.getElementById('game-over-modal');
        const resultElement = document.getElementById('game-result');
        const scoreElement = document.getElementById('final-score');
        
        if (humanScore > aiScore) {
            resultElement.textContent = "🎉 You Win!";
            resultElement.style.color = "#2ecc71";
            this.showMessage("Congratulations! You won!", "success");
        } else if (aiScore > humanScore) {
            resultElement.textContent = "🤖 AI Wins!";
            resultElement.style.color = "#e74c3c";
            this.showMessage("AI wins this time. Try again!", "error");
        } else {
            resultElement.textContent = "🤝 It's a Tie!";
            resultElement.style.color = "#f39c12";
            this.showMessage("It's a tie! Great game!", "info");
        }
        
        scoreElement.innerHTML = `
            <div>Your Score: <strong>${humanScore}</strong></div>
            <div>AI Score: <strong>${aiScore}</strong></div>
        `;
        
        modal.style.display = 'block';
    }

    async makeAIMove() {
        if (this.gameOver || this.currentPlayer !== 1) return;
        
        console.log('AI making move, current player:', this.currentPlayer);
        
        // Simple AI strategy with some intelligence
        const bestMove = this.findBestAIMove();
        
        console.log('AI chose move:', bestMove);
        
        if (bestMove !== -1) {
            this.showMessage(`AI selects pit ${bestMove - 6}`, "info");
            await this.makeMove(bestMove);
        } else {
            // No moves available, end turn
            this.showMessage("AI has no moves available", "warning");
            this.currentPlayer = 0;
            this.renderBoard();
        }
    }

    findBestAIMove() {
        const availableMoves = [];
        
        // Find all available moves for AI (pits 7-12)
        for (let i = 7; i <= 12; i++) {
            if (this.board[i] > 0) {
                availableMoves.push(i);
            }
        }
        
        console.log('AI board state:', this.board);
        console.log('Available AI moves:', availableMoves);
        
        if (availableMoves.length === 0) return -1;
        
        // AI strategy priorities:
        // 1. Look for moves that land in AI store (extra turn)
        // 2. Look for capture opportunities
        // 3. Prevent human captures
        // 4. Choose move with most stones
        
        let bestMove = availableMoves[0];
        let bestScore = -1;
        
        for (const move of availableMoves) {
            let score = 0;
            const stones = this.board[move];
            let pos = move;
            
            // Simulate the move
            for (let i = 0; i < stones; i++) {
                pos = this.getNextPosition(pos);
                if (pos === 6) continue; // Skip human store
            }
            
            // Extra turn bonus
            if (pos === 13) {
                score += 100;
            }
            
            // Capture opportunity
            if (pos >= 7 && pos <= 12 && this.board[pos] === 0) {
                const oppositePos = 12 - pos;
                if (this.board[oppositePos] > 0) {
                    score += this.board[oppositePos] * 10;
                }
            }
            
            // Prefer moves with more stones (but not too much)
            score += stones;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }

    showHint() {
        if (this.currentPlayer !== 0 || this.gameOver) {
            this.showMessage("Hints are only available on your turn!", "warning");
            return;
        }
        
        const bestMove = this.findBestHumanMove();
        if (bestMove !== -1) {
            this.humanPits[bestMove].classList.add('highlighted');
            setTimeout(() => {
                this.humanPits[bestMove].classList.remove('highlighted');
            }, 2000);
            
            this.showMessage(`Try pit ${bestMove + 1} - it looks promising!`, "info");
        } else {
            this.showMessage("No moves available!", "warning");
        }
    }

    findBestHumanMove() {
        const availableMoves = [];
        
        // Find all available moves for human (pits 0-5)
        for (let i = 0; i <= 5; i++) {
            if (this.board[i] > 0) {
                availableMoves.push(i);
            }
        }
        
        if (availableMoves.length === 0) return -1;
        
        let bestMove = availableMoves[0];
        let bestScore = -1;
        
        for (const move of availableMoves) {
            let score = 0;
            const stones = this.board[move];
            let pos = move;
            
            // Simulate the move
            for (let i = 0; i < stones; i++) {
                pos = this.getNextPosition(pos);
                if (pos === 13) continue; // Skip AI store
            }
            
            // Extra turn bonus
            if (pos === 6) {
                score += 100;
            }
            
            // Capture opportunity
            if (pos >= 0 && pos <= 5 && this.board[pos] === 0) {
                const oppositePos = 12 - pos;
                if (this.board[oppositePos] > 0) {
                    score += this.board[oppositePos] * 10;
                }
            }
            
            // Prefer moves with more stones
            score += stones;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }

    showMessage(message, type = "info") {
        this.messageDisplay.textContent = message;
        this.messageDisplay.className = `message-display ${type}`;
        
        // Auto-clear message after 3 seconds
        setTimeout(() => {
            this.messageDisplay.textContent = "";
            this.messageDisplay.className = "message-display";
        }, 3000);
    }

    newGame() {
        this.board = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0];
        this.currentPlayer = 0;
        this.gameOver = false;
        this.animationInProgress = false;
        
        this.renderBoard();
        this.showMessage("New game started! Your turn.", "info");
    }
}

// Sound effects (optional)
class SoundManager {
    constructor() {
        this.sounds = {};
        this.muted = false;
    }
    
    createSound(name, frequency, duration) {
        // Create simple beep sounds using Web Audio API
        if (!this.muted && window.AudioContext) {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        }
    }
    
    playMove() {
        this.createSound('move', 400, 0.1);
    }
    
    playCapture() {
        this.createSound('capture', 600, 0.2);
    }
    
    playWin() {
        this.createSound('win', 800, 0.3);
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const game = new MancalaGame();
    const soundManager = new SoundManager();
    
    // Add sound toggle
    const soundToggle = document.createElement('button');
    soundToggle.className = 'btn btn-tertiary';
    soundToggle.innerHTML = '🔊 Sound';
    soundToggle.style.marginLeft = '10px';
    
    soundToggle.addEventListener('click', () => {
        soundManager.muted = !soundManager.muted;
        soundToggle.innerHTML = soundManager.muted ? '🔇 Sound' : '🔊 Sound';
    });
    
    document.querySelector('.game-controls').appendChild(soundToggle);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key >= '1' && e.key <= '6' && game.currentPlayer === 0 && !game.gameOver && !game.animationInProgress) {
            const pitIndex = parseInt(e.key) - 1;
            if (game.board[pitIndex] > 0) {
                game.makeMove(pitIndex);
            }
        } else if (e.key === 'n' || e.key === 'N') {
            game.newGame();
        } else if (e.key === 'h' || e.key === 'H') {
            game.showHint();
        }
    });
    
    // Add keyboard shortcuts info
    const keyboardInfo = document.createElement('div');
    keyboardInfo.style.textAlign = 'center';
    keyboardInfo.style.fontSize = '0.9rem';
    keyboardInfo.style.color = '#666';
    keyboardInfo.style.marginTop = '10px';
    keyboardInfo.innerHTML = '⌨️ Keyboard: 1-6 to play pits, N for new game, H for hint';
    
    document.querySelector('.game-footer').appendChild(keyboardInfo);
});

// Add some Easter eggs and fun features
document.addEventListener('DOMContentLoaded', () => {
    // Konami code for super mode
    let konamiCode = [];
    const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
    
    document.addEventListener('keydown', (e) => {
        konamiCode.push(e.code);
        if (konamiCode.length > konamiSequence.length) {
            konamiCode.shift();
        }
        
        if (konamiCode.join(',') === konamiSequence.join(',')) {
            document.body.style.filter = 'hue-rotate(180deg)';
            const message = document.getElementById('message-display') || document.querySelector('.message-display');
            if (message) {
                message.textContent = '🌈 Rainbow mode activated!';
                message.className = 'message-display success';
            }
            
            // Reset after 5 seconds
            setTimeout(() => {
                document.body.style.filter = '';
            }, 5000);
        }
    });
});