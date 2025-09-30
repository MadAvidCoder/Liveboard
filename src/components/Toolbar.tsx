import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { Tool, ShapeType } from "./InfiniteCanvas";
import "./Toolbar.css";
import "./ToolbarButton.css";
import { FaPen, FaEraser, FaRegCircle, FaUndo, FaRedo, FaRegSquare, FaFont } from "react-icons/fa";
import { FaMinus, FaArrowRight, FaNoteSticky } from "react-icons/fa6";

const COLORS = ["#222", "#4f8cff", "#e74c3c", "#2ecc40", "#f1c40f"];
const THICKNESSES = [2, 4, 6, 8, 12];

const STICKY_COLORS = [
  "#ffe066",
  "#ffd6e0",
  "#b7e4c7",
  "#cce3fa",
  "#f6d6ae",
  "#cccccc",
];

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
  selectedShape: ShapeType;
  setSelectedShape: (shape: ShapeType) => void;
  textFontSize: number;
  setTextFontSize: (size: number) => void;
  eraserRadius: number;
  setEraserRadius: (radius: number) => void;
  clearCanvas: () => void;
  undo: () => void;
  redo: () => void;
  theme: "light" | "dark";
  getCanvasColor: (color: string, theme: "light" | "dark") => string;
  stickyColor: string;
  setStickyColor: (color: string) => void;
}

function getBorderColor(color: string, theme: "light" | "dark") {
  const isBlack = color === "#333" || color === "#000" || color.toLowerCase() === "black";
  const isWhite = color === "#fff" || color.toLowerCase() === "white";
  if (theme === "dark" && isBlack) return "#fff";
  if (theme === "dark" && isWhite) return "#333";
  return color;
}

