"use client"

import type React from "react"
import { cn } from "../../lib/utils"
import type { SudokuCellStatus, Highlights, Pos } from "../../lib/sudoku/types"
import { memo } from "react"

export function Board({
  board,
  fixedMask,
  selected,
  highlights,
  showCandidates,
  onSelect,
  onInput,
  conflicts,
  placedFlash,
  backtrackFlash,
}: {
  board: (number | null)[][]
  fixedMask: boolean[][]
  selected: Pos | null
  highlights: Highlights
  showCandidates: boolean
  onSelect: (r: number, c: number) => void
  onInput: (r: number, c: number, v: number | null) => void
  conflicts: boolean[][]
  placedFlash?: boolean[][]
  backtrackFlash?: boolean[][]
}) {
  const selectedValue = selected ? board[selected.r][selected.c] : null
  return (
    <div className="select-none">
      <div
        role="grid"
        aria-label="Sudoku 9x9 grid"
        className="grid grid-cols-9 overflow-hidden rounded-2xl border-2 border-gray-300 shadow-lg"
      >
        {board.map((row, r) =>
          row.map((val, c) => (
            <Cell
              key={`${r}-${c}`}
              r={r}
              c={c}
              value={val}
              fixed={!!fixedMask[r][c]}
              status={highlights[r][c]}
              selected={!!selected && selected.r === r && selected.c === c}
              emphasised={selected ? isSameGroup(selected, { r, c }) : false}
              sameNumber={
                selectedValue !== null &&
                val !== null &&
                val === selectedValue &&
                !(selected && selected.r === r && selected.c === c)
              }
              showCandidates={showCandidates}
              candidates={highlights.candidates?.[r]?.[c] ?? null}
              onSelect={onSelect}
              onInput={onInput}
              conflict={!!conflicts?.[r]?.[c]}
              flashPlaced={!!placedFlash?.[r]?.[c]}
              flashBacktrack={!!backtrackFlash?.[r]?.[c]}
            />
          )),
        )}
      </div>
    </div>
  )
}

function isSameGroup(a: Pos, b: Pos) {
  const sameRow = a.r === b.r
  const sameCol = a.c === b.c
  const sameBox = Math.floor(a.r / 3) === Math.floor(b.r / 3) && Math.floor(a.c / 3) === Math.floor(b.c / 3)
  return sameRow || sameCol || sameBox
}

const Cell = memo(function Cell({
  r,
  c,
  value,
  fixed,
  status,
  selected,
  emphasised,
  sameNumber,
  showCandidates,
  candidates,
  onSelect,
  onInput,
  conflict,
  flashPlaced,
  flashBacktrack,
}: {
  r: number
  c: number
  value: number | null
  fixed: boolean
  status: SudokuCellStatus
  selected: boolean
  emphasised: boolean
  sameNumber: boolean
  showCandidates: boolean
  candidates: number[] | null
  onSelect: (r: number, c: number) => void
  onInput: (r: number, c: number, v: number | null) => void
  conflict: boolean
  flashPlaced: boolean
  flashBacktrack: boolean
}) {
  const focusCell = (rr: number, cc: number) => {
    const el = document.getElementById(`cell-${rr}-${cc}`) as HTMLButtonElement | null
    el?.focus()
  }

  const thickLeft = c % 3 === 0
  const thickTop = r % 3 === 0

  const flashBg = flashBacktrack
    ? "bg-rose-200"
    : flashPlaced
      ? "bg-green-200"
      : ""

  const bgByStatus =
    status === "try"
      ? "bg-yellow-100"
      : status === "place"
        ? "bg-green-100"
        : status === "backtrack"
          ? "bg-rose-100"
          : ""

  const persistentFilledBg = value !== null && !fixed ? "bg-green-50" : ""

  const emphasis = selected
    ? "ring-2 ring-blue-400"
    : conflict
      ? "ring-2 ring-rose-500 bg-rose-50"
      : sameNumber
        ? "bg-blue-50"
        : emphasised
          ? "bg-gray-100"
          : ""

  const textColor = fixed ? "text-gray-900 font-bold" : "text-blue-700"

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key >= "1" && e.key <= "9") {
      if (!fixed) onInput(r, c, Number.parseInt(e.key, 10))
      return
    }
    if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
      if (!fixed) onInput(r, c, null)
      return
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      const nr = Math.max(0, r - 1)
      onSelect(nr, c)
      focusCell(nr, c)
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      const nr = Math.min(8, r + 1)
      onSelect(nr, c)
      focusCell(nr, c)
      return
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault()
      const nc = Math.max(0, c - 1)
      onSelect(r, nc)
      focusCell(r, nc)
      return
    }
    if (e.key === "ArrowRight") {
      e.preventDefault()
      const nc = Math.min(8, c + 1)
      onSelect(r, nc)
      focusCell(r, nc)
      return
    }
  }

  return (
    <button
      id={`cell-${r}-${c}`}
      role="gridcell"
      onClick={() => onSelect(r, c)}
      onFocus={() => onSelect(r, c)}
      onKeyDown={onKeyDown}
      tabIndex={0}
      className={cn(
        "relative flex aspect-square w-10 md:w-12 lg:w-14 items-center justify-center border border-gray-300 text-lg font-medium transition-all duration-150 ease-in-out",
        "hover:bg-gray-50 focus:scale-105 focus:z-10",
        persistentFilledBg,
        flashBg || bgByStatus,
        emphasis,
        thickLeft && "border-l-2",
        thickTop && "border-t-2",
      )}
      aria-label={`Row ${r + 1}, Column ${c + 1}${value ? `, value ${value}` : ""}${fixed ? ", fixed" : ""}${conflict ? ", conflict" : ""}`}
    >
      {value ? (
        <span className={cn("select-none transition-colors", textColor)}>{value}</span>
      ) : showCandidates && candidates && candidates.length > 0 ? (
        <div className="pointer-events-none grid grid-cols-3 gap-0.5 p-1 text-[10px] leading-3 text-gray-500">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <span key={n} className={cn("text-center", candidates.includes(n) ? "" : "opacity-20")}>
              {n}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  )
})
