import { Tool } from "./InfiniteCanvas";
import "./Toolbar.css";
import "./ToolbarButton.css";
import { FaPen, FaEraser, FaRegCircle, FaUndo, FaRedo } from "react-icons/fa";

interface ToolbarProps {
  activeTool: Tool;
  setTool: (tool: Tool) => void;
}

const Toolbar = ({ activeTool, setTool }: ToolbarProps) => {
  return (
    <nav className="toolbar" aria-label="Canvas tools">
      <button
        className={`toolbar-btn${activeTool === "pen" ? " selected" : ""}`}
        aria-label="Pen tool"
        onClick={() => setTool("pen")}
      >
        {FaPen({size: 18})}
      </button>
      <button
        className={`toolbar-btn${activeTool === "eraser" ? " selected" : ""}`}
        aria-label="Eraser tool"
        onClick={() => setTool("eraser")}
      >
        {FaEraser({size: 18})}
      </button>
      <button
        className={`toolbar-btn${activeTool === "shape" ? " selected" : ""}`}
        aria-label="Draw shape"
        onClick={() => setTool("shape")}
      >
        {FaRegCircle({size: 18})}
      </button>
      <button
        className="toolbar-btn"
        aria-label="Undo"
        onClick={() => setTool("undo")}
      >
        {FaUndo({size: 18})}
      </button>
      <button
        className="toolbar-btn"
        aria-label="Redo"
        onClick={() => setTool("redo")}
      >
        {FaRedo({size: 18})}
      </button>
    </nav>
  );
}

export default Toolbar;