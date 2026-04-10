import type { PieceColor } from '../data/missions';

export type SpecialType = 'none' | 'striped_h' | 'striped_v' | 'bomb' | 'rainbow';

export const ROWS = 9;
export const COLS = 9;

export interface Piece {
  id: number;
  color: PieceColor;
  row: number;
  col: number;
  special: SpecialType;
  isNew: boolean;
  dClassId: string;
  profession: string;
  isPlayerPiece?: boolean;
  isSurvivor?: boolean;
  hazard?: boolean; // 高危区域：消除时折损率翻倍
}

export interface MatchResult {
  positions: [number, number][];
  color: PieceColor;
  specialToCreate?: { type: SpecialType; row: number; col: number };
}

const COLORS: PieceColor[] = ['blue', 'red', 'green', 'orange', 'purple'];
let nextId = 1;

import { generateDClassId, getRandomProfession } from '../data/professions';

export function createPiece(row: number, col: number, color?: PieceColor): Piece {
  return {
    id: nextId++,
    color: color || COLORS[Math.floor(Math.random() * COLORS.length)],
    row,
    col,
    special: 'none',
    isNew: true,
    dClassId: generateDClassId(),
    profession: getRandomProfession(),
  };
}

export function createBoard(): Piece[][] {
  const board: Piece[][] = [];
  for (let r = 0; r < ROWS; r++) {
    board[r] = [];
    for (let c = 0; c < COLS; c++) {
      let piece = createPiece(r, c);
      while (hasInitialMatch(board, r, c, piece.color)) {
        piece = createPiece(r, c);
      }
      board[r][c] = piece;
    }
  }
  return board;
}

function hasInitialMatch(board: Piece[][], row: number, col: number, color: PieceColor): boolean {
  if (col >= 2 && board[row][col - 1]?.color === color && board[row][col - 2]?.color === color) {
    return true;
  }
  if (row >= 2 && board[row - 1]?.[col]?.color === color && board[row - 2]?.[col]?.color === color) {
    return true;
  }
  return false;
}

/**
 * Check if placing a color at (row, col) would cause a 3-match.
 * Checks both directions and handles nulls in the board.
 */
function wouldCauseMatch(board: Piece[][], row: number, col: number, color: PieceColor): boolean {
  // Check horizontal: left-2, left-1+right, right-2
  const getColor = (r: number, c: number) => board[r]?.[c]?.color;

  // Left 2
  if (col >= 2 && getColor(row, col - 1) === color && getColor(row, col - 2) === color) return true;
  // Left 1 + Right 1
  if (col >= 1 && col < COLS - 1 && getColor(row, col - 1) === color && getColor(row, col + 1) === color) return true;
  // Right 2
  if (col < COLS - 2 && getColor(row, col + 1) === color && getColor(row, col + 2) === color) return true;

  // Check vertical: up-2, up-1+down-1, down-2
  // Up 2
  if (row >= 2 && getColor(row - 1, col) === color && getColor(row - 2, col) === color) return true;
  // Up 1 + Down 1
  if (row >= 1 && row < ROWS - 1 && getColor(row - 1, col) === color && getColor(row + 1, col) === color) return true;
  // Down 2
  if (row < ROWS - 2 && getColor(row + 1, col) === color && getColor(row + 2, col) === color) return true;

  return false;
}

export function isAdjacent(r1: number, c1: number, r2: number, c2: number): boolean {
  return (Math.abs(r1 - r2) + Math.abs(c1 - c2)) === 1;
}

export function swapPieces(board: Piece[][], r1: number, c1: number, r2: number, c2: number): Piece[][] {
  const newBoard = board.map(row => row.map(p => ({ ...p })));
  const temp = { ...newBoard[r1][c1] };
  newBoard[r1][c1] = { ...newBoard[r2][c2], row: r1, col: c1 };
  newBoard[r2][c2] = { ...temp, row: r2, col: c2 };
  return newBoard;
}

