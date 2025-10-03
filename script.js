/**
 * Mancala front-end logic built on top of MancalaEngine.
 * Handles DOM updates, user interaction, and AI behaviour.
 */

const HUMAN_PLAYER = 0;
const AI_PLAYER = 1;
const AI_MOVE_DELAY_MS = 0;
const AI_EXTRA_TURN_DELAY_MS = 0;

class MancalaGame {
    constructor({ soundManager } = {}) {
        if (typeof MancalaEngine !== "function") {
            throw new Error("MancalaEngine is not available. Did you include engine.js?");
        }

        this.engine = new MancalaEngine();
        this.soundManager = soundManager ?? null;
        this.inputLocked = false;
        this.messageTimeout = null;

        this.cacheDOM();
        this.registerEventListeners();
        this.refreshUI();
        this.showMessage("Your turn! Click on any of your pits to start.", "info");
    }

    cacheDOM() {
        this.humanPits = [];
        this.aiPits = [];

        for (let i = 0; i <= 5; i++) {
            const pit = document.querySelector(`[data-pit="${i}"]`);
            if (pit) {
                this.humanPits.push(pit);
            }
        }

        for (let i = 12; i >= 7; i--) {
            const pit = document.querySelector(`[data-pit="${i}"]`);
            if (pit) {
                this.aiPits.push(pit);
            }
        }

        this.humanStore = document.getElementById("human-store");
        this.aiStore = document.getElementById("ai-store");
        this.turnIndicator = document.getElementById("turn-indicator");
        this.messageDisplay = document.getElementById("message-display");
        this.humanScoreDisplay = document.getElementById("human-score");
        this.aiScoreDisplay = document.getElementById("ai-score");
        this.rulesModal = document.getElementById("rules-modal");
        this.gameOverModal = document.getElementById("game-over-modal");
        this.gameResultText = document.getElementById("game-result");
        this.finalScoreText = document.getElementById("final-score");
    }

    registerEventListeners() {
        this.humanPits.forEach((pitElement, index) => {
            pitElement.addEventListener("click", () => this.makeMove(index));
        });

        const newGameBtn = document.getElementById("new-game-btn");
        if (newGameBtn) {
            newGameBtn.addEventListener("click", () => this.newGame());
        }

        const hintBtn = document.getElementById("hint-btn");
        if (hintBtn) {
            hintBtn.addEventListener("click", () => this.showHint());
        }

        const rulesBtn = document.getElementById("rules-btn");
        const closeRulesBtn = this.rulesModal?.querySelector(".close-modal");
        if (rulesBtn && this.rulesModal) {
            rulesBtn.addEventListener("click", () => {
                this.rulesModal.style.display = "block";
            });
        }
        if (closeRulesBtn && this.rulesModal) {
            closeRulesBtn.addEventListener("click", () => {
                this.rulesModal.style.display = "none";
            });
        }
        window.addEventListener("click", (event) => {
            if (event.target === this.rulesModal) {
                this.rulesModal.style.display = "none";
            }
            if (event.target === this.gameOverModal) {
                this.gameOverModal.style.display = "none";
            }
        });

        const playAgainBtn = document.getElementById("play-again-btn");
        if (playAgainBtn) {
            playAgainBtn.addEventListener("click", () => {
                this.gameOverModal.style.display = "none";
                this.newGame();
            });
        }
    }

    refreshUI() {
        const board = this.engine.getBoard();

        this.humanPits.forEach((pitElement, index) => {
            this.updatePitDisplay(pitElement, board[index]);
        });

        this.aiPits.forEach((pitElement, displayIndex) => {
            const boardIndex = 12 - displayIndex;
            this.updatePitDisplay(pitElement, board[boardIndex]);
        });

        this.updateStoreDisplay(this.humanStore, board[6]);
        this.updateStoreDisplay(this.aiStore, board[13]);

        this.updateScores();
        this.updateTurnIndicator();
        this.updatePitInteractivity();
    }

