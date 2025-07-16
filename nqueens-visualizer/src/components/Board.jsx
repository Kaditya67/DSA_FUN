import { motion, AnimatePresence } from "framer-motion";

export default function Board({ n, queens, highlight }) {
  const { row: tryRow, col: tryCol, action } = highlight || {};

  return (
    <div
      className="grid w-fit mx-auto mb-6"
      style={{ gridTemplateColumns: `repeat(${n}, 4rem)` }}
    >
      {Array.from({ length: n * n }).map((_, i) => {
        const row = Math.floor(i / n);
        const col = i % n;
        const isQueen = queens[row] === col;

        const isTrying = action === "try" && tryRow === row && tryCol === col;
        const isBacktrack = action === "backtrack" && tryRow === row && tryCol === col;

        return (
          <div
            key={i}
            className={`relative w-16 h-16 border border-gray-400 flex items-center justify-center
              ${(row + col) % 2 === 0 ? "bg-white" : "bg-gray-200"}
              ${isBacktrack ? "bg-red-300" : ""}
              ${isTrying ? "bg-green-300" : ""}
            `}
          >
            {/* Permanent Queen */}
            <AnimatePresence>
              {isQueen && !isTrying && (
                <motion.div
                  key={`queen-${row}-${col}`}
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{ duration: 0.3 }}
                  className="absolute text-3xl"
                >
                  ♛
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ghost Queen for "try" */}
            {isTrying && (
              <motion.div
                key={`ghost-${row}-${col}`}
                initial={{ scale: 0, opacity: 0.2 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute text-3xl text-green-800"
              >
                ♛
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}
