"use client"

export function Switch({
  id,
  checked,
  onCheckedChange,
  className,
}: {
  id?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
}) {
  return (
    <label className={`relative inline-flex cursor-pointer items-center ${className || ""}`}>
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        checked={!!checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
      />
      <div className="h-5 w-9 rounded-full bg-gray-300 transition-colors peer-checked:bg-blue-600" />
      <div className="pointer-events-none absolute left-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
    </label>
  )
}
