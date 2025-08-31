"use client"

import { useSudoku } from "../../hooks/use-sudoku"
import { Board } from "./board"
import { Controls } from "./controls"
import { isBoardValid } from "../../lib/sudoku/validator"
import { StatusBar } from "./status-bar"
import { Button } from "../ui/button"

export default function SudokuApp() {
  const sudoku = useSudoku()

  const selectedEditable =
    sudoku.selected &&
    !sudoku.fixedMask[sudoku.selected.r][sudoku.selected.c] &&
    sudoku.mode === "play" &&
    !sudoku.playing

  const _handleDigit = (n: number) => {
    if (!sudoku.selected || !selectedEditable) return
    sudoku.handleInput(sudoku.selected.r, sudoku.selected.c, n)
  }

  const _handleErase = () => {
    if (!sudoku.selected || !selectedEditable) return
    sudoku.handleInput(sudoku.selected.r, sudoku.selected.c, null)
  }

  const _validateThenSolve = () => {
    sudoku.validateNow()
    if (isBoardValid(sudoku.board)) {
      sudoku.instantSolve()
    }
  }

  return (
    <main className="min-h-dvh bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <div className="mx-auto max-w-6xl p-4 md:p-8 space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b border-gray-200 pb-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-800">
            Sudoku <span className="text-blue-600">Visualizer</span>
          </h1>
          <span className="text-sm text-gray-500">
            Mode: {sudoku.mode === "visualize" ? "Visualizer" : "Play"}
          </span>
        </header>

        {/* Sticky control bar */}
        <div className="sticky top-0 z-10 flex flex-col gap-2 rounded-lg border border-gray-200 bg-white/90 p-3 shadow-sm backdrop-blur-md">

        {/* Controls Row */}
        <div className="flex gap-2 w-full">
            <Button
            size="sm"
            variant="secondary"
            onClick={sudoku.generateSteps}
            disabled={sudoku.mode !== "visualize"}
            className="flex-1"
            >
            Generate
            </Button>

            <Button
            size="sm"
            variant="outline"
            onClick={sudoku.prevStep}
            disabled={!sudoku.canPrev}
            className="flex-1"
            >
            Prev
            </Button>

            <Button
            size="sm"
            variant="outline"
            onClick={sudoku.step}
            disabled={!sudoku.canNext}
            className="flex-1"
            >
            Next
            </Button>

            <Button
            size="sm"
            onClick={sudoku.togglePlay}
            disabled={sudoku.mode !== "visualize" || sudoku.stepsCount === 0}
            className="flex-1"
            >
            {sudoku.playing ? "Pause" : "Play"}
            </Button>

            <Button
            size="sm"
            variant="destructive"
            onClick={sudoku.solveFull}
            disabled={sudoku.mode !== "visualize"}
            className="flex-1"
            >
            Solve Full
            </Button>
        </div>

        {/* Log Message (separate) */}
        <div className="text-right">
            <span className="block truncate text-xs text-gray-500 italic">
            {sudoku.stepLog[0] ?? sudoku.message}
            </span>
        </div>
        </div>



        {/* Main grid layout */}
        <div className="grid gap-6 md:grid-cols-[1fr,340px]">
          {/* Board Section */}
          <section aria-label="Sudoku Board" className="flex justify-center">
            <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-md">
              <Board
                board={sudoku.board}
                fixedMask={sudoku.fixedMask}
                selected={sudoku.selected}
                highlights={sudoku.highlights}
                showCandidates={sudoku.showCandidates}
                onSelect={sudoku.selectCell}
                onInput={sudoku.handleInput}
                conflicts={sudoku.conflicts}
                placedFlash={sudoku.placedFlash}
                backtrackFlash={sudoku.backtrackFlash}
              />
            </div>
          </section>

          {/* Side Controls */}
          <aside aria-label="Controls" className="space-y-4">
            <Controls
              difficulty={sudoku.difficulty}
              onDifficultyChange={sudoku.setDifficulty}
              onGenerate={sudoku.generatePuzzle}
              onClear={sudoku.clearBoard}
              onReset={sudoku.resetToPuzzle}
              onValidate={sudoku.validateNow}
              validState={sudoku.validState}
              mode={sudoku.mode}
              onModeChange={sudoku.setMode}
              showCandidates={sudoku.showCandidates}
              onToggleCandidates={() => sudoku.setShowCandidates((v) => !v)}
            />

            <StatusBar
              attempts={sudoku.stats.attempts}
              placements={sudoku.stats.placements}
              backtracks={sudoku.stats.backtracks}
              message={sudoku.message}
            />

            {/* Step Log */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold text-gray-700">Step Log</h2>
              <div className="max-h-56 overflow-auto rounded-md border border-gray-100 bg-gray-50">
                <ol className="divide-y divide-gray-100 text-xs font-mono text-gray-600">
                  {sudoku.stepLog.map((line, idx) => (
                    <li key={idx} className="px-2 py-1 leading-5 hover:bg-gray-100">
                      {line}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