export function findMatches(board: Piece[][]): MatchResult[] {
  const matches: MatchResult[] = [];

  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 3; c++) {
      const color = board[r][c].color;
      let len = 1;
      while (c + len < COLS && board[r][c + len].color === color) len++;
      if (len >= 3) {
        const positions: [number, number][] = [];
        for (let i = 0; i < len; i++) positions.push([r, c + i]);
        let specialToCreate: MatchResult['specialToCreate'] = undefined;
        if (len === 4) specialToCreate = { type: 'striped_h', row: r, col: c + 1 };
        else if (len >= 5) specialToCreate = { type: 'rainbow', row: r, col: c + 2 };
        matches.push({ positions, color, specialToCreate });
        c += len - 1;
      }
    }
  }

  // Vertical
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 3; r++) {
      const color = board[r][c].color;
      let len = 1;
      while (r + len < ROWS && board[r + len][c].color === color) len++;
      if (len >= 3) {
        const positions: [number, number][] = [];
        for (let i = 0; i < len; i++) positions.push([r + i, c]);
        let specialToCreate: MatchResult['specialToCreate'] = undefined;
        if (len === 4) specialToCreate = { type: 'striped_v', row: r + 1, col: c };
        else if (len >= 5) specialToCreate = { type: 'rainbow', row: r + 2, col: c };
        matches.push({ positions, color, specialToCreate });
        r += len - 1;
      }
    }
  }

  // L/T shapes
  const posCount = new Map<string, number>();
  for (const m of matches) {
    for (const [r, c] of m.positions) {
      const key = `${r},${c}`;
      posCount.set(key, (posCount.get(key) || 0) + 1);
    }
  }
  for (const [key, count] of posCount.entries()) {
    if (count > 1) {
      const [r, c] = key.split(',').map(Number);
      const intersectMatch = matches.find(m =>
        m.positions.some(([mr, mc]) => mr === r && mc === c) && !m.specialToCreate
      );
      if (intersectMatch) {
        intersectMatch.specialToCreate = { type: 'bomb', row: r, col: c };
      }
    }
  }

  return matches;
}

export function hasAnyMatch(board: Piece[][]): boolean {
  return findMatches(board).length > 0;
}

export function removeMatches(
  board: Piece[][],
  matches: MatchResult[]
): { newBoard: Piece[][]; removed: Piece[]; specials: { type: SpecialType; row: number; col: number; color: PieceColor }[] } {
  const newBoard = board.map(row => row.map(p => ({ ...p })));
  const removed: Piece[] = [];
  const toRemove = new Set<string>();
  const specials: { type: SpecialType; row: number; col: number; color: PieceColor }[] = [];

  for (const match of matches) {
    if (match.specialToCreate) {
      specials.push({ ...match.specialToCreate, color: match.color });
    }
    for (const [r, c] of match.positions) {
      const piece = newBoard[r][c];
      toRemove.add(`${r},${c}`);

      if (piece.special === 'striped_h') {
        for (let cc = 0; cc < COLS; cc++) toRemove.add(`${r},${cc}`);
      } else if (piece.special === 'striped_v') {
        for (let rr = 0; rr < ROWS; rr++) toRemove.add(`${rr},${c}`);
      } else if (piece.special === 'bomb') {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
              toRemove.add(`${nr},${nc}`);
            }
          }
        }
      } else if (piece.special === 'rainbow') {
        for (let rr = 0; rr < ROWS; rr++) {
          for (let cc = 0; cc < COLS; cc++) {
            if (newBoard[rr][cc].color === match.color) {
              toRemove.add(`${rr},${cc}`);
            }
          }
        }
      }
    }
  }

  for (const key of toRemove) {
    const [r, c] = key.split(',').map(Number);
    if (newBoard[r][c]) {
      removed.push(newBoard[r][c]);
      const shouldBeSpecial = specials.find(s => s.row === r && s.col === c);
      if (shouldBeSpecial) {
        newBoard[r][c] = {
          ...createPiece(r, c, shouldBeSpecial.color),
          special: shouldBeSpecial.type,
          isNew: false,
        };
      } else {
        newBoard[r][c] = null as unknown as Piece;
      }
    }
  }

  return { newBoard, removed, specials };
}

/**
 * Apply gravity: pieces fall down, new pieces fill from top.
 * `survivors` are pieces that lived through containment — they get reinserted at random columns at top.
 */
export function applyGravity(board: Piece[][], survivors?: Piece[]): Piece[][] {
  const newBoard = board.map(row => row.map(p => (p ? { ...p } : null))) as (Piece | null)[][];

  // Phase 1: compact existing pieces downward (per column)
  for (let c = 0; c < COLS; c++) {
    let writeRow = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (newBoard[r][c] !== null) {
        if (r !== writeRow) {
          newBoard[writeRow][c] = { ...newBoard[r][c]!, row: writeRow, col: c };
          newBoard[r][c] = null;
        }
        writeRow--;
      }
    }
  }

  // Phase 2: fill empty cells from bottom-up, left-to-right, with safe color selection
  // This ensures both horizontal and vertical neighbors are already placed when checking
  for (let r = ROWS - 1; r >= 0; r--) {
    for (let c = 0; c < COLS; c++) {
      if (newBoard[r][c] === null) {
        let piece = createPiece(r, c);
        let attempts = 0;
        while (attempts < 30 && wouldCauseMatch(newBoard as Piece[][], r, c, piece.color)) {
          piece = createPiece(r, c);
          attempts++;
        }
        newBoard[r][c] = piece;
      }
    }
  }

  // Phase 3: Insert survivors with safe color check
  if (survivors && survivors.length > 0) {
    for (const s of survivors) {
      const col = Math.floor(Math.random() * COLS);
      const survivorPiece = {
        ...s,
        row: 0,
        col,
        isNew: true,
        isSurvivor: true,
        special: 'none' as SpecialType,
      };
      // Only insert if it won't cause a match; otherwise skip this survivor
      if (!wouldCauseMatch(newBoard as Piece[][], 0, col, s.color)) {
        newBoard[0][col] = survivorPiece;
      }
    }
  }

  return newBoard as Piece[][];
}

