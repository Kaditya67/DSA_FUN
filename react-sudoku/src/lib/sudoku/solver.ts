import type { Board } from "./types"
import { cloneBoard } from "./types"
import { isValidPlacement } from "./validator"

export type SolveEvent =
  | { type: "try"; r: number; c: number; v: number; board: Board }
  | { type: "place"; r: number; c: number; v: number; board: Board }
  | { type: "backtrack"; r: number; c: number; v: number | null; board: Board }

/**
 * Generator-based backtracking solver that yields detailed events
 * for visualization (try → place → backtrack).
 */
export function* solveWithEvents(initial: Board): Generator<SolveEvent, boolean, void> {
  const board = cloneBoard(initial)

  function findEmpty(): [number, number] | null {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === null) return [r, c]
      }
    }
    return null
  }

  function* backtrack(): Generator<SolveEvent, boolean, void> {
    const empty = findEmpty()
    if (!empty) return true // solved
    const [r, c] = empty

    for (let v = 1; v <= 9; v++) {
      yield { type: "try", r, c, v, board: cloneBoard(board) }

      if (isValidPlacement(board, r, c, v)) {
        board[r][c] = v
        yield { type: "place", r, c, v, board: cloneBoard(board) }

        if (yield* backtrack()) return true

        // backtrack
        board[r][c] = null
        yield { type: "backtrack", r, c, v: null, board: cloneBoard(board) }
      }
    }
    return false
  }

  return yield* backtrack()
}

/**
 * Instant solver (no events).
 * Returns solved board or null if unsolvable.
 */
export function instantSolve(initial: Board): Board | null {
  const board = cloneBoard(initial)

  const solve = (): boolean => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === null) {
          for (let v = 1; v <= 9; v++) {
            if (isValidPlacement(board, r, c, v)) {
              board[r][c] = v
              if (solve()) return true
              board[r][c] = null // backtrack
            }
          }
          return false
        }
      }
    }
    return true
  }

  return solve() ? board : null
}

/**
 * Counts the number of solutions for a board (up to a cap).
 * Useful for puzzle generation to ensure uniqueness.
 */
export function countSolutions(initial: Board, cap = 2): number {
  const board = cloneBoard(initial)
  let found = 0

  const solve = (): void => {
    if (found >= cap) return

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === null) {
          for (let v = 1; v <= 9; v++) {
            if (isValidPlacement(board, r, c, v)) {
              board[r][c] = v
              solve()
              board[r][c] = null
              if (found >= cap) return
            }
          }
          return
        }
      }
    }
    found++ // reached a valid solution
  }

  solve()
  return found
}
