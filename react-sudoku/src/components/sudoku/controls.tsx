"use client"

import { Button } from "../ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Switch } from "../ui/switch"
import { Label } from "../ui/label"

type Difficulty = "easy" | "medium" | "hard" | "random"
type Mode = "play" | "visualize"

export function Controls({
  difficulty,
  onDifficultyChange,
  onGenerate,
  onClear,
  onReset,
  onValidate,
  validState,
  mode,
  onModeChange,
  showCandidates,
  onToggleCandidates,
}: {
  difficulty: Difficulty
  onDifficultyChange: (d: Difficulty) => void
  onGenerate: () => void
  onClear: () => void
  onReset: () => void
  onValidate: () => void
  validState: "unknown" | "valid" | "invalid" | "solved"
  mode: Mode
  onModeChange: (m: Mode) => void
  showCandidates: boolean
  onToggleCandidates: () => void
}) {
  return (
    <div className="space-y-4">
      {/* Mode + Options */}
      <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <Label htmlFor="mode" className="text-sm font-medium">
            Visualizer Mode
          </Label>
          <Switch
            id="mode"
            checked={mode === "visualize"}
            onCheckedChange={(v) => onModeChange(v ? "visualize" : "play")}
            aria-label="Toggle visualizer mode"
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="candidates" className="text-sm font-medium">
            Show candidates
          </Label>
          <Switch
            id="candidates"
            checked={showCandidates}
            onCheckedChange={onToggleCandidates}
            aria-label="Toggle candidate hints"
          />
        </div>
      </section>
        
      {/* Puzzle Controls */}
      <section className="rounded-xl border border-border bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <Label htmlFor="difficulty" className="text-sm font-medium pr-5">
            Difficulty
            </Label>
          <Select value={difficulty} onValueChange={(v) => onDifficultyChange(v as Difficulty)}>
            <SelectTrigger id="difficulty" className="w-[160px]">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
              <SelectItem value="random">Random</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={onGenerate} className="w-full">
            Generate New
          </Button>
          <Button variant="secondary" onClick={onReset} className="w-full">
            Reset Puzzle
          </Button>
          <Button variant="outline" onClick={onClear} className="w-full">
            Clear
          </Button>
          <Button variant="outline" onClick={onValidate} className="w-full">
            Validate
          </Button>
        </div>

        <div className="mt-3">
          <ValidityBadge state={validState} />
        </div>
      </section>

      {/* Legend */}
      {/* <section className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-soft">
        <Label className="text-sm font-medium">Legend</Label>
        <ul className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <LegendItem color="ring-2 ring-blue-500/60" label="Selected" />
          <LegendItem color="bg-gray-100" label="Same row/col/box" />
          <LegendItem color="bg-blue-100" label="Try" />
          <LegendItem color="bg-green-100" label="Place" />
          <LegendItem color="bg-rose-100 ring-2 ring-rose-400" label="Backtrack/Conflict" />
          <LegendItem color="bg-blue-50" label="Same number" />
        </ul>
      </section> */}
    </div>
  )
}

/* ========== Helpers ========== */

function ValidityBadge({ state }: { state: "unknown" | "valid" | "invalid" | "solved" }) {
  const base = "inline-block rounded-md px-2 py-1 text-xs font-medium"
  if (state === "unknown")
    return <span className={`${base} text-gray-500 bg-gray-100`}>Status: Unknown</span>
  if (state === "valid")
    return <span className={`${base} text-green-700 bg-green-100`}>Status: Valid</span>
  if (state === "invalid")
    return <span className={`${base} text-rose-700 bg-rose-100`}>Status: Invalid</span>
  return <span className={`${base} text-blue-700 bg-blue-100`}>Status: Solved</span>
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={`h-4 w-4 rounded ${color}`} aria-hidden />
      <span>{label}</span>
    </li>
  )
}
