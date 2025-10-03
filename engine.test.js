const assert = require("assert");
const MancalaEngine = require("./engine");

function testInitialState() {
    const engine = new MancalaEngine();
    assert.deepStrictEqual(engine.getBoard(), [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0], "Initial board incorrect");
    assert.strictEqual(engine.currentPlayer, 0, "Initial player should be human");
    assert.deepStrictEqual(engine.getValidMoves(0), [0, 1, 2, 3, 4, 5], "Human moves incorrect");
    assert.deepStrictEqual(engine.getValidMoves(1), [7, 8, 9, 10, 11, 12], "AI moves incorrect");
}

function testExtraTurn() {
    const engine = new MancalaEngine();
    const result = engine.applyMove(2);
    assert.strictEqual(result.extraTurn, true, "Should earn an extra turn when landing in store");
    assert.strictEqual(engine.currentPlayer, 0, "Player should retain turn after landing in own store");
    assert.strictEqual(engine.getBoard()[6], 1, "Store should have one stone after extra turn move");
}

function testCapture() {
    const board = [0, 0, 0, 1, 0, 0, 0, 4, 3, 4, 4, 4, 4, 0];
    const engine = new MancalaEngine(board, 0);
    const result = engine.applyMove(3);
    assert.ok(result.capture, "Capture should occur");
    assert.strictEqual(result.capture.captured, 4, "Captured stone count incorrect");
    assert.strictEqual(engine.getBoard()[6], 4, "Captured stones should be added to human store");
    assert.strictEqual(engine.getBoard()[4], 0, "Landing pit should be cleared after capture");
    assert.strictEqual(engine.getBoard()[8], 0, "Opposite pit should be cleared after capture");
}

function testSkipOpponentStore() {
    const board = [10, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4, 4, 4, 0];
    const engine = new MancalaEngine(board, 0);
    const result = engine.applyMove(0);
    assert.ok(!result.sequence.includes(13), "Move sequence should skip opponent store");
    assert.strictEqual(engine.getBoard()[13], 0, "Opponent store should not receive stones during player's turn");
}

function testGameEndSweep() {
    const board = [0, 0, 0, 0, 0, 1, 20, 0, 0, 0, 0, 0, 5, 15];
    const engine = new MancalaEngine(board, 0);
    const result = engine.applyMove(5);
    assert.strictEqual(result.gameOver, true, "Game should end when one side is empty");
    assert.strictEqual(engine.gameOver, true, "Engine should mark game as over");
    assert.strictEqual(engine.getBoard()[6], 21, "Human store should include final stone");
    assert.strictEqual(engine.getBoard()[13], 20, "AI store should collect remaining stones");
    for (let i = 0; i <= 5; i++) {
        assert.strictEqual(engine.getBoard()[i], 0, "Human pits should be empty after sweep");
    }
    for (let i = 7; i <= 12; i++) {
        assert.strictEqual(engine.getBoard()[i], 0, "AI pits should be empty after sweep");
    }
}

const tests = [
    { name: "Initial state", fn: testInitialState },
    { name: "Extra turn logic", fn: testExtraTurn },
    { name: "Capture rules", fn: testCapture },
    { name: "Skip opponent store", fn: testSkipOpponentStore },
    { name: "Game end sweep", fn: testGameEndSweep }
];

let passed = 0;
for (const { name, fn } of tests) {
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(error.stack);
        process.exit(1);
    }
}

console.log(`\n${passed}/${tests.length} tests passed.`);
