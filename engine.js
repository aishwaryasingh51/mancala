(function (global) {
    "use strict";

    const INITIAL_BOARD = Object.freeze([4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0]);
    const PIT_RANGE = {
        0: { start: 0, end: 5, store: 6 },
        1: { start: 7, end: 12, store: 13 }
    };

    class MancalaEngine {
        constructor(board, currentPlayer = 0) {
            this.initialBoard = Array.from(board ?? INITIAL_BOARD);
            this.initialPlayer = currentPlayer;
            this.reset(this.initialBoard, currentPlayer);
        }

        reset(board, currentPlayer) {
            const hasCustomBoard = Array.isArray(board);
            const sourceBoard = hasCustomBoard ? Array.from(board) : Array.from(this.initialBoard);

            if (hasCustomBoard) {
                this.initialBoard = Array.from(board);
            }

            const nextPlayer = typeof currentPlayer === "number"
                ? currentPlayer
                : hasCustomBoard
                    ? 0
                    : this.initialPlayer ?? 0;

            this.board = sourceBoard;
            this.currentPlayer = nextPlayer;
            this.initialPlayer = nextPlayer;
            this.gameOver = false;
        }

        clone() {
            const clone = new MancalaEngine(this.board, this.currentPlayer);
            clone.gameOver = this.gameOver;
            return clone;
        }

        getBoard() {
            return Array.from(this.board);
        }

        getScores() {
            return {
                human: this.board[6],
                ai: this.board[13]
            };
        }

        getValidMoves(player = this.currentPlayer) {
            if (this.gameOver) return [];
            const range = PIT_RANGE[player];
            const moves = [];
            for (let pit = range.start; pit <= range.end; pit++) {
                if (this.board[pit] > 0) {
                    moves.push(pit);
                }
            }
            return moves;
        }

        isValidMove(pitIndex, player = this.currentPlayer) {
            if (this.gameOver) return false;
            const range = PIT_RANGE[player];
            if (!range) return false;
            return pitIndex >= range.start && pitIndex <= range.end && this.board[pitIndex] > 0;
        }

        applyMove(pitIndex) {
            if (this.gameOver) {
                throw new Error("Cannot make a move after the game has ended");
            }

            if (!this.isValidMove(pitIndex, this.currentPlayer)) {
                throw new Error(`Invalid move: pit ${pitIndex}`);
            }

            const player = this.currentPlayer;
            const moveSummary = {
                player,
                pitIndex,
                stonesPicked: this.board[pitIndex],
                sequence: []
            };

            let stones = this.board[pitIndex];
            this.board[pitIndex] = 0;
            let position = pitIndex;

            while (stones > 0) {
                position = (position + 1) % 14;
                if (this.shouldSkipPosition(position, player)) {
                    continue;
                }
                this.board[position] += 1;
                stones -= 1;
                moveSummary.sequence.push(position);
            }

            moveSummary.lastPosition = position;
            moveSummary.landedInStore = this.isOwnStore(position, player);

            if (!moveSummary.landedInStore) {
                const capture = this.tryCapture(position, player);
                if (capture) {
                    moveSummary.capture = capture;
                }
            }

            if (this.isSideEmpty(0) || this.isSideEmpty(1)) {
                moveSummary.sweep = this.collectRemainingStones();
                this.gameOver = true;
            }

            if (!moveSummary.landedInStore && !this.gameOver) {
                this.currentPlayer = 1 - player;
            }

            moveSummary.extraTurn = moveSummary.landedInStore;
            moveSummary.board = this.getBoard();
            moveSummary.currentPlayer = this.currentPlayer;
            moveSummary.gameOver = this.gameOver;
            moveSummary.scores = this.getScores();

            return moveSummary;
        }

        simulateMove(pitIndex) {
            const clone = this.clone();
            const result = clone.applyMove(pitIndex);
            return { engine: clone, result };
        }

        shouldSkipPosition(position, player) {
            return (player === 0 && position === 13) || (player === 1 && position === 6);
        }

        isOwnStore(position, player) {
            const range = PIT_RANGE[player];
            return position === range.store;
        }

        isOwnSide(position, player) {
            const range = PIT_RANGE[player];
            return position >= range.start && position <= range.end;
        }

        tryCapture(position, player) {
            if (!this.isOwnSide(position, player)) {
                return null;
            }

            if (this.board[position] !== 1) {
                return null;
            }

            const opposite = 12 - position;
            const oppositeStones = this.board[opposite];
            if (oppositeStones === 0) {
                return null;
            }

            const store = PIT_RANGE[player].store;
            const captured = oppositeStones + 1;
            this.board[store] += captured;
            this.board[position] = 0;
            this.board[opposite] = 0;

            return {
                pit: position,
                opposite,
                store,
                captured
            };
        }

        isSideEmpty(player) {
            const range = PIT_RANGE[player];
            for (let pit = range.start; pit <= range.end; pit++) {
                if (this.board[pit] !== 0) {
                    return false;
                }
            }
            return true;
        }

        collectRemainingStones() {
            const humanRemaining = this.sumRange(0, 5);
            const aiRemaining = this.sumRange(7, 12);

            if (humanRemaining > 0) {
                this.board[6] += humanRemaining;
                for (let pit = 0; pit <= 5; pit++) {
                    this.board[pit] = 0;
                }
            }

            if (aiRemaining > 0) {
                this.board[13] += aiRemaining;
                for (let pit = 7; pit <= 12; pit++) {
                    this.board[pit] = 0;
                }
            }

            return {
                humanRemaining,
                aiRemaining,
                board: this.getBoard(),
                scores: this.getScores()
            };
        }

        sumRange(start, end) {
            let total = 0;
            for (let pit = start; pit <= end; pit++) {
                total += this.board[pit];
            }
            return total;
        }
    }

    if (typeof module !== "undefined" && module.exports) {
        module.exports = MancalaEngine;
    }

    if (global) {
        global.MancalaEngine = MancalaEngine;
    }
})(typeof window !== "undefined" ? window : globalThis);