    updateScores() {
        const scores = this.engine.getScores();
        this.humanScoreDisplay.textContent = scores.human;
        this.aiScoreDisplay.textContent = scores.ai;
    }

    makeMove(pitIndex) {
        if (this.engine.gameOver) {
            return;
        }
        if (this.inputLocked) {
            this.showMessage("Please wait for the AI to finish its turn.", "warning");
            return;
        }
        if (this.engine.currentPlayer !== HUMAN_PLAYER) {
            this.showMessage("It's not your turn right now!", "warning");
            return;
        }
        if (!this.engine.isValidMove(pitIndex, HUMAN_PLAYER)) {
            this.showMessage("Choose a pit that contains stones.", "warning");
            return;
        }

        this.performMove(pitIndex);
    }

    performMove(pitIndex) {
        try {
            const result = this.engine.applyMove(pitIndex);
            if (this.soundManager) {
                this.soundManager.playMove();
            }
            this.refreshUI();
            this.handleMoveOutcome(result);
        } catch (error) {
            console.error(error);
            this.showMessage(error.message, "error");
        }
    }

    handleMoveOutcome(result) {
        if (result.capture) {
            const captured = result.capture.captured;
            if (result.player === HUMAN_PLAYER) {
                this.showMessage(`Captured ${captured} stones!`, "success");
            } else {
                this.showMessage(`AI captured ${captured} stones!`, "warning");
            }
            if (this.soundManager) {
                this.soundManager.playCapture();
            }
        }

        if (result.gameOver) {
            this.lockInput(true);
            this.refreshUI();
            this.handleGameOver();
            return;
        }

        if (result.extraTurn) {
            if (result.player === HUMAN_PLAYER) {
                this.lockInput(false);
                this.showMessage("You get another turn!", "success");
                this.refreshUI();
            } else {
                this.showMessage("AI gets another turn!", "info");
                this.scheduleAIMove(AI_EXTRA_TURN_DELAY_MS);
            }
            return;
        }

        if (this.engine.currentPlayer === AI_PLAYER) {
            this.scheduleAIMove(AI_MOVE_DELAY_MS);
        } else {
            this.lockInput(false);
            this.refreshUI();
        }
    }

    scheduleAIMove(delay = 0) {
        if (this.engine.gameOver) {
            this.lockInput(false);
            return;
        }

        this.lockInput(true);
        this.updateTurnIndicator();

        const actualDelay = Math.max(0, delay);
        if (actualDelay > 0) {
            this.showMessage("AI is thinking...", "info");
        }

        setTimeout(() => this.makeAIMove(), actualDelay);
    }

    makeAIMove() {
        if (this.engine.gameOver) {
            this.lockInput(true);
            return;
        }
        if (this.engine.currentPlayer !== AI_PLAYER) {
            this.lockInput(false);
            this.refreshUI();
            return;
        }

        const move = this.chooseBestAIMove();
        if (move === null) {
            this.lockInput(false);
            this.refreshUI();
            if (!this.engine.gameOver) {
                this.showMessage("AI has no moves.", "info");
            }
            return;
        }

        try {
            const result = this.engine.applyMove(move);
            if (this.soundManager) {
                this.soundManager.playMove();
            }
            this.refreshUI();
            this.handleMoveOutcome(result);
        } catch (error) {
            console.error(error);
            this.lockInput(false);
            this.showMessage("AI encountered an error while moving.", "error");
        }
    }

    chooseBestAIMove() {
        const candidateMoves = this.engine.getValidMoves(AI_PLAYER);
        if (candidateMoves.length === 0) {
            return null;
        }

        let bestMove = candidateMoves[0];
        let bestScore = -Infinity;

        for (const pit of candidateMoves) {
            const score = this.evaluateMove(AI_PLAYER, pit);
            if (score > bestScore) {
                bestScore = score;
                bestMove = pit;
            }
        }

        return bestMove;
    }

