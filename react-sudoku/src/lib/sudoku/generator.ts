import type { Board } from "./types"
import { cloneBoard, makeEmptyBoard } from "./types"
import { isValidPlacement } from "./validator"
import { countSolutions } from "./solver"

/**
 * Utility: Fisher-Yates shuffle
 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Generate a completely solved Sudoku board
 */
export function generateSolvedBoard(): Board {
  const board = makeEmptyBoard()
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9]

  const fill = (): boolean => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === null) {
          for (const value of shuffle(numbers)) {
            if (isValidPlacement(board, r, c, value)) {
              board[r][c] = value
              if (fill()) return true
              board[r][c] = null // backtrack
            }
          }
          return false // no valid value
        }
      }
    }
    return true
  }

  fill()
  return board
}

/**
 * Generate a Sudoku puzzle with unique solution
 */
export function generatePuzzle(
  difficulty: "easy" | "medium" | "hard"
): { puzzle: Board } {
  const solved = generateSolvedBoard()
  const puzzle = cloneBoard(solved)

  // Difficulty tuning: number of cells to remove
  const removalMap: Record<typeof difficulty, number> = {
    easy: 40,
    medium: 50,
    hard: 58,
  }
  const removals = removalMap[difficulty]

  // Pre-shuffled cell positions
  const positions: [number, number][] = shuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9])
  )

  let removed = 0
  for (const [r, c] of positions) {
    if (removed >= removals) break

    const backup = puzzle[r][c]
    puzzle[r][c] = null

    // Ensure puzzle still has exactly 1 solution
    if (countSolutions(puzzle, 2) !== 1) {
      puzzle[r][c] = backup
    } else {
      removed++
    }
  }

  return { puzzle }
}
