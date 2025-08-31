"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Board, Highlights, Pos } from "../lib/sudoku/types"
import { makeEmptyBoard, cloneBoard, toHighlights, withCandidateHighlights } from "../lib/sudoku/types"
import { isBoardValid, isSolved, possibleCandidates } from "../lib/sudoku/validator"
import { generatePuzzle } from "../lib/sudoku/generator"
import { instantSolve, solveWithEvents, type SolveEvent } from "../lib/sudoku/solver.ts"

type Difficulty = "easy" | "medium" | "hard" | "random"
type Mode = "play" | "visualize"

export function useSudoku() {
  const [puzzle, setPuzzle] = useState<Board>(() => makeEmptyBoard())
  const [board, setBoard] = useState<Board>(() => makeEmptyBoard())
  const [fixedMask, setFixedMask] = useState<boolean[][]>(() => Array.from({ length: 9 }, () => Array(9).fill(false)))
  const [selected, setSelected] = useState<Pos | null>(null)
  const [highlights, setHighlights] = useState<Highlights>(() => toHighlights(board))
  const [difficulty, setDifficulty] = useState<Difficulty>("easy")
  const [mode, setMode] = useState<Mode>("play")
  const [validState, setValidState] = useState<"unknown" | "valid" | "invalid" | "solved">("unknown")
  const [message, setMessage] = useState("Ready.")
  const [showCandidates, setShowCandidates] = useState(false)

  // Visualizer state
  const [steps, setSteps] = useState<SolveEvent[]>([])
  const [stepIndex, setStepIndex] = useState(-1) // -1 means base board
  const visualizeBaseRef = useRef<Board>(makeEmptyBoard())
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(300)
  const playTimer = useRef<number | null>(null)

  // Stats
  const [stats, setStats] = useState({ attempts: 0, placements: 0, backtracks: 0 })

  // Conflicts mask for invalid boards in play mode
  const emptyMask = () => Array.from({ length: 9 }, () => Array(9).fill(false))
  const [conflicts, setConflicts] = useState<boolean[][]>(emptyMask())

  // Simple step/action log for learning
  const [stepLog, setStepLog] = useState<string[]>([])
  const log = useCallback((msg: string) => {
    const stamp = new Date().toLocaleTimeString()
    setStepLog((prev) => [`[${stamp}] ${msg}`, ...prev].slice(0, 200))
  }, [])
  const clearLog = useCallback(() => setStepLog([]), [])

  const selectCell = useCallback((r: number, c: number) => {
    setSelected({ r, c })
  }, [])

  const fixedFromBoard = (b: Board) => b.map((row) => row.map((v) => v !== null))

  const applyHighlights = useCallback(
    (b: Board) => {
      let h = toHighlights(b)
      if (showCandidates) {
        const cands = Array.from({ length: 9 }, (_, r) =>
          Array.from({ length: 9 }, (_, c) => (b[r][c] === null ? possibleCandidates(b, r, c) : [])),
        )
        h = withCandidateHighlights(h, cands)
      }
      setHighlights(h)
    },
    [showCandidates],
  )

  useEffect(() => {
    applyHighlights(board)
  }, [board, applyHighlights])

  const generatePuzzleCb = useCallback(() => {
    const d =
      difficulty === "random" ? (["easy", "medium", "hard"][Math.floor(Math.random() * 3)] as Difficulty) : difficulty
    const { puzzle: p } = generatePuzzle(d)
    setPuzzle(p)
    setBoard(cloneBoard(p))
    setFixedMask(fixedFromBoard(p))
    setValidState("unknown")
    setMessage(`Generated ${d} puzzle.`)
    setConflicts(emptyMask())
    clearLog()
    log(`Generated ${d} puzzle`)
    resetVisualizer()
  }, [difficulty, clearLog, log])

  const clearBoard = useCallback(() => {
    const empty = makeEmptyBoard()
    setBoard(empty)
    setFixedMask(fixedFromBoard(empty))
    setValidState("unknown")
    setMessage("Board cleared.")
    setConflicts(emptyMask())
    clearLog()
    log("Cleared board")
    resetVisualizer()
  }, [clearLog, log])

  const resetToPuzzle = useCallback(() => {
    setBoard(cloneBoard(puzzle))
    setFixedMask(fixedFromBoard(puzzle))
    setValidState("unknown")
    setMessage("Reset to original puzzle.")
    setConflicts(emptyMask())
    clearLog()
    log("Reset to puzzle")
    resetVisualizer()
  }, [puzzle, clearLog, log])

  // Compute conflicts for duplicates in rows/cols/boxes
  const computeConflicts = useCallback((b: Board) => {
    const mask = emptyMask()
    // rows
    for (let r = 0; r < 9; r++) {
      const counts = new Map<number, number[]>()
      for (let c = 0; c < 9; c++) {
        const v = b[r][c]
        if (v) counts.set(v, [...(counts.get(v) ?? []), c])
      }
      for (const [, cols] of counts) {
        if (cols.length > 1) cols.forEach((cc) => (mask[r][cc] = true))
      }
    }
    // cols
    for (let c = 0; c < 9; c++) {
      const counts = new Map<number, number[]>()
      for (let r = 0; r < 9; r++) {
        const v = b[r][c]
        if (v) counts.set(v, [...(counts.get(v) ?? []), r])
      }
      for (const [, rows] of counts) {
        if (rows.length > 1) rows.forEach((rr) => (mask[rr][c] = true))
      }
    }
    // boxes
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        const counts = new Map<number, Pos[]>()
        for (let r = br * 3; r < br * 3 + 3; r++) {
          for (let c = bc * 3; c < bc * 3 + 3; c++) {
            const v = b[r][c]
            if (v) counts.set(v, [...(counts.get(v) ?? []), { r, c }])
          }
        }
        for (const [, poses] of counts) {
          if (poses.length > 1) poses.forEach(({ r, c }) => (mask[r][c] = true))
        }
      }
    }
    return mask
  }, [])

  const validateNow = useCallback(() => {
    if (isSolved(board)) {
      setValidState("solved")
      setMessage("Board is correctly solved.")
      setConflicts(emptyMask())
      log("Validated: solved")
    } else if (isBoardValid(board)) {
      setValidState("valid")
      setMessage("Board is valid so far.")
      setConflicts(emptyMask())
      log("Validated: valid")
    } else {
      setValidState("invalid")
      setMessage("Board has conflicts.")
      setConflicts(computeConflicts(board))
      log("Validated: invalid (conflicts highlighted)")
    }
  }, [board, computeConflicts, log])

  // Ephemeral flash masks for placed/backtrack
  const [placedFlash, setPlacedFlash] = useState<boolean[][]>(emptyMask())
  const [backtrackFlash, setBacktrackFlash] = useState<boolean[][]>(emptyMask())

  const flashAt = useCallback((kind: "place" | "backtrack", r: number, c: number, ms = 300) => {
    const setter = kind === "place" ? setPlacedFlash : setBacktrackFlash
    setter((prev) => {
      const next = prev.map((row) => row.slice())
      next[r][c] = true
      return next
    })
    window.setTimeout(() => {
      setter((prev) => {
        const next = prev.map((row) => row.slice())
        next[r][c] = false
        return next
      })
    }, ms)
  }, [])

  const handleInput = useCallback(
    (r: number, c: number, v: number | null) => {
      if (mode !== "play" || playing) return
      if (fixedMask[r][c]) return
      resetVisualizer()
      setBoard((prev) => {
        const next = cloneBoard(prev)
        next[r][c] = v
        return next
      })
      if (v !== null) {
        // Flash very light green when a user places a value
        flashAt("place", r, c, 350)
      }
      setValidState("unknown")
      setConflicts(emptyMask()) // clear conflicts on edit
      log(v === null ? `R${r + 1}C${c + 1} cleared` : `R${r + 1}C${c + 1} = ${v}`)
      setMessage("Edited cell.")
    },
    [fixedMask, mode, playing, log, flashAt],
  )

  function resetVisualizer() {
    setSteps([])
    setStepIndex(-1)
    setPlaying(false)
    if (playTimer.current) {
      window.clearTimeout(playTimer.current)
      playTimer.current = null
    }
    setStats({ attempts: 0, placements: 0, backtracks: 0 })
    // Clear ephemeral flashes on reset
    setPlacedFlash(emptyMask())
    setBacktrackFlash(emptyMask())
  }

  // Helper to compute highlights (with candidates) for a board and mark current step cell/type if provided
  const computeHighlights = useCallback(
    (b: Board, mark?: { r: number; c: number; type: SolveEvent["type"] }) => {
      let h = toHighlights(b)
      if (showCandidates) {
        const cands = Array.from({ length: 9 }, (_, rr) =>
          Array.from({ length: 9 }, (_, cc) => (b[rr][cc] === null ? possibleCandidates(b, rr, cc) : [])),
        )
        h = withCandidateHighlights(h, cands)
      }
      if (mark) h[mark.r][mark.c] = mark.type
      return h
    },
    [showCandidates],
  )

  // Generate steps from the current board
  const generateSteps = useCallback(() => {
    if (mode !== "visualize") setMode("visualize")
    resetVisualizer()
    const base = cloneBoard(puzzle)
    visualizeBaseRef.current = base
    setBoard(cloneBoard(puzzle))
    setFixedMask(fixedFromBoard(puzzle))
    setConflicts(emptyMask())
    setValidState("unknown")

    const collected: SolveEvent[] = []
    for (const ev of solveWithEvents(cloneBoard(base))) collected.push(ev)

    setSteps(collected)
    setStepIndex(-1)
    setHighlights(computeHighlights(visualizeBaseRef.current))
    setMessage(`Generated ${collected.length} steps from original puzzle.`)
    log(`Generated ${collected.length} steps from original puzzle`)
  }, [puzzle, mode, setMode, computeHighlights, log])

  // Recalc stats for a given index
  const recalcStats = useCallback(
    (idx: number) => {
      const sl = idx >= 0 ? steps.slice(0, idx + 1) : []
      const attempts = sl.filter((e) => e.type === "try").length
      const placements = sl.filter((e) => e.type === "place").length
      const backtracks = sl.filter((e) => e.type === "backtrack").length
      return { attempts, placements, backtracks }
    },
    [steps],
  )

  // Apply a specific step index (-1 = base)
  const applyIndex = useCallback(
    (idx: number) => {
      setStepIndex(idx)
      if (idx < 0) {
        const b = visualizeBaseRef.current
        setBoard(cloneBoard(b))
        setHighlights(computeHighlights(b))
        setStats(recalcStats(idx))
        setMessage("Visualizer at start.")
        return
      }
      const ev = steps[idx]
      setBoard(ev.board)
      setHighlights(computeHighlights(ev.board, { r: ev.r, c: ev.c, type: ev.type }))
      setStats(recalcStats(idx))
      const label = ev.type === "try" ? "Try" : ev.type === "place" ? "Place" : "Backtrack"
      setMessage(`${label} at R${ev.r + 1}C${ev.c + 1}${ev.v ? ` = ${ev.v}` : ""}`)
      log(`${label} R${ev.r + 1}C${ev.c + 1}${ev.v ? ` = ${ev.v}` : ""}`)

      // Flash very light colors to make step obvious
      if (ev.type === "place") {
        flashAt("place", ev.r, ev.c, 300)
      } else if (ev.type === "backtrack") {
        flashAt("backtrack", ev.r, ev.c, 300)
      }
    },
    [steps, computeHighlights, recalcStats, log, flashAt],
  )

  // Move to next step; lazily generate steps if needed
  const step = useCallback(() => {
    if (mode !== "visualize") {
      setMessage("Turn on Visualize and Generate Steps first.")
      return
    }
    if (steps.length === 0) {
      setMessage("Generate steps first.")
      return
    }
    setStepIndex((idx) => {
      const next = Math.min(idx + 1, steps.length - 1)
      if (next !== idx) applyIndex(next)
      else {
        setPlaying(false)
        setMessage("Visualization complete.")
        log("Visualization complete")
      }
      return next
    })
  }, [mode, steps.length, applyIndex, log])

  // Previous step
  const prevStep = useCallback(() => {
    if (mode !== "visualize") return
    if (steps.length === 0) return
    if (stepIndex <= -1) return
    setPlaying(false)
    setStepIndex((idx) => {
      const prev = Math.max(-1, idx - 1)
      applyIndex(prev)
      return prev
    })
  }, [mode, steps.length, stepIndex, applyIndex])

  // Toggle auto play using next step
  const togglePlay = useCallback(() => {
    if (mode !== "visualize") return
    if (steps.length === 0) {
      setMessage("Generate steps first.")
      return
    }
    setPlaying((p) => {
      const next = !p
      if (!next && playTimer.current) {
        window.clearTimeout(playTimer.current)
        playTimer.current = null
      }
      return next
    })
  }, [mode, steps.length])

  // Drive auto-play with an effect
  useEffect(() => {
    if (!playing) return
    if (stepIndex >= steps.length - 1) {
      setPlaying(false)
      return
    }
    playTimer.current = window.setTimeout(
      () => {
        // advance one step
        setStepIndex((idx) => {
          const next = Math.min(idx + 1, steps.length - 1)
          applyIndex(next)
          return next
        })
      },
      Math.max(0, speed),
    ) as unknown as number
    return () => {
      if (playTimer.current) {
        window.clearTimeout(playTimer.current)
        playTimer.current = null
      }
    }
  }, [playing, speed, stepIndex, steps.length, applyIndex])

  const instantSolveCb = useCallback(() => {
    const solved = instantSolve(cloneBoard(board))
    if (solved) {
      setBoard(solved)
      setValidState("solved")
      setMessage("Solved instantly.")
      setConflicts(emptyMask())
      log("Solved instantly")
      resetVisualizer()
    } else {
      setMessage("No solution found.")
      log("Instant solve failed (no solution)")
    }
  }, [board, log])

  // Clear conflicts when switching to visualize
  useEffect(() => {
    if (mode === "visualize") setConflicts(emptyMask())
  }, [mode])

  const solveFull = useCallback(() => {
    if (mode !== "visualize") {
      setMessage("Turn on Visualize to use Solve Full.")
      return
    }
    setPlaying(false)

    // If no steps yet, generate from the original puzzle (preserve problem state)
    if (steps.length === 0) {
      resetVisualizer()
      const base = cloneBoard(puzzle)
      visualizeBaseRef.current = base
      setBoard(cloneBoard(base))
      setFixedMask(fixedFromBoard(puzzle))
      setConflicts(emptyMask())
      setValidState("unknown")

      const collected: SolveEvent[] = []
      for (const ev of solveWithEvents(cloneBoard(base))) collected.push(ev)
      setSteps(collected)

      const lastIdx = collected.length - 1
      setStepIndex(lastIdx)

      if (lastIdx >= 0) {
        const lastEv = collected[lastIdx]
        setBoard(lastEv.board)
        setHighlights(computeHighlights(lastEv.board, { r: lastEv.r, c: lastEv.c, type: lastEv.type }))
        // recompute stats quickly
        const attempts = collected.filter((e) => e.type === "try").length
        const placements = collected.filter((e) => e.type === "place").length
        const backtracks = collected.filter((e) => e.type === "backtrack").length
        setStats({ attempts, placements, backtracks })
        setMessage("Visualization complete.")
        log(`Solve Full by visualization (${collected.length} steps)`)
      } else {
        // Already solved or nothing to do
        setHighlights(computeHighlights(base))
        setStats({ attempts: 0, placements: 0, backtracks: 0 })
        setMessage("Nothing to visualize.")
      }
      return
    }

    // Fast-forward existing steps
    applyIndex(steps.length - 1)
    setPlaying(false)
    setMessage("Visualization complete.")
    log("Solve Full (fast-forward)")
  }, [mode, steps.length, puzzle, computeHighlights, applyIndex, log, setPlaying])

  // Initial generate
  useEffect(() => {
    generatePuzzleCb()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    board,
    fixedMask,
    selected,
    selectCell,
    highlights,
    showCandidates,
    setShowCandidates,
    difficulty,
    setDifficulty,
    generatePuzzle: generatePuzzleCb,
    clearBoard,
    resetToPuzzle,
    validateNow,
    validState,
    mode,
    setMode,
    instantSolve: instantSolveCb,
    playing,
    step, // Next
    prevStep,
    togglePlay,
    generateSteps,
    resetVisualization: resetVisualizer,
    speed,
    setSpeed,
    handleInput,
    message,
    stats,
    conflicts,
    stepLog,
    stepIndex,
    stepsCount: steps.length,
    canPrev: mode === "visualize" && steps.length > 0 && stepIndex > -1,
    canNext: mode === "visualize" && steps.length > 0 && stepIndex < steps.length - 1 && !playing,
    solveFull,
    placedFlash,
    backtrackFlash,
  }
}
