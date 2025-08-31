export type Board = (number | null)[][]

export type Pos = { r: number; c: number }

export type SudokuCellStatus = "none" | "try" | "place" | "backtrack"

export type Highlights = SudokuCellStatus[][] & {
  candidates?: number[][][]
}

export function makeEmptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(null))
}

export function cloneBoard(b: Board): Board {
  return b.map((row) => row.slice())
}

export function toHighlights(b: Board): Highlights {
  const h = Array.from({ length: 9 }, () => Array(9).fill("none")) as Highlights
  return h
}

export function withCandidateHighlights(h: Highlights, candidates: number[][][]): Highlights {
  const nh = h as Highlights
  nh.candidates = candidates
  return nh
}