    evaluateMove(player, pitIndex) {
        const { engine: simulatedEngine, result } = this.engine.simulateMove(pitIndex);
        const playerKey = player === HUMAN_PLAYER ? "human" : "ai";
        const opponentKey = player === HUMAN_PLAYER ? "ai" : "human";

        let score = (result.scores[playerKey] - result.scores[opponentKey]) * 6;

        if (result.extraTurn) {
            score += 40;
        }
        if (result.capture) {
            score += 15 + result.capture.captured * 3;
        }
        if (result.gameOver) {
            const finalScores = result.scores;
            score += (finalScores[playerKey] - finalScores[opponentKey]) * 20;
            return score;
        }

        const opponent = player === HUMAN_PLAYER ? AI_PLAYER : HUMAN_PLAYER;
        const opponentMoves = simulatedEngine.getValidMoves(opponent);
        if (opponentMoves.length === 0) {
            score += 10;
        } else {
            let worstOpponent = -Infinity;
            for (const oppPit of opponentMoves) {
                const { result: oppResult } = simulatedEngine.simulateMove(oppPit);
                let oppScore = (oppResult.scores[opponentKey] - oppResult.scores[playerKey]) * 6;
                if (oppResult.extraTurn) {
                    oppScore += 35;
                }
                if (oppResult.capture) {
                    oppScore += 15 + oppResult.capture.captured * 2;
                }
                if (oppResult.gameOver) {
                    oppScore += (oppResult.scores[opponentKey] - oppResult.scores[playerKey]) * 15;
                }
                if (oppScore > worstOpponent) {
                    worstOpponent = oppScore;
                }
            }
            score -= worstOpponent * 0.6;
        }

        return score;
    }

    showHint() {
        if (this.engine.gameOver) {
            this.showMessage("The game is over.", "warning");
            return;
        }
        if (this.engine.currentPlayer !== HUMAN_PLAYER) {
            this.showMessage("Hints are only available on your turn!", "warning");
            return;
        }
        if (this.inputLocked) {
            this.showMessage("Please wait for the AI to finish its turn.", "warning");
            return;
        }

        const candidateMoves = this.engine.getValidMoves(HUMAN_PLAYER);
        if (candidateMoves.length === 0) {
            this.showMessage("No moves available!", "warning");
            return;
        }

        let bestMove = candidateMoves[0];
        let bestScore = -Infinity;
        for (const pit of candidateMoves) {
            const score = this.evaluateMove(HUMAN_PLAYER, pit);
            if (score > bestScore) {
                bestScore = score;
                bestMove = pit;
            }
        }

        const pitElement = this.humanPits[bestMove];
        if (pitElement) {
            pitElement.classList.add("highlighted");
            setTimeout(() => pitElement.classList.remove("highlighted"), 2000);
        }

        this.showMessage(`Hint: Try pit ${bestMove + 1}.`, "info");
    }

    lockInput(locked) {
        this.inputLocked = locked;
        this.updatePitInteractivity();
    }

    updateTurnIndicator() {
        if (!this.turnIndicator) {
            return;
        }

        if (this.engine.gameOver) {
            this.turnIndicator.textContent = "Game Over";
            this.turnIndicator.className = "turn-indicator";
            return;
        }

        if (this.engine.currentPlayer === HUMAN_PLAYER && !this.inputLocked) {
            this.turnIndicator.textContent = "Your Turn";
        } else if (this.engine.currentPlayer === HUMAN_PLAYER && this.inputLocked) {
            this.turnIndicator.textContent = "Please wait...";
        } else {
            this.turnIndicator.textContent = "AI Thinking...";
        }
    }

    updatePitInteractivity() {
        const board = this.engine.getBoard();
        this.humanPits.forEach((pitElement, index) => {
            const shouldEnable = !this.engine.gameOver && !this.inputLocked && this.engine.currentPlayer === HUMAN_PLAYER && board[index] > 0;
            if (shouldEnable) {
                pitElement.classList.remove("disabled");
            } else {
                pitElement.classList.add("disabled");
            }
        });
    }

