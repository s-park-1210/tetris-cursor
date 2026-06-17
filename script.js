// ─── 상수 ───────────────────────────────────────────────
const COLS = 10;
const ROWS = 20;
const DROP_INTERVAL_MS = 800;
const SPAWN_ROW = -1;

const LINE_SCORES = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

const PIECE_TYPES = ["I", "O", "T", "S", "Z", "J", "L"];

const SHAPES = {
  I: {
    matrix: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: "cell--piece-i",
  },
  O: {
    matrix: [
      [1, 1],
      [1, 1],
    ],
    color: "cell--piece-o",
  },
  T: {
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "cell--piece-t",
  },
  S: {
    matrix: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: "cell--piece-s",
  },
  Z: {
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: "cell--piece-z",
  },
  J: {
    matrix: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "cell--piece-j",
  },
  L: {
    matrix: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "cell--piece-l",
  },
};

// ─── DOM ──────────────────────────────────────────────────
const boardElement = document.getElementById("board");
const scoreElement = document.getElementById("score");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const gameOverElement = document.getElementById("game-over");

// ─── 게임 상태 (board: 0 = 빈 칸, 그 외 = 블록 타입) ─────
let score = 0;
let board = createEmptyBoard();
let currentPiece = null;
let boardCells = [];
let dropTimer = null;
let isPlaying = false;
let isGameOver = false;
let isLocking = false;

// ─── 보드 유틸 ────────────────────────────────────────────
function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function isCellInsideBoard(boardRow, boardCol) {
  return (
    boardRow >= 0 &&
    boardRow < ROWS &&
    boardCol >= 0 &&
    boardCol < COLS
  );
}

function getCellIndex(boardRow, boardCol) {
  return boardRow * COLS + boardCol;
}

// matrix의 채워진 칸마다 visitor 호출 (false 반환 시 순회 중단)
function forEachFilledCell(matrix, pieceRow, pieceCol, visitor) {
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (!matrix[row][col]) {
        continue;
      }

      const boardRow = pieceRow + row;
      const boardCol = pieceCol + col;

      if (visitor(boardRow, boardCol) === false) {
        return false;
      }
    }
  }

  return true;
}

// ─── 블록 생성 ────────────────────────────────────────────
function getPieceColorClass(type) {
  return SHAPES[type]?.color ?? "";
}

function randomPieceType() {
  const index = Math.floor(Math.random() * PIECE_TYPES.length);
  return PIECE_TYPES[index];
}

function createPiece(type) {
  const shape = SHAPES[type];
  const matrixWidth = shape.matrix[0].length;

  return {
    type,
    matrix: shape.matrix.map((row) => [...row]),
    row: SPAWN_ROW,
    col: Math.floor((COLS - matrixWidth) / 2),
  };
}

function rotateMatrix(matrix) {
  const rowCount = matrix.length;
  const colCount = matrix[0].length;
  const rotated = Array.from({ length: colCount }, () =>
    Array(rowCount).fill(0),
  );

  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < colCount; col++) {
      rotated[col][rowCount - 1 - row] = matrix[row][col];
    }
  }

  return rotated;
}

// ─── 충돌 판정 ───────────────────────────────────────────
function canSpawn(piece) {
  let hasVisibleCell = false;

  const isClear = forEachFilledCell(
    piece.matrix,
    piece.row,
    piece.col,
    (boardRow, boardCol) => {
      if (boardCol < 0 || boardCol >= COLS || boardRow >= ROWS) {
        return false;
      }

      if (boardRow >= 0) {
        hasVisibleCell = true;
        if (board[boardRow][boardCol] !== 0) {
          return false;
        }
      }
    },
  );

  return isClear && hasVisibleCell;
}

function canMove(piece, deltaCol, deltaRow, matrix) {
  const nextRow = piece.row + deltaRow;
  const nextCol = piece.col + deltaCol;

  return forEachFilledCell(matrix, nextRow, nextCol, (boardRow, boardCol) => {
    if (boardCol < 0 || boardCol >= COLS || boardRow >= ROWS) {
      return false;
    }

    if (boardRow < 0) {
      return;
    }

    if (board[boardRow][boardCol] !== 0) {
      return false;
    }
  });
}

// ─── 블록 고정 · 라인 · 점수 ─────────────────────────────
function lockPiece() {
  if (!currentPiece) {
    return;
  }

  const { matrix, row, col, type } = currentPiece;

  forEachFilledCell(matrix, row, col, (boardRow, boardCol) => {
    if (isCellInsideBoard(boardRow, boardCol)) {
      board[boardRow][boardCol] = type;
    }
  });
}

function calculateLineScore(linesCleared) {
  if (linesCleared <= 0) {
    return 0;
  }

  return LINE_SCORES[linesCleared] ?? linesCleared * 100;
}

function addScore(linesCleared) {
  const points = calculateLineScore(linesCleared);
  if (points <= 0) {
    return;
  }

  score += points;
  updateScoreDisplay();
}

