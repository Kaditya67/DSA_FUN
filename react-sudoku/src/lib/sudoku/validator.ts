import type { Board } from "./types"

/** Returns non-null values from a row */
export function rowValues(board: Board, r: number): number[] {
  return board[r].filter((v): v is number => v !== null)
}

/** Returns non-null values from a column */
export function colValues(board: Board, c: number): number[] {
  return board.map((row) => row[c]).filter((v): v is number => v !== null)
}

/** Returns non-null values from the 3x3 box containing (r, c) */
export function boxValues(board: Board, r: number, c: number): number[] {
  const br = Math.floor(r / 3) * 3
  const bc = Math.floor(c / 3) * 3
  const vals: number[] = []
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const v = board[br + i][bc + j]
      if (v !== null) vals.push(v)
    }
  }
  return vals
}

/** Checks if placing value v at (r, c) is valid */
export function isValidPlacement(board: Board, r: number, c: number, v: number): boolean {
  if (v < 1 || v > 9) return false
  if (board[r][c] !== null) return false
  return (
    !rowValues(board, r).includes(v) &&
    !colValues(board, c).includes(v) &&
    !boxValues(board, r, c).includes(v)
  )
}

/** Returns all possible candidates for (r, c) */
export function possibleCandidates(board: Board, r: number, c: number): number[] {
  if (board[r][c] !== null) return []
  const candidates: number[] = []
  for (let v = 1; v <= 9; v++) {
    if (isValidPlacement(board, r, c, v)) candidates.push(v)
  }
  return candidates
}

/** Validates that no row, column, or box contains duplicates */
export function isBoardValid(board: Board): boolean {
  const isUnique = (vals: number[]) => new Set(vals).size === vals.length

  for (let r = 0; r < 9; r++) if (!isUnique(rowValues(board, r))) return false
  for (let c = 0; c < 9; c++) if (!isUnique(colValues(board, c))) return false

  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const vals: number[] = []
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const v = board[br * 3 + i][bc * 3 + j]
          if (v !== null) vals.push(v)
        }
      }
      if (!isUnique(vals)) return false
    }
  }
  return true
}

/** Checks if the board is completely filled and valid */
export function isSolved(board: Board): boolean {
  return board.every((row) => row.every((cell) => cell !== null)) && isBoardValid(board)
}