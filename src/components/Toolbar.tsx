import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { Tool } from "./InfiniteCanvas";
import "./Toolbar.css";
import "./ToolbarButton.css";
import { FaPen, FaEraser, FaRegCircle, FaUndo, FaRedo, FaRegSquare } from "react-icons/fa";
import { FaMinus, FaArrowRight } from "react-icons/fa6";

const COLORS = ["#222", "#4f8cff", "#e74c3c", "#2ecc40", "#f1c40f"];
const THICKNESSES = [2, 4, 6, 8, 12];

const shapeOptions = [
  { key: "line", icon: FaMinus, label: "Line" },
  { key: "arrow", icon: FaArrowRight, label: "Arrow" },
  { key: "circle", icon: FaRegCircle, label: "Circle" },
  { key: "rectangle", icon: FaRegSquare, label: "Rectangle" }
];

interface ToolbarProps {
  activeTool: Tool;
  setTool: (tool: Tool) => void;
  penColor: string;
  setPenColor: (color: string) => void;
  penThickness: number;
  setPenThickness: (thickness: number) => void;
  selectedShape: string;
  setSelectedShape: (shape: string) => void;
  undo: () => void;
  redo: () => void;
}

const Toolbar = ({ activeTool, setTool, penColor, setPenColor, penThickness, setPenThickness, selectedShape, setSelectedShape, undo, redo }: ToolbarProps) => {
  const [showPenOptions, setShowPenOptions] = useState(false);
  const [subToolbarPos, setSubToolbarPos] = useState<{top: number, left: number}>({top: 0, left: 0});
  const penButtonRef = useRef<HTMLButtonElement>(null);
  const subToolbarRef = useRef<HTMLDivElement>(null);
 
  const [showShapeOptions, setShowShapeOptions] = useState(false);
  const shapeButtonRef = useRef<HTMLButtonElement>(null);
  const shapeSubToolbarRef = useRef<HTMLDivElement>(null);
  const [shapeSubToolbarPos, setShapeSubToolbarPos] = useState<{top: number, left: number}>({top: 0, left: 0});

  useEffect(() => {
    function handleClickOutside(event: PointerEvent) {
      if (
        showPenOptions &&
        penButtonRef.current &&
        !penButtonRef.current.contains(event.target as Node) &&
        subToolbarRef.current &&
        !subToolbarRef.current.contains(event.target as Node)
      ) {
        setShowPenOptions(false);
      }
      if (
        showShapeOptions &&
        shapeButtonRef.current &&
        !shapeButtonRef.current.contains(event.target as Node) &&
        shapeSubToolbarRef.current &&
        !shapeSubToolbarRef.current.contains(event.target as Node)
      ) {
        setShowShapeOptions(false);
      }
    }
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [showPenOptions, showShapeOptions]);

  const handlePenClick = () => {
    setTool("pen");
    setShowPenOptions((open) => !open);
  };

  const handleShapeClick = () => {
    setTool("shape");
    setShowShapeOptions((open) => !open);
  }

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

  useLayoutEffect(() => {
    if (showShapeOptions && shapeButtonRef.current) {
      const rect = shapeButtonRef.current.getBoundingClientRect();
      setShapeSubToolbarPos({
        top: rect.bottom + 12,
        left: rect.left + rect.width / 2
      });
    }
  }, [showShapeOptions]);

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
        <button
          ref={shapeButtonRef}
          className={`toolbar-btn${activeTool === "shape" ? " selected" : ""}`}
          aria-label="Draw shape"
          onClick={() => handleShapeClick()}
        >
          {FaRegCircle({size: 18})}
        </button>
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
      {activeTool === "shape" && showShapeOptions && (
        <nav
          className="shape-subtoolbar"
          ref={shapeSubToolbarRef}
          style={{
            position: "fixed",
            top: `${shapeSubToolbarPos.top}px`,
            left: `${shapeSubToolbarPos.left}px`,
            transform: "translateX(-50%)"
          }}
        >
          <div className="shapes">
            {shapeOptions.map((shape) => (
              <button
                key={shape.key}
                className={`shape-btn${selectedShape === shape.key ? " selected" : ""}`}
                aria-label={shape.label}
                onClick={() => setSelectedShape(shape.key)}
              >
              {shape.icon({ size:18 })}
              </button>
            ))}
          </div>
          <div className="shape-colors">
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
        </nav>
      )}
    </>
  );
}

export default Toolbar;