    updatePitDisplay(pitElement, stoneCount) {
        if (!pitElement) {
            return;
        }
        const countDisplay = pitElement.querySelector(".stone-count");
        const stonesContainer = pitElement.querySelector(".stones-container");

        if (countDisplay) {
            countDisplay.textContent = stoneCount;
        }
        if (!stonesContainer) {
            return;
        }

        stonesContainer.innerHTML = "";
        for (let i = 0; i < stoneCount; i++) {
            const stone = document.createElement("div");
            stone.className = "stone";
            stone.classList.add(`stone-color-${Math.floor(Math.random() * 8)}`);

            let size = 12;
            if (stoneCount > 8) size = 10;
            if (stoneCount > 15) size = 8;
            if (stoneCount > 25) size = 6;
            stone.style.width = `${size}px`;
            stone.style.height = `${size}px`;

            const centerX = 50;
            const centerY = 50;
            const maxRadius = 35;
            let attempts = 0;
            let x = centerX;
            let y = centerY;

            while (attempts < 20) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * maxRadius;
                x = centerX + Math.cos(angle) * radius;
                y = centerY + Math.sin(angle) * radius;
                const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                if (distance <= maxRadius) {
                    break;
                }
                attempts++;
            }

            const half = size / 2;
            x = Math.max(half + 5, Math.min(95 - half, x));
            y = Math.max(half + 5, Math.min(95 - half, y));

            stone.style.left = `${x - half}px`;
            stone.style.top = `${y - half}px`;
            stone.style.animationDelay = `${i * 0.05}s`;
            stone.style.zIndex = Math.min(i, 50);

            stonesContainer.appendChild(stone);
        }
    }

    updateStoreDisplay(storeElement, stoneCount) {
        if (!storeElement) {
            return;
        }
        const countDisplay = storeElement.querySelector(".stone-count");
        const stonesContainer = storeElement.querySelector(".stones-container");

        if (countDisplay) {
            countDisplay.textContent = stoneCount;
        }
        if (!stonesContainer) {
            return;
        }

        stonesContainer.innerHTML = "";
        for (let i = 0; i < stoneCount; i++) {
            const stone = document.createElement("div");
            stone.className = "stone";
            stone.classList.add(`stone-color-${Math.floor(Math.random() * 8)}`);

            let size = 12;
            if (stoneCount > 16) size = 10;
            if (stoneCount > 25) size = 8;
            if (stoneCount > 40) size = 6;
            stone.style.width = `${size}px`;
            stone.style.height = `${size}px`;

            const storeWidth = 120;
            const storeHeight = 200;
            const margin = 8;
            const half = size / 2;

            let attempts = 0;
            let x = storeWidth / 2;
            let y = storeHeight / 2;

            while (attempts < 30) {
                x = margin + half + Math.random() * (storeWidth - 2 * (margin + half));
                y = margin + half + Math.random() * (storeHeight - 2 * (margin + half));
                const normX = (x - storeWidth / 2) / ((storeWidth / 2) - margin);
                const normY = (y - storeHeight / 2) / ((storeHeight / 2) - margin);
                if (normX * normX + normY * normY <= 1) {
                    break;
                }
                attempts++;
            }

            x = Math.max(margin + half, Math.min(storeWidth - margin - half, x));
            y = Math.max(margin + half, Math.min(storeHeight - margin - half, y));

            stone.style.left = `${x - half}px`;
            stone.style.top = `${y - half}px`;
            stone.style.animationDelay = `${i * 0.03}s`;
            stone.style.zIndex = Math.min(i, 50);

            stonesContainer.appendChild(stone);
        }
    }

    showMessage(message, type = "info") {
        if (!this.messageDisplay) {
            return;
        }
        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
            this.messageTimeout = null;
        }

        this.messageDisplay.textContent = message;
        this.messageDisplay.className = `message-display ${type}`;

        if (message) {
            this.messageTimeout = setTimeout(() => {
                this.messageDisplay.textContent = "";
                this.messageDisplay.className = "message-display";
            }, 3000);
        }
    }

    handleGameOver() {
        const board = this.engine.getBoard();
        const humanScore = board[6];
        const aiScore = board[13];

        let resultText = "🤝 It's a Tie!";
        let color = "#f39c12";
        if (humanScore > aiScore) {
            resultText = "🎉 You Win!";
            color = "#2ecc71";
            if (this.soundManager) {
                this.soundManager.playWin();
            }
            this.showMessage("Congratulations! You won!", "success");
        } else if (aiScore > humanScore) {
            resultText = "🤖 AI Wins!";
            color = "#e74c3c";
            this.showMessage("AI wins this time. Try again!", "error");
        } else {
            this.showMessage("It's a tie! Great game!", "info");
        }

        if (this.gameResultText) {
            this.gameResultText.textContent = resultText;
            this.gameResultText.style.color = color;
        }

        if (this.finalScoreText) {
            this.finalScoreText.innerHTML = `
                <div>Your Score: <strong>${humanScore}</strong></div>
                <div>AI Score: <strong>${aiScore}</strong></div>
            `;
        }

        if (this.gameOverModal) {
            this.gameOverModal.style.display = "block";
        }
    }

    newGame() {
        this.engine.reset();
        this.lockInput(false);
        if (this.gameOverModal) {
            this.gameOverModal.style.display = "none";
        }
        this.refreshUI();
        this.showMessage("New game started! Your turn.", "info");
    }
}

