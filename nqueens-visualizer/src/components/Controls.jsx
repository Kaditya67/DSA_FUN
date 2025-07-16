export default function Controls({ n, setN, onStart }) {
  return (
    <div className="flex justify-center items-center gap-4 mb-6">
      <label className="text-lg font-medium">
        Board Size:
        <input
          type="number"
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          min={4}
          max={10}
          className="ml-2 w-16 px-2 py-1 border border-gray-400 rounded"
        />
      </label>
      <button
        onClick={onStart}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
      >
        Start 🔁
      </button>
    </div>
  );
}
