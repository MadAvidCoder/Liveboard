import React, { useRef, useState } from "react";
import { Stage, Layer, Line, Circle } from "react-konva";
import Toolbar from "./Toolbar";
import DotsBackground from "./DotsBackground";

type LineType = {
  points: number[],
  color: string,
  strokeWidth: number
};

export type Tool = "pen" | "eraser" | "shape" | "undo" | "redo";

const INITIAL_SCALE = 1;

function distToSegment(p: { x: number, y: number }, v: { x: number, y: number }, w: { x: number, y: number }) {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

function isLineErased(line: LineType, eraserPoint: { x: number, y: number }, radius: number, stageScale: number = 1) {
  const pts = line.points;
  for (let i = 0; i < pts.length - 2; i += 2) {
    const x1 = pts[i], y1 = pts[i + 1];
    const x2 = pts[i + 2], y2 = pts[i + 3];
    if (distToSegment(eraserPoint, { x: x1, y: y1 }, { x: x2, y: y2 }) < radius / stageScale) return true;
  }
  return false;
}

const InfiniteCanvas: React.FC = () => {
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const [lines, setLines] = useState<LineType[]>([]);
  const isDrawing = useRef(false);
  const stageRef = useRef<any>(null);

  const [stageScale, setStageScale] = useState(INITIAL_SCALE);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  const [isPanning, setIsPanning] = useState(false);
  const lastPanPos = useRef({ x: 0, y: 0 });

  const [currentColor, setCurrentColor] = useState("#222");
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(2);
  const [activeTool, setActiveTool] = useState<Tool>("pen");

  const [eraserRadius, setEraserRadius] = useState(10);

  const getRelativePointer = () => {
    const stage = stageRef.current;
    return stage.getRelativePointerPosition();
  };

  const handleMouseDown = (e: any) => {
    if (
      e.evt.button === 2 ||
      e.evt.ctrlKey ||
      e.evt.metaKey ||
      e.evt.altKey ||
      e.evt.shiftKey
    ) {
      setIsPanning(true);
      lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY };
      return;
    }
    isDrawing.current = true;
    const pos = getRelativePointer();
    if (activeTool === "pen") {
      setLines([...lines, { points: [pos.x, pos.y], color: currentColor, strokeWidth: currentStrokeWidth }]);
    }
  };

  const handleMouseMove = (e: any) => {
    const pos = getRelativePointer();
    setCursorPos({ x: pos.x, y: pos.y });

    if (isPanning) {
      const dx = e.evt.clientX - lastPanPos.current.x;
      const dy = e.evt.clientY - lastPanPos.current.y;
      setStagePos((pos) => ({
        x: pos.x + dx,
        y: pos.y + dy,
      }));
      lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY };
      return;
    }

    if (!isDrawing.current) return;
    if (activeTool === "eraser") {
      setLines(prevLines => prevLines.filter(line => !isLineErased(line, { x: pos.x, y: pos.y }, eraserRadius, stageScale)));
    } else if (activeTool === "pen") {
      let lastLine = lines[lines.length - 1];
      if (!lastLine) return;

      lastLine = {
        ...lastLine,
        points: lastLine.points.concat([pos.x, pos.y]),
        color: currentColor,
        strokeWidth: currentStrokeWidth
      };
      const newLines = [...lines.slice(0, -1), lastLine];
      setLines(newLines);
    }
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    setIsPanning(false);
  };

  const handleMouseLeave = () => setCursorPos(null);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const oldScale = stageScale;
    const scaleBy = 1.05;
    const pointer = stage.getPointerPosition();

    const direction = e.evt.deltaY > 0 ? 1 : -1;
    const newScale = direction > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale
    };

    setStageScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale
    });
  };

  const handleClear = () => setLines([]);

  return (
    <div>
      <Toolbar activeTool={activeTool} setTool={setActiveTool} />
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        ref={stageRef}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseup={handleMouseUp}
        onContextMenu={e => e.evt.preventDefault()}
        style={{ background: "transparent", cursor: isPanning ? "grab" : activeTool === "eraser" ? "none" : activeTool === "pen" ? "crosshair" : "default" }}
      >
        <Layer listening={false}>
          <DotsBackground
            width={window.innerWidth}
            height={window.innerHeight}
            stagePos={stagePos}
            stageScale={stageScale}
            dotSpacing={32}
            dotRadius={1.5}
            color="#d8e1e4ff"
            opacity={0.6}
          />
        </Layer>
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.color}
              strokeWidth={line.strokeWidth}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation="source-over"
            />
          ))}
          {activeTool === "eraser" && cursorPos && (
            <Circle
              x={cursorPos.x}
              y={cursorPos.y}
              radius={eraserRadius / stageScale}
              stroke="#6393ed"
              strokeWidth={5 / stageScale}
              opacity={0.8}
              listening={false}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default InfiniteCanvas;