const Toolbar = ({ activeTool, setTool, penColor, setPenColor, penThickness, setPenThickness, selectedShape, setSelectedShape, textFontSize, setTextFontSize, eraserRadius, setEraserRadius, clearCanvas, undo, redo, theme, getCanvasColor, stickyColor, setStickyColor }: ToolbarProps) => {
  const [showPenOptions, setShowPenOptions] = useState(false);
  const [subToolbarPos, setSubToolbarPos] = useState<{top: number, left: number}>({top: 0, left: 0});
  const penButtonRef = useRef<HTMLButtonElement>(null);
  const subToolbarRef = useRef<HTMLDivElement>(null);
 
  const [showShapeOptions, setShowShapeOptions] = useState(false);
  const shapeButtonRef = useRef<HTMLButtonElement>(null);
  const shapeSubToolbarRef = useRef<HTMLDivElement>(null);
  const [shapeSubToolbarPos, setShapeSubToolbarPos] = useState<{top: number, left: number}>({top: 0, left: 0});

  const [showTextOptions, setShowTextOptions] = useState(false);
  const textButtonRef = useRef<HTMLButtonElement>(null);
  const textSubToolbarRef = useRef<HTMLDivElement>(null);
  const [textSubToolbarPos, setTextSubToolbarPos] = useState<{top: number, left: number}>({top: 0, left: 0});

  const [showEraserOptions, setShowEraserOptions] = useState(false);
  const eraserButtonRef = useRef<HTMLButtonElement>(null);
  const eraserSubToolbarRef = useRef<HTMLDivElement>(null);
  const [eraserSubToolbarPos, setEraserSubToolbarPos] = useState<{top: number, left: number}>({top: 0, left: 0});

  const [showStickyOptions, setShowStickyOptions] = useState(false);
  const stickyButtonRef = useRef<HTMLButtonElement>(null);
  const stickySubToolbarRef = useRef<HTMLDivElement>(null);
  const [stickySubToolbarPos, setStickySubToolbarPos] = useState<{top: number, left: number}>({top: 0, left: 0});

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
      if (
        showTextOptions &&
        textButtonRef.current &&
        !textButtonRef.current.contains(event.target as Node) &&
        textSubToolbarRef.current &&
        !textSubToolbarRef.current.contains(event.target as Node)
      ) {
        setShowTextOptions(false);
      }
      if (
        showEraserOptions &&
        eraserButtonRef.current &&
        !eraserButtonRef.current.contains(event.target as Node) &&
        eraserSubToolbarRef.current &&
        !eraserSubToolbarRef.current.contains(event.target as Node)
      ) {
        setShowEraserOptions(false);
      }
      if (
        showStickyOptions &&
        stickyButtonRef.current &&
        !stickyButtonRef.current.contains(event.target as Node) &&
        stickySubToolbarRef.current &&
        !stickySubToolbarRef.current.contains(event.target as Node)
      ) {
        setShowStickyOptions(false);
      }
    }
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, [showPenOptions, showShapeOptions, showTextOptions, showEraserOptions]);

  const handlePenClick = () => {
    if (activeTool === "pen") {
      setShowPenOptions((open) => !open);
      return;
    }
    setTool("pen");
    setShowPenOptions(true);
  };

  const handleShapeClick = () => {
    if (activeTool === "shape") {
      setShowShapeOptions((open) => !open);
      return;
    }
    setTool("shape");
    setShowShapeOptions(true);
  };

  const handleTextClick = () => {
    if (activeTool === "text") {
      setShowTextOptions((open) => !open);
      return;
    }
    setTool("text");
    setShowTextOptions(true);
  };

  const handleEraserClick = () => {
    if (activeTool === "eraser") {
      setShowEraserOptions((open) => !open);
      return;
    }
    setTool("eraser");
    setShowEraserOptions(true);
  };

  const handleStickyClick = () => {
    if (activeTool === "sticky") {
      setShowStickyOptions((open) => !open);
      return;
    }
    setTool("sticky");
    setShowStickyOptions(true);
  };

  const handleToolClick = (tool: Tool) => {
    setTool(tool);
    setShowPenOptions(false);
    setShowShapeOptions(false);
  };

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

  useLayoutEffect(() => {
    if (showTextOptions && textButtonRef.current) {
      const rect = textButtonRef.current.getBoundingClientRect();
      setTextSubToolbarPos({
        top: rect.bottom + 12,
        left: rect.left + rect.width / 2
      });
    }
  }, [showTextOptions]);

  useLayoutEffect(() => {
    if (showEraserOptions && eraserButtonRef.current) {
      const rect = eraserButtonRef.current.getBoundingClientRect();
      setEraserSubToolbarPos({
        top: rect.bottom + 12,
        left: rect.left + rect.width / 2
      });
    }
  }, [showEraserOptions]);

  useLayoutEffect(() => {
    if (showStickyOptions && stickyButtonRef.current) {
      const rect = stickyButtonRef.current.getBoundingClientRect();
      setStickySubToolbarPos({
        top: rect.bottom + 12,
        left: rect.left + rect.width / 2
      });
    }
  }, [showStickyOptions]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        zIndex: 2000
      }}
    >
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
          ref={eraserButtonRef}
          className={`toolbar-btn${activeTool === "eraser" ? " selected" : ""}`}
          aria-label="Eraser tool"
          onClick={() => handleEraserClick()}
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
          ref={stickyButtonRef}
          className={`toolbar-btn${activeTool === "sticky" ? " selected" : ""}`}
          aria-label="Sticky Note tool"
          onClick={handleStickyClick}
        >
          {FaNoteSticky({size: 18})}
        </button>
        <button
          ref={textButtonRef}
          className={`toolbar-btn${activeTool === "text" ? " selected" : ""}`}
          aria-label="Draw text"
          onClick={() => handleTextClick()}
        >
          {FaFont({size: 18})}
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
                  background: getCanvasColor(color, theme),
                  border: "2px solid " + getBorderColor(color === penColor ? "#333" : "#fff", theme),
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
                  border: "2px solid " + getBorderColor(thick === penThickness ? "#333" : "#ffffff00", theme),
                }}
                onClick={() => setPenThickness(thick)}
              >
                <div
                  style={{
                    width: thick,
                    height: thick,
                    borderRadius: "50%",
                    background: getCanvasColor(penColor, theme),
                    margin: "auto",
                  }}
                />
              </button>
            ))}
          </div>
        </nav>
      )}
      {activeTool === "eraser" && showEraserOptions && (
        <nav
          className="eraser-subtoolbar"
          ref={eraserSubToolbarRef}
          style={{
            position: "fixed",
            top: `${eraserSubToolbarPos.top}px`,
            left: `${eraserSubToolbarPos.left}px`,
            transform: "translateX(-50%)"
          }}
        >
          <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:3}}>
            <label style={{fontSize:13, marginBottom:0}}>Eraser size</label>
            <div style={{display:"flex", alignItems:"center", gap:8}}>
              <input
                type="range"
                min={5}
                max={80}
                step={1}
                value={eraserRadius}
                onChange={e => setEraserRadius(Number(e.target.value))}
                style={{width: 110}}
              />
              <span style={{fontSize:14, minWidth: 28, textAlign: "right"}}>{eraserRadius}px</span>
            </div>
            <button
              style={{
                marginTop: 8,
                background: "#ff5e5e",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "6px 16px",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: 15,
                boxShadow: "0 2px 4px rgba(0,0,0,0.07)"
              }}
              onClick={clearCanvas}
              title="Clear all drawings and text"
            >
              Clear All
            </button>
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
                onClick={() => setSelectedShape(shape.key as ShapeType)}
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
                  background: getCanvasColor(color, theme),
                  border: "2px solid " + getBorderColor(color === penColor ? "#333" : "#fff", theme),
                }}
                onClick={() => setPenColor(color)}
              />
            ))}
          </div>
        </nav>
      )}
      {activeTool === "text" && showTextOptions && (
        <nav
          className="text-subtoolbar"
          ref={textSubToolbarRef}
          style={{
            position: "fixed",
            top: `${textSubToolbarPos.top}px`,
            left: `${textSubToolbarPos.left}px`,
            transform: "translateX(-50%)"
          }}
        >
          <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:3}}>
            <label style={{fontSize:13, marginBottom:0}}>Font size</label>
            <div style={{display:"flex", alignItems:"center", gap:8}}>
              <input
                type="range"
                min={14}
                max={64}
                step={1}
                value={textFontSize}
                onChange={e => setTextFontSize(Number(e.target.value))}
                style={{width: 110}}
              />
              <span style={{fontSize:14, minWidth: 28, textAlign: "right"}}>{textFontSize}px</span>
            </div>
            <div className="text-colors" style={{marginTop:12}}>
              {COLORS.map((color) => (
                <button
                  key={color}
                  className="color-btn"
                  style={{
                    background: getCanvasColor(color, theme),
                    border: "2px solid " + getBorderColor(color === penColor ? "#333" : "#fff", theme),
                  }}
                  onClick={() => setPenColor(color)}
                />
              ))}
            </div>
          </div>
        </nav>
      )}
      {activeTool === "sticky" && showStickyOptions && (
        <nav
          className="sticky-subtoolbar"
          ref={stickySubToolbarRef}
          style={{
            position: "fixed",
            top: `${stickySubToolbarPos.top}px`,
            left: `${stickySubToolbarPos.left}px`,
            transform: "translateX(-50%)",
            padding: "12px 6px",
          }}
        >
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            {STICKY_COLORS.slice(0, 3).map((color) => (
              <button
                key={color}
                className="color-btn"
                style={{
                  background: color,
                  border: "2px solid " + (color === stickyColor ? "#333" : "#fff"),
                  borderRadius: "50%",
                  width: 26,
                  height: 26,
                  cursor: "pointer",
                  boxShadow: color === stickyColor ? "0 0 5px #888" : "none",
                  transition: "box-shadow 0.15s, border 0.13s",
                }}
                aria-label={`Sticky color ${color}`}
                onClick={() => setStickyColor(color)}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            {STICKY_COLORS.slice(3, 6).map((color) => (
              <button
                key={color}
                className="color-btn"
                style={{
                  background: color,
                  border: "2px solid " + (color === stickyColor ? "#333" : "#fff"),
                  borderRadius: "50%",
                  width: 26,
                  height: 26,
                  cursor: "pointer",
                  boxShadow: color === stickyColor ? "0 0 5px #888" : "none",
                  transition: "box-shadow 0.15s, border 0.13s",
                }}
                aria-label={`Sticky color ${color}`}
                onClick={() => setStickyColor(color)}
              />
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

export default Toolbar;