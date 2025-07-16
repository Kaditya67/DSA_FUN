import { motion } from "framer-motion";

export default function StepInfo({ step, index, total, prevStep }) {
  const format = (s) => {
    if (!s) return "";
    const pos = s.col !== null ? `[Row: ${s.row}, Col: ${s.col}]` : "";
    switch (s.action) {
        case "try":
            return `... Trying position ${pos}`;
        case "place":
            return `✅ Placed queen at ${pos}`;
        case "backtrack":
            return `❌ Backtracked from ${pos}`;
        case "solution":
            return `🏁 Found valid configuration`;
        case "reject":
            return `🚫 Rejected position ${pos}`; 
        default:
            console.warn("Unknown step action:", s?.action, s);
            return "⚠ Unknown action";
        }
  };

  return (
    <motion.div
      className="text-center mb-4"
      key={index} // ensures animation on every step
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-lg font-semibold text-indigo-700">
        Step {index + 1} of {total}
      </div>

      {prevStep && (
        <div className="text-sm text-gray-500 mt-1 italic">
          Previous: {format(prevStep)}
        </div>
      )}

      <div className="text-md text-gray-800 mt-2 font-medium">
        {format(step)}
      </div>
    </motion.div>
  );
}
