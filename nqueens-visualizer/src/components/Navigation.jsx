export default function Navigation({ onNext, onPlay, onPause, isPlaying }) {
  return (
    <div className="flex gap-4 justify-center mt-4">
      <button
        onClick={onNext}
        disabled={isPlaying}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        Next Step
      </button>

      {!isPlaying ? (
        <button
          onClick={onPlay}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          ▶ Play
        </button>
      ) : (
        <button
          onClick={onPause}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
        >
          ⏸ Pause
        </button>
      )}
    </div>
  );
}
