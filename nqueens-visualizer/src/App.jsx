import { useState, useEffect, useRef } from "react";
import { generateSteps } from "./logic/generateSteps";
import Board from "./components/Board";
import Controls from "./components/Controls";
import StepInfo from "./components/StepInfo";
import Navigation from "./components/Navigation"; 

export default function App() {
  const [n, setN] = useState(4);
  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [solutions, setSolutions] = useState([]);
  const [totalSolutions, setTotalSolutions] = useState(0);
  const [backtrackCount, setBacktrackCount] = useState(0);
  const [recursiveCalls, setRecursiveCalls] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [intervalId, setIntervalId] = useState(null);

  const currentStep = steps[stepIndex] || null;
  const stepIndexRef = useRef(stepIndex);
  useEffect(() => {
    return () => clearInterval(intervalId);
  }, [intervalId]);

  useEffect(() => {
  stepIndexRef.current = stepIndex;
}, [stepIndex]);


  function handleStart() {
    const {
      steps: newSteps,
      solutions: foundSolutions,
      backtrackCount,
      recursiveCalls,
    } = generateSteps(n);

    setSteps(newSteps);
    setSolutions([]);
    setTotalSolutions(foundSolutions.length);
    setBacktrackCount(backtrackCount);
    setRecursiveCalls(recursiveCalls);
    setStepIndex(0);
  }

  function handleNext() {
    if (stepIndex < steps.length - 1) {
      const nextIndex = stepIndex + 1;
      setStepIndex(nextIndex);

      const current = steps[nextIndex];
      if (current.action === "solution") {
        setSolutions((prev) => [...prev, current.queens]);
      }
      return true;
    }
    return false; // No more steps
  }

  function handlePlay() {
  if (isPlaying || stepIndexRef.current >= steps.length - 1) return;

  setIsPlaying(true);

  const id = setInterval(() => {
    const nextIndex = stepIndexRef.current + 1;

    if (nextIndex < steps.length) {
      stepIndexRef.current = nextIndex;
      setStepIndex(nextIndex);

      const current = steps[nextIndex];
      if (current.action === "solution") {
        setSolutions((prev) => [...prev, current.queens]);
      }
    } else {
      clearInterval(id);
      setIsPlaying(false);
    }
  }, 600);

  setIntervalId(id);
}


  function handlePause() {
    clearInterval(intervalId);
    setIsPlaying(false);
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <h1 className="text-4xl font-extrabold text-center mb-6 text-indigo-700">
        ♛ N-Queens Visualizer
      </h1>

      <Controls n={n} setN={setN} onStart={handleStart} />

      {steps.length > 0 && (
        <div className="flex flex-col items-center gap-4">
          <Board n={n} queens={currentStep.queens} highlight={currentStep} />

          <StepInfo
            step={currentStep}
            prevStep={steps[stepIndex - 1] || null}
            index={stepIndex}
            total={steps.length}
          />

          <Navigation
            onNext={handleNext}
            onPlay={handlePlay}
            onPause={handlePause}
            isPlaying={isPlaying}
          />
          <div className="text-sm text-center text-gray-700 mt-2 bg-white px-4 py-2 rounded shadow-sm">
            🧩 Recursive Calls: <b>{recursiveCalls}</b> | 🔁 Backtracks:{" "}
            <b>{backtrackCount}</b> | ✅ Steps Tried: <b>{steps.length}</b> | 🟢 Valid Placements:{" "}
            <b>{solutions.length}</b>
          </div>
        </div>
      )}

      {totalSolutions > 0 && (
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-center text-green-700 mb-1">
          🟢 Solutions Found: {solutions.length} / {totalSolutions}
        </h2>

        {solutions.length === totalSolutions && (
          <p className="text-center text-sm text-green-600 mb-3">
            🎉 All {totalSolutions} solutions explored!
          </p>
        )}
        <div className="flex justify-center px-4">
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 px-4">
            {solutions.map((sol, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow-md p-3 border border-gray-300"
              >
                <div className="text-center text-lg font-medium text-gray-700 mb-2">
                  Solution #{idx + 1}
                </div>

                <div
                  className="grid gap-px"
                  style={{
                    gridTemplateColumns: `repeat(${n}, 1.5rem)`,
                    gridTemplateRows: `repeat(${n}, 1.5rem)`
                  }}
                >
                  {Array.from({ length: n * n }).map((_, i) => {
                    const row = Math.floor(i / n);
                    const col = i % n;
                    const isQueen = sol[row] === col;

                    return (
                      <div
                        key={i}
                        className={`w-6 h-6 border border-gray-400 text-xs flex items-center justify-center
                          ${isQueen ? "bg-yellow-300 font-bold" : ""}
                          ${(row + col) % 2 === 0 ? "bg-white" : "bg-gray-200"}
                        `}
                      >
                        {isQueen ? "♛" : ""}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
