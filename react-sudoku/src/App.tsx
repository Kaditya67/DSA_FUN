import SudokuApp from "./components/sudoku/sudoku-app"

export default function App() {
  return (
    <main className="min-h-screen p-4 md:p-6 bg-white text-gray-900">
      <div className="mx-auto max-w-5xl">
        <SudokuApp />
      </div>
    </main>
  )
}
