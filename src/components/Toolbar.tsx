import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { Tool } from "./InfiniteCanvas";
import "./Toolbar.css";
import "./ToolbarButton.css";
import { FaPen, FaEraser, FaRegCircle, FaUndo, FaRedo } from "react-icons/fa";

const COLORS = ["#222", "#4f8cff", "#e74c3c", "#2ecc40", "#f1c40f"];
const THICKNESSES = [2, 4, 6, 8, 12];

interface ToolbarProps {
  activeTool: Tool;
  setTool: (tool: Tool) => void;
  penColor: string;
  setPenColor: (color: string) => void;
  penThickness: number;
  setPenThickness: (thickness: number) => void;
  undo: () => void;
  redo: () => void;
}

const Toolbar = ({ activeTool, setTool, penColor, setPenColor, penThickness, setPenThickness, undo, redo }: ToolbarProps) => {
  const [showPenOptions, setShowPenOptions] = useState(false);
  const [subToolbarPos, setSubToolbarPos] = useState<{top: number, left: number}>({top: 0, left: 0});
  const penButtonRef = useRef<HTMLButtonElement>(null);
  const subToolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPenOptions) return;

    function handleClickOutside(event: PointerEvent) {
      if (
        penButtonRef.current &&
        !penButtonRef.current.contains(event.target as Node) &&
        subToolbarRef.current &&
        !subToolbarRef.current.contains(event.target as Node)
      ) {
        setShowPenOptions(false);
      }
    }

    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [showPenOptions]);

  const handlePenClick = () => {
    setTool("pen");
    setShowPenOptions((open) => !open);
  };

  const handleToolClick = (tool: Tool) => {
    setTool(tool);
    setShowPenOptions(false);
  }

  useLayoutEffect(() => {
  if (showPenOptions && penButtonRef.current) {
    const rect = penButtonRef.current.getBoundingClientRect();
    setSubToolbarPos({
      top: rect.bottom + 12,
      left: rect.left + rect.width / 2
    });
  }
}, [showPenOptions]);

  return (
    <>
      <nav className="toolbar" aria-label="Canvas tools">
          <button
            ref={penButtonRef}
            className={`toolbar-btn${activeTool === "pen" ? " selected" : ""}`}
            aria-label="Pen tool"
            onClick={handlePenClick}
          >
            {FaPen({size: 18})}
          </button>
        <button
          className={`toolbar-btn${activeTool === "eraser" ? " selected" : ""}`}
          aria-label="Eraser tool"
          onClick={() => handleToolClick("eraser")}
        >
          {FaEraser({size: 18})}
        </button>
        <div></div>
        {/* <button
          className={`toolbar-btn${activeTool === "shape" ? " selected" : ""}`}
          aria-label="Draw shape"
          onClick={() => handleToolClick("shape")}
        >
          {FaRegCircle({size: 18})}
        </button> */}
        <button
          className="toolbar-btn"
          aria-label="Undo"
          onClick={() => undo()}
        >
          {FaUndo({size: 18})}
        </button>
        <button
          className="toolbar-btn"
          aria-label="Redo"
          onClick={() => redo()}
        >
          {FaRedo({size: 18})}
        </button>
      </nav>
      {activeTool === "pen" && showPenOptions && (
        <nav
          className="pen-subtoolbar"
          ref={subToolbarRef}
          style={{
            position: "fixed",
            top: `${subToolbarPos.top}px`,
            left: `${subToolbarPos.left}px`,
            transform: "translateX(-50%)"
          }}
        >
          <div className="pen-colors">
            {COLORS.map((color) => (
              <button
                key={color}
                className="color-btn"
                style={{
                  background: color,
                  border: color === penColor ? "2px solid #333" : "2px solid #fff",
                }}
                onClick={() => setPenColor(color)}
              />
            ))}
          </div>
          <div className="pen-thicknesses">
            {THICKNESSES.map((thick) => (
              <button
                key={thick}
                className="thickness-btn"
                style={{
                  border: thick === penThickness ? "2px solid #333" : "2px solid #ffffff00",
                }}
                onClick={() => setPenThickness(thick)}
              >
                <div
                  style={{
                    width: thick,
                    height: thick,
                    borderRadius: "50%",
                    background: penColor,
                    margin: "auto",
                  }}
                />
              </button>
            ))}
          </div>
        </nav>
      )}
    </>
  );
}

export default Toolbar;