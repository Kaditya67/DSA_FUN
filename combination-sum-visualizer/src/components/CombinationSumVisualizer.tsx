"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { v4 as uuidv4 } from "uuid"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Code, Download, ZoomIn, ZoomOut, RefreshCw } from "lucide-react"

interface TreeNode {
  id: string
  combo: number[]
  sum: number
  children: TreeNode[]
  status: "exploring" | "solution" | "dead-end" | "pruned" | "backtrack"
  parameters: {
    k: number
    n: number
    temp: number[]
    sum: number
    start: number
  }
  depth: number
  isVisible: boolean
}

interface Step {
  type: "enter" | "exit" | "prune" | "solution" | "dead-end"
  description: string
  nodeId: string
  parameters: any
  visibleNodes: Set<string>
  timestamp: number
}

interface VisualizationStats {
  totalNodes: number
  solutionNodes: number
  prunedNodes: number
  deadEndNodes: number
  maxDepth: number
  executionTime: number
}

function generateSteps(
  k: number,
  n: number,
  temp: number[] = [],
  currentSum = 0,
  start = 1,
  depth = 0,
  _parentId?: string,
  visibleNodeIds: Set<string> = new Set(),
  startTime: number = Date.now(),
): { steps: Step[]; tree: TreeNode; visibleNodeIds: Set<string>; stats: VisualizationStats } {
  const nodeId = uuidv4()
  const parameters = { k, n, temp: [...temp], sum: currentSum, start }

  const node: TreeNode = {
    id: nodeId,
    combo: [...temp],
    sum: currentSum,
    children: [],
    status: "exploring",
    parameters,
    depth,
    isVisible: false,
  }

  let steps: Step[] = []
  const stats: VisualizationStats = {
    totalNodes: 1,
    solutionNodes: 0,
    prunedNodes: 0,
    deadEndNodes: 0,
    maxDepth: depth,
    executionTime: 0,
  }

  // Add this node to visible nodes
  const currentVisibleNodes = new Set(visibleNodeIds)
  currentVisibleNodes.add(nodeId)

  // Step for entering this node
  steps.push({
    type: "enter",
    description: `🔍 Exploring [${temp.join(", ") || "∅"}] → sum: ${currentSum}, depth: ${depth}`,
    nodeId,
    parameters,
    visibleNodes: new Set(currentVisibleNodes),
    timestamp: Date.now() - startTime,
  })

  // Base case: we have k numbers
  if (temp.length === k) {
    if (currentSum === n) {
      node.status = "solution"
      stats.solutionNodes = 1
      steps.push({
        type: "solution",
        description: `✓ Solution found! [${temp.join(", ")}] = ${currentSum}`,
        nodeId,
        parameters,
        visibleNodes: new Set(currentVisibleNodes),
        timestamp: Date.now() - startTime,
      })
    } else {
      node.status = "dead-end"
      stats.deadEndNodes = 1
      steps.push({
        type: "dead-end",
        description: `✗ Dead end: [${temp.join(", ")}] = ${currentSum} ≠ ${n}`,
        nodeId,
        parameters,
        visibleNodes: new Set(currentVisibleNodes),
        timestamp: Date.now() - startTime,
      })
    }
    stats.executionTime = Date.now() - startTime
    return { steps, tree: node, visibleNodeIds: currentVisibleNodes, stats }
  }

  // Try adding each number from start to 9
  for (let i = start; i <= 9; i++) {
    const newSum = currentSum + i
    const newTemp = [...temp, i]

    // Pruning: if sum exceeds target, stop exploring further
    if (newSum > n) {
      const prunedNodeId = uuidv4()
      const prunedNode: TreeNode = {
        id: prunedNodeId,
        combo: newTemp,
        sum: newSum,
        children: [],
        status: "pruned",
        parameters: { ...parameters, temp: newTemp, sum: newSum, start: i },
        depth: depth + 1,
        isVisible: false,
      }

      node.children.push(prunedNode)
      currentVisibleNodes.add(prunedNodeId)
      stats.totalNodes++
      stats.prunedNodes++
      stats.maxDepth = Math.max(stats.maxDepth, depth + 1)

      steps.push({
        type: "prune",
        description: `✂ Pruning: [${newTemp.join(", ")}] = ${newSum} > ${n} (optimization)`,
        nodeId: prunedNodeId,
        parameters: prunedNode.parameters,
        visibleNodes: new Set(currentVisibleNodes),
        timestamp: Date.now() - startTime,
      })
      break
    }

    // Recursive call with current visible nodes
    const {
      steps: childSteps,
      tree: childNode,
      visibleNodeIds: updatedVisibleNodes,
      stats: childStats,
    } = generateSteps(k, n, newTemp, newSum, i + 1, depth + 1, nodeId, new Set(currentVisibleNodes), startTime)

    node.children.push(childNode)
    steps = [...steps, ...childSteps]

    // Merge stats
    stats.totalNodes += childStats.totalNodes
    stats.solutionNodes += childStats.solutionNodes
    stats.prunedNodes += childStats.prunedNodes
    stats.deadEndNodes += childStats.deadEndNodes
    stats.maxDepth = Math.max(stats.maxDepth, childStats.maxDepth)

    // Update our visible nodes with what was discovered in the recursive call
    updatedVisibleNodes.forEach((id) => currentVisibleNodes.add(id))
  }

  // Backtrack step
  node.status = "backtrack"
  steps.push({
    type: "exit",
    description: `⬅ Backtracking from [${temp.join(", ") || "root"}] (explored all possibilities)`,
    nodeId,
    parameters,
    visibleNodes: new Set(currentVisibleNodes),
    timestamp: Date.now() - startTime,
  })

  stats.executionTime = Date.now() - startTime
  return { steps, tree: node, visibleNodeIds: currentVisibleNodes, stats }
}

