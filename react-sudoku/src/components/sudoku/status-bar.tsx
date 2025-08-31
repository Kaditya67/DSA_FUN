"use client"

export function StatusBar({
  attempts,
  placements,
  backtracks,
  message,
}: {
  attempts: number
  placements: number
  backtracks: number
  message: string
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{message}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-md bg-blue-50 p-2">
          <div className="font-semibold text-blue-700">{attempts}</div>
          <div className="text-xs text-blue-800/80">Attempts</div>
        </div>
        <div className="rounded-md bg-green-50 p-2">
          <div className="font-semibold text-green-700">{placements}</div>
          <div className="text-xs text-green-800/80">Placements</div>
        </div>
        <div className="rounded-md bg-rose-50 p-2">
          <div className="font-semibold text-rose-700">{backtracks}</div>
          <div className="text-xs text-rose-800/80">Backtracks</div>
        </div>
      </div>
    </div>
  )
}