function clearLines() {
  let linesCleared = 0;

  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row].every((cell) => cell !== 0)) {
      board.splice(row, 1);
      board.unshift(Array(COLS).fill(0));
      linesCleared++;
      row++;
    }
  }

  addScore(linesCleared);
  return linesCleared;
}

// ─── 렌더링 ─────────────────────────────────────────────
function initBoardElement() {
  boardElement.innerHTML = "";
  boardCells = [];

  for (let i = 0; i < ROWS * COLS; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    boardElement.appendChild(cell);
    boardCells.push(cell);
  }
}

function mergeActivePieceIntoSnapshot(snapshot) {
  if (!currentPiece) {
    return;
  }

  const { matrix, row, col, type } = currentPiece;

  forEachFilledCell(matrix, row, col, (boardRow, boardCol) => {
    if (isCellInsideBoard(boardRow, boardCol)) {
      snapshot[boardRow][boardCol] = type;
    }
  });
}

function renderBoard() {
  const snapshot = board.map((row) => [...row]);
  mergeActivePieceIntoSnapshot(snapshot);

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = boardCells[getCellIndex(row, col)];
      const pieceType = snapshot[row][col];

      cell.className = "cell";
      const colorClass = getPieceColorClass(pieceType);
      if (colorClass) {
        cell.classList.add(colorClass);
      }
    }
  }
}

function updateScoreDisplay() {
  scoreElement.textContent = String(score);
}

function showGameOver() {
  gameOverElement.hidden = false;
}

function hideGameOver() {
  gameOverElement.hidden = true;
}

// ─── 게임 흐름 ───────────────────────────────────────────
function canAcceptPieceInput() {
  return currentPiece !== null && isPlaying && !isLocking;
}

function spawnNewPiece() {
  const nextPiece = createPiece(randomPieceType());

  if (!canSpawn(nextPiece)) {
    enterGameOver();
    return;
  }

  currentPiece = nextPiece;
}

function enterGameOver() {
  stopDropTimer();
  isPlaying = false;
  isGameOver = true;
  currentPiece = null;
  showGameOver();
  renderBoard();
}

function lockAndSpawnNext() {
  if (isLocking || !currentPiece) {
    return;
  }

  isLocking = true;

  try {
    lockPiece();
    clearLines();
    spawnNewPiece();
  } finally {
    isLocking = false;
  }
}

function tryMovePiece(deltaCol, deltaRow) {
  if (!canAcceptPieceInput()) {
    return false;
  }

  if (!canMove(currentPiece, deltaCol, deltaRow, currentPiece.matrix)) {
    return false;
  }

  currentPiece.row += deltaRow;
  currentPiece.col += deltaCol;
  renderBoard();
  return true;
}

function rotatePiece() {
  if (!currentPiece || !isPlaying) {
    return;
  }

  const rotatedMatrix = rotateMatrix(currentPiece.matrix);

  if (!canMove(currentPiece, 0, 0, rotatedMatrix)) {
    return;
  }

  currentPiece.matrix = rotatedMatrix;
  renderBoard();
}

function hardDrop() {
  if (!canAcceptPieceInput()) {
    return;
  }

  while (canMove(currentPiece, 0, 1, currentPiece.matrix)) {
    currentPiece.row += 1;
  }

  lockAndSpawnNext();
  renderBoard();
}

function movePieceDown() {
  if (!canAcceptPieceInput()) {
    return;
  }

  if (canMove(currentPiece, 0, 1, currentPiece.matrix)) {
    currentPiece.row += 1;
  } else {
    lockAndSpawnNext();
  }

  renderBoard();
}

// ─── 입력 · 타이머 ───────────────────────────────────────
function handleKeyDown(event) {
  if (!isPlaying) {
    return;
  }

  const keyActions = {
    ArrowLeft: () => tryMovePiece(-1, 0),
    ArrowRight: () => tryMovePiece(1, 0),
    ArrowDown: () => movePieceDown(),
    ArrowUp: () => rotatePiece(),
    Space: () => hardDrop(),
  };

  const action = keyActions[event.code];
  if (!action) {
    return;
  }

  event.preventDefault();
  action();
}

function initKeyboardControls() {
  document.addEventListener("keydown", handleKeyDown);
}

function stopDropTimer() {
  if (dropTimer !== null) {
    clearInterval(dropTimer);
    dropTimer = null;
  }
}

function startDropTimer() {
  stopDropTimer();
  dropTimer = setInterval(movePieceDown, DROP_INTERVAL_MS);
}

function stopGame() {
  stopDropTimer();
  isPlaying = false;
}

function startGame() {
  stopGame();
  hideGameOver();
  isGameOver = false;
  isPlaying = true;
  startDropTimer();
}

function resetGame() {
  stopGame();
  hideGameOver();
  isGameOver = false;
  isLocking = false;
  score = 0;
  board = createEmptyBoard();
  currentPiece = createPiece(randomPieceType());
  updateScoreDisplay();
  renderBoard();
}

function restartGame() {
  resetGame();
  startGame();
}

// ─── 초기화 ─────────────────────────────────────────────
startBtn.addEventListener("click", restartGame);
restartBtn.addEventListener("click", restartGame);

initBoardElement();
initKeyboardControls();
resetGame();
