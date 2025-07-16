// src/logic/generateSteps.js

export function generateSteps(n) {
  const steps = [];
  const queens = new Array(n).fill(-1);
  let recursiveCalls = 0;
  let backtrackCount = 0;

  const solutions = [];

  function isSafe(row, col) {
    for (let r = 0; r < row; r++) {
      const c = queens[r];
      if (c === col || Math.abs(row - r) === Math.abs(col - c)) return false;
    }
    return true;
  }

  function backtrack(row) {
    recursiveCalls++;
    if (row === n) {
      steps.push({ queens: [...queens], row, col: null, action: "solution" });
      solutions.push([...queens]); // 💾 Save solution
      return;
    }

    for (let col = 0; col < n; col++) {
      steps.push({ queens: [...queens], row, col, action: "try" });

      if (isSafe(row, col)) {
        queens[row] = col;
        steps.push({ queens: [...queens], row, col, action: "place" });

        backtrack(row + 1);

        steps.push({ queens: [...queens], row, col, action: "backtrack" });
        queens[row] = -1;
      }else{
         backtrackCount++;
         steps.push({ queens: [...queens], row, col, action: "reject" });
      }
    }
  }

  backtrack(0);
  return { steps, solutions,backtrackCount,recursiveCalls, };
}