class SoundManager {
    constructor() {
        this.sounds = {};
        this.muted = false;
    }

    createSound(frequency, duration) {
        if (this.muted || !window.AudioContext) {
            return;
        }
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }

    playMove() {
        this.createSound(420, 0.1);
    }

    playCapture() {
        this.createSound(640, 0.2);
    }

    playWin() {
        this.createSound(880, 0.3);
    }
}

// Initialise the game when the DOM is ready.
document.addEventListener("DOMContentLoaded", () => {
    const soundManager = new SoundManager();
    const game = new MancalaGame({ soundManager });

    const soundToggle = document.createElement("button");
    soundToggle.className = "btn btn-tertiary";
    soundToggle.innerHTML = "🔊 Sound";
    soundToggle.style.marginLeft = "10px";
    soundToggle.addEventListener("click", () => {
        soundManager.muted = !soundManager.muted;
        soundToggle.innerHTML = soundManager.muted ? "🔇 Sound" : "🔊 Sound";
    });

    const controls = document.querySelector(".game-controls");
    if (controls) {
        controls.appendChild(soundToggle);
    }

    document.addEventListener("keydown", (event) => {
        if (event.key >= "1" && event.key <= "6") {
            const pitIndex = parseInt(event.key, 10) - 1;
            if (!Number.isNaN(pitIndex)) {
                game.makeMove(pitIndex);
            }
        }
        if (event.key === "n" || event.key === "N") {
            game.newGame();
        }
        if (event.key === "h" || event.key === "H") {
            game.showHint();
        }
    });

    const keyboardInfo = document.createElement("div");
    keyboardInfo.style.textAlign = "center";
    keyboardInfo.style.fontSize = "0.9rem";
    keyboardInfo.style.color = "#666";
    keyboardInfo.style.marginTop = "10px";
    keyboardInfo.innerHTML = "⌨️ Keyboard: 1-6 to play pits, N for new game, H for hint";

    const footer = document.querySelector(".game-footer");
    if (footer) {
        footer.appendChild(keyboardInfo);
    }

    // Easter egg: Konami code for rainbow mode.
    const konamiInput = [];
    const konamiSequence = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "KeyB", "KeyA"];
    document.addEventListener("keydown", (event) => {
        konamiInput.push(event.code);
        if (konamiInput.length > konamiSequence.length) {
            konamiInput.shift();
        }
        if (konamiInput.join(",") === konamiSequence.join(",")) {
            document.body.style.filter = "hue-rotate(180deg)";
            const message = document.getElementById("message-display") || document.querySelector(".message-display");
            if (message) {
                message.textContent = "🌈 Rainbow mode activated!";
                message.className = "message-display success";
            }
            setTimeout(() => {
                document.body.style.filter = "";
            }, 5000);
        }
    });
});