const TreeNodeComponent = ({
  node,
  isActive,
  isOnPath,
  scale = 1,
}: {
  node: TreeNode
  isActive?: boolean
  isOnPath?: boolean
  scale?: number
}) => {
  const [isHovered, setIsHovered] = useState(false)

  if (!node.isVisible) {
    return null
  }

  const getStatusStyles = (status: TreeNode["status"]): string => {
    switch (status) {
      case "solution":
        return "bg-teal-600 border-teal-700 text-white"
      case "dead-end":
        return "bg-gray-600 border-gray-700 text-white"
      case "pruned":
        return "bg-amber-600 border-amber-700 text-white"
      case "backtrack":
        return "bg-gray-600 border-gray-700 text-white"
      default:
        return "bg-blue-600 border-blue-700 text-white"
    }
  }

  const getStatusIcon = (status: TreeNode["status"]): string => {
    switch (status) {
      case "solution":
        return "✓"
      case "dead-end":
        return "✗"
      case "pruned":
        return "✂"
      case "backtrack":
        return "⬅"
      default:
        return "🔍"
    }
  }

  return (
    <div className="flex flex-col items-center relative">
      {/* Connection line to parent */}
      {node.depth > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 40, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={`absolute top-[-40px] w-0.5 h-10 rounded-full ${isOnPath ? "bg-blue-500" : "bg-gray-300"}`}
        />
      )}

      <div className="relative" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
        {/* Active highlight with pulse effect */}
        {isActive && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.3, opacity: 0.4 }}
            className="absolute inset-[-12px] rounded-3xl bg-blue-400"
            transition={{
              duration: 1.2,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        )}

        {/* Path highlight */}
        {isOnPath && <div className="absolute inset-[-6px] rounded-2xl bg-blue-100" />}

        {/* Hover tooltip */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute bottom-full mb-6 z-50 bg-gray-800 text-white p-5 rounded-lg shadow-lg min-w-[280px] border border-gray-700"
            >
              <div className="text-sm font-semibold mb-4 text-blue-300 flex items-center gap-2">
                <Code size={16} />
                Function Call Parameters
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="text-gray-300">k (target size):</div>
                <div className="text-white font-bold">{node.parameters.k}</div>
                <div className="text-gray-300">n (target sum):</div>
                <div className="text-white font-bold">{node.parameters.n}</div>
                <div className="text-gray-300">current combo:</div>
                <div className="text-white font-bold">[{node.parameters.temp.join(", ") || "empty"}]</div>
                <div className="text-gray-300">current sum:</div>
                <div className="text-white font-bold">{node.parameters.sum}</div>
                <div className="text-gray-300">start index:</div>
                <div className="text-white font-bold">{node.parameters.start}</div>
                <div className="text-gray-300">depth level:</div>
                <div className="text-white font-bold">{node.depth}</div>
              </div>
              {/* Arrow pointing to node */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-800"></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main node */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: isActive ? 1.15 * scale : 1 * scale,
            opacity: 1,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
            opacity: { duration: 0.3 },
          }}
          className={`
            relative px-6 py-4 rounded-xl border-2 cursor-pointer
            transition-all duration-300 hover:shadow-lg
            ${getStatusStyles(node.status)}
            ${isActive ? "shadow-lg ring-2 ring-blue-400" : ""}
          `}
          style={{
            minWidth: "120px",
            minHeight: "80px",
          }}
        >
          {/* Status icon */}
          <div className="absolute -top-3 -right-3 text-lg bg-white rounded-full p-1 shadow-md">
            {getStatusIcon(node.status)}
          </div>

          {/* Depth indicator */}
          <div className="absolute -top-4 -left-4 bg-gray-700 text-white text-sm rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-md border-2 border-white">
            {node.depth}
          </div>

          {/* Node content */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="text-lg font-bold tracking-wide">[{node.combo.join(", ") || "∅"}]</div>
            <div className="text-sm opacity-90 font-medium">sum = {node.sum}</div>
            <div className="text-xs px-3 py-1 bg-black/30 rounded-full font-medium tracking-wide">
              {node.status.replace("-", " ")}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Children */}
      {node.children.length > 0 && (
        <div className="relative mt-12">
          {/* Horizontal connector line */}
          {node.children.filter((child) => child.isVisible).length > 1 && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="absolute top-[-24px] left-0 right-0 h-0.5 bg-gray-300 rounded-full"
            />
          )}

          <div className="flex gap-16 justify-center">
            {node.children.map((child, index) => (
              <motion.div
                key={child.id}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                {/* Vertical connector to child */}
                {child.isVisible && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 24, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="absolute top-[-24px] left-1/2 transform -translate-x-1/2 w-0.5 h-6 bg-gray-300 rounded-full"
                  />
                )}
                <TreeNodeComponent
                  node={child}
                  isActive={child.id === child.id && isActive}
                  isOnPath={isOnPath}
                  scale={Math.max(0.75, 1 - child.depth * 0.04)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const StatsPanel = ({ stats, solutions: _solutions }: { stats: VisualizationStats; solutions: number[] }) => (
  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
    <h3 className="font-bold text-gray-800 mb-3 text-sm">Statistics</h3>
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="bg-white p-2 rounded-md">
        <div className="text-gray-600">Total Nodes</div>
        <div className="text-xl font-bold text-gray-800">{stats.totalNodes}</div>
      </div>
      <div className="bg-white p-2 rounded-md">
        <div className="text-gray-600">Solutions</div>
        <div className="text-xl font-bold text-teal-600">{stats.solutionNodes}</div>
      </div>
      <div className="bg-white p-2 rounded-md">
        <div className="text-gray-600">Pruned</div>
        <div className="text-xl font-bold text-amber-600">{stats.prunedNodes}</div>
      </div>
      <div className="bg-white p-2 rounded-md">
        <div className="text-gray-600">Max Depth</div>
        <div className="text-xl font-bold text-gray-800">{stats.maxDepth}</div>
      </div>
    </div>
  </div>
)

const AlgorithmCode = ({ isVisible }: { isVisible: boolean }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="bg-gray-900 text-green-400 p-6 rounded-lg font-mono text-sm overflow-hidden mb-6"
      >
        <div className="flex items-center gap-2 mb-4 text-green-300">
          <Code size={16} />
          <span className="font-bold">Backtracking Algorithm Implementation</span>
        </div>
        <pre className="text-xs leading-relaxed">
          {`function combinationSum3(k, n) {
    const result = [];
    
    function backtrack(temp, sum, start) {
        // Base case: found k numbers
        if (temp.length === k) {
            if (sum === n) {
                result.push([...temp]); // Solution found!
            }
            return; // Dead end or solution
        }
        
        // Try numbers from start to 9
        for (let i = start; i <= 9; i++) {
            const newSum = sum + i;
            
            // Pruning: skip if sum exceeds target
            if (newSum > n) break;
            
            temp.push(i);           // Choose
            backtrack(temp, newSum, i + 1); // Explore
            temp.pop();             // Backtrack
        }
    }
    
    backtrack([], 0, 1);
    return result;
}`}
        </pre>
      </motion.div>
    )}
  </AnimatePresence>
)

const updateTreeVisibility = (tree: TreeNode, visibleNodes: Set<string>): TreeNode => {
  return {
    ...tree,
    isVisible: visibleNodes.has(tree.id),
    children: tree.children.map((child) => updateTreeVisibility(child, visibleNodes)),
  }
}

export default function CombinationSumVisualizer() {
  const [k, setK] = useState(3)
  const [n, setN] = useState(7)
  const [tree, setTree] = useState<TreeNode | null>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(800)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const [stats, setStats] = useState<VisualizationStats>({
    totalNodes: 0,
    solutionNodes: 0,
    prunedNodes: 0,
    deadEndNodes: 0,
    maxDepth: 0,
    executionTime: 0,
  })
  const [showCode, setShowCode] = useState(false)
  const [solutions, setSolutions] = useState<number>(0)
  const [zoomLevel, setZoomLevel] = useState(1)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const treeContainerRef = useRef<HTMLDivElement>(null)

  const generateVisualization = useCallback(async () => {
    if (k < 1 || k > 9 || n < 1 || n > 45) {
      alert("Please enter valid values: k (1-9), n (1-45)")
      return
    }

    setIsGenerating(true)
    setIsPlaying(false)
    setCurrentStep(0)
    setSolutions(0)

    await new Promise((resolve) => setTimeout(resolve, 300))

    const { steps: newSteps, tree: newTree, stats: newStats } = generateSteps(k, n)

    if (newSteps.length > 0) {
      const initialVisibleTree = updateTreeVisibility(newTree, newSteps[0].visibleNodes)
      setTree(initialVisibleTree)
      setActiveNodeId(newSteps[0].nodeId || null)
    } else {
      setTree(newTree)
    }

    setSteps(newSteps)
    setStats(newStats)
    setIsGenerating(false)

    // Reset zoom to 1 when generating new tree
    setZoomLevel(1)
  }, [k, n])

  // Zoom controls
  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 3))
  }

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.3))
  }

  const resetZoom = () => {
    setZoomLevel(1)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key) {
        case " ":
          e.preventDefault()
          togglePlayback()
          break
        case "ArrowRight":
          e.preventDefault()
          nextStep()
          break
        case "ArrowLeft":
          e.preventDefault()
          prevStep()
          break
        case "r":
          e.preventDefault()
          resetVisualization()
          break
        case "c":
          e.preventDefault()
          setShowCode(!showCode)
          break
        case "+":
        case "=":
          e.preventDefault()
          zoomIn()
          break
        case "-":
        case "_":
          e.preventDefault()
          zoomOut()
          break
        case "0":
          e.preventDefault()
          resetZoom()
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [isPlaying, currentStep, steps.length, showCode])

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && steps.length > 0 && !isGenerating) {
      if (timerRef.current) clearTimeout(timerRef.current)

      timerRef.current = setTimeout(() => {
        if (currentStep < steps.length - 1) {
          const nextStep = currentStep + 1
          setCurrentStep(nextStep)
          setActiveNodeId(steps[nextStep].nodeId)

          // Count solutions as we encounter them
          if (steps[nextStep].type === "solution") {
            setSolutions((prev) => prev + 1)
          }
        } else {
          setIsPlaying(false)
        }
      }, speed)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isPlaying, currentStep, steps, speed, isGenerating])

  // Update tree visibility when step changes
  useEffect(() => {
    if (tree && steps.length > 0 && currentStep >= 0 && currentStep < steps.length) {
      const updatedTree = updateTreeVisibility(tree, steps[currentStep].visibleNodes)
      setTree(updatedTree)
      setActiveNodeId(steps[currentStep].nodeId)

      // Update solution count based on current step
      const solutionSteps = steps.slice(0, currentStep + 1).filter((step) => step.type === "solution")
      setSolutions(solutionSteps.length)
    }
  }, [currentStep, steps])

  // Initialize on mount
  useEffect(() => {
    generateVisualization()
  }, [generateVisualization])

  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false)
    } else {
      if (currentStep >= steps.length - 1) {
        setCurrentStep(0)
      }
      setIsPlaying(true)
    }
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const resetVisualization = () => {
    setCurrentStep(0)
    setIsPlaying(false)
    setSolutions(0)
    if (steps.length > 0) {
      setActiveNodeId(steps[0].nodeId)
    }
  }

  const exportData = () => {
    const data = {
      parameters: { k, n },
      stats,
      steps: steps.length,
      solutions,
      timestamp: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `combination-sum-k${k}-n${n}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const currentStepData = steps[currentStep]
  const progress = steps.length > 0 ? (currentStep / (steps.length - 1)) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Combination Sum III Visualizer</h1>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Step-by-step visualization of the backtracking algorithm finding all combinations of k unique digits (1-9)
            that sum to n
          </p>
          <div className="mt-2 text-xs text-gray-500">
            Keyboard shortcuts: Space (play/pause), ← → (navigate), R (reset), +/- (zoom), 0 (reset zoom)
          </div>
        </div>

        {/* Configuration and Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Configuration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-bold text-gray-800 mb-4 text-sm">Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">k = {k} (combination size)</label>
                <input
                  type="range"
                  min="1"
                  max="9"
                  value={k}
                  onChange={(e) => setK(Number(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">n = {n} (target sum)</label>
                <input
                  type="range"
                  min="1"
                  max="45"
                  value={n}
                  onChange={(e) => setN(Number(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <button
                onClick={generateVisualization}
                disabled={isGenerating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Generating...
                  </span>
                ) : (
                  "Generate New Tree"
                )}
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div>
            <StatsPanel stats={stats} solutions={solutions} />
          </div>

          {/* Additional Controls */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-bold text-gray-800 mb-4 text-sm">Additional Controls</h3>
            <div className="space-y-4">
              <button
                onClick={() => setShowCode(!showCode)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Code size={16} />
                {showCode ? "Hide" : "Show"} Algorithm Code
              </button>
              <button
                onClick={exportData}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Export Data
              </button>
            </div>
          </div>
        </div>

        {/* Algorithm Code */}
        <AlgorithmCode isVisible={showCode} />

        {/* Tree Visualization with Integrated Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 md:mb-0">Recursion Tree Visualization</h2>

            <div className="flex items-center gap-3">
              {/* Playback Controls */}
              <div className="flex items-center gap-2 mr-4">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md disabled:opacity-50"
                  title="Previous Step"
                >
                  <SkipBack size={18} />
                </button>

                <button
                  onClick={togglePlayback}
                  className={`p-2 rounded-md ${
                    isPlaying ? "bg-amber-600 hover:bg-amber-700" : "bg-teal-600 hover:bg-teal-700"
                  } text-white`}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </button>

                <button
                  onClick={nextStep}
                  disabled={currentStep >= steps.length - 1}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md disabled:opacity-50"
                  title="Next Step"
                >
                  <SkipForward size={18} />
                </button>

                <button
                  onClick={resetVisualization}
                  className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-md"
                  title="Reset"
                >
                  <RotateCcw size={18} />
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
                <button
                  onClick={zoomOut}
                  className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-md"
                  title="Zoom Out"
                >
                  <ZoomOut size={18} />
                </button>
                <div className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </div>
                <button
                  onClick={zoomIn}
                  className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-md"
                  title="Zoom In"
                >
                  <ZoomIn size={18} />
                </button>
                <button
                  onClick={resetZoom}
                  className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-md"
                  title="Reset Zoom"
                >
                  <RefreshCw size={18} />
                </button>
              </div>

              {/* Speed Control */}
              <div className="flex items-center gap-2 ml-4 border-l border-gray-300 pl-4">
                <span className="text-sm text-gray-600">Speed:</span>
                <input
                  type="range"
                  min="200"
                  max="2000"
                  step="100"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mb-6 text-sm">
            {[
              { color: "bg-blue-600", label: "Exploring" },
              { color: "bg-teal-600", label: "Solution" },
              { color: "bg-gray-600", label: "Dead End" },
              { color: "bg-amber-600", label: "Pruned" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-4 h-4 ${item.color} rounded-full`}></div>
                <span className="text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>
                Step {currentStep + 1} of {steps.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
            </div>
            {currentStepData && (
              <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200">
                {currentStepData.description}
              </div>
            )}
          </div>

          {/* Tree Container with Zoom Transform */}
          <div
            ref={treeContainerRef}
            className="overflow-auto bg-gray-50 rounded-md p-8 min-h-[600px] flex justify-center items-start border border-gray-200"
          >
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Building recursion tree...</p>
                  </div>
                </div>
              ) : tree ? (
                <div
                  className="w-full flex justify-center transition-transform duration-300 ease-out"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: "center top",
                  }}
                >
                  <TreeNodeComponent node={tree} isActive={tree.id === activeNodeId} isOnPath={true} />
                </div>
              ) : (
                <div className="text-gray-500 text-center py-20">
                  <p>Configure parameters and click "Generate New Tree"</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Problem Description */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="font-bold text-gray-800 mb-3">Problem: Combination Sum III</h3>
          <p className="text-gray-700 mb-3">
            Find all valid combinations of exactly <strong>k</strong> numbers that sum up to <strong>n</strong>, where:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Only numbers 1 through 9 are used</li>
            <li>Each number is used at most once</li>
            <li>The combination must be in ascending order</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