/**
 * 在棋盘上生成高危区域（2×2或3×2的矩形污染区）
 * hazardCount: 生成几个高危区域
 */
export function generateHazardPositions(hazardCount: number): Set<string> {
  const positions = new Set<string>();
  for (let i = 0; i < hazardCount; i++) {
    const isWide = Math.random() > 0.5;
    const h = 2;
    const w = isWide ? 3 : 2;
    const startR = Math.floor(Math.random() * (ROWS - h));
    const startC = Math.floor(Math.random() * (COLS - w));
    for (let dr = 0; dr < h; dr++) {
      for (let dc = 0; dc < w; dc++) {
        positions.add(`${startR + dr},${startC + dc}`);
      }
    }
  }
  return positions;
}

export function applyHazardZones(board: Piece[][], hazardCount: number): Piece[][] {
  const positions = generateHazardPositions(hazardCount);
  return stampHazardFlags(board, positions);
}

export function stampHazardFlags(board: Piece[][], positions: Set<string>): Piece[][] {
  const newBoard = board.map(row => row.map(p => ({ ...p, hazard: false })));
  for (const key of positions) {
    const [r, c] = key.split(',').map(Number);
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      newBoard[r][c].hazard = true;
    }
  }
  return newBoard;
}

export function hasPossibleMoves(board: Piece[][]): boolean {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (c < COLS - 1) {
        const swapped = swapPieces(board, r, c, r, c + 1);
        if (hasAnyMatch(swapped)) return true;
      }
      if (r < ROWS - 1) {
        const swapped = swapPieces(board, r, c, r + 1, c);
        if (hasAnyMatch(swapped)) return true;
      }
    }
  }
  return false;
}

export function getColorCounts(removed: Piece[]): Record<PieceColor, number> {
  const counts: Record<PieceColor, number> = {
    blue: 0, red: 0, green: 0, orange: 0, purple: 0,
  };
  for (const p of removed) counts[p.color]++;
  return counts;
}

/**
 * Survival roll: determine which deployed D-class survive containment.
 * securityLevel 1 = safe (~80%), 2 (~60%), 3 (~40%), 4 (~20%), 5 (~5%)
 */
export function rollSurvival(deployed: Piece[], securityLevel: number): { survivors: Piece[]; dead: Piece[] } {
  const survivalRate = Math.max(0.05, 1 - securityLevel * 0.2);
  const survivors: Piece[] = [];
  const dead: Piece[] = [];
  for (const p of deployed) {
    if (Math.random() < survivalRate) {
      survivors.push(p);
    } else {
      dead.push(p);
    }
  }
  return { survivors, dead };
}

/**
 * Containment breach: randomly destroy some pieces and scramble part of the board.
 */
export function triggerContainmentBreach(board: Piece[][]): { newBoard: Piece[][]; casualties: Piece[] } {
  const newBoard = board.map(row => row.map(p => ({ ...p })));
  const casualties: Piece[] = [];
  const numDestroy = 3 + Math.floor(Math.random() * 5); // 3-7 pieces destroyed

  for (let i = 0; i < numDestroy; i++) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (newBoard[r][c]) {
      casualties.push(newBoard[r][c]);
      newBoard[r][c] = null as unknown as Piece;
    }
  }

  // Also scramble a 3×3 area
  const sr = Math.floor(Math.random() * (ROWS - 2));
  const sc = Math.floor(Math.random() * (COLS - 2));
  const pool: PieceColor[] = [];
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      if (newBoard[sr + dr]?.[sc + dc]) {
        pool.push(newBoard[sr + dr][sc + dc].color);
      }
    }
  }
  // Shuffle pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  let pi = 0;
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      if (newBoard[sr + dr]?.[sc + dc] && pi < pool.length) {
        newBoard[sr + dr][sc + dc].color = pool[pi++];
      }
    }
  }

  // Apply gravity to fill destroyed holes
  const filled = applyGravity(newBoard);
  return { newBoard: filled, casualties };
}