import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Line, Circle } from "react-konva";
import Toolbar from "./Toolbar";
import DotCanvasOverlay from "./DotCanvasOverlay";
import { KonvaEventObject } from "konva/lib/Node";

type LineType = {
  points: number[],
  color: string,
  strokeWidth: number
};

export type Tool = "pen" | "eraser" | "shape" | null;

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
  const [undoneLines, setUndoneLines] = useState<LineType[]>([]);
  const [undoBuffer, setUndoBuffer] = useState<string[]>([]);
  const [eraseBuffer, setEraseBuffer] = useState<LineType[]>([]);
  const [redoBuffer, setRedoBuffer] = useState<string[]>([]);
  const [redoEraseBuffer, setRedoEraseBuffer] = useState<LineType[]>([]);

  const [currentShape, setCurrentShape] = useState<string>("line");

  const [stageScale, setStageScale] = useState(INITIAL_SCALE);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  const [isPanning, setIsPanning] = useState(false);

  const [currentColor, setCurrentColor] = useState("#222");
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(2);

  const [activeTool, setActiveTool] = useState<Tool>("pen");
  
  const [eraserRadius] = useState(10);

  const stageRef = useRef<any>(null);
  
  const lastPanPos = useRef({ x: 0, y: 0 });
  const isDrawing = useRef(false);
  const drawPointerId = useRef<number | null>(null);

  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);
  const lastTouchDist = useRef<number | null>(null);

  const undo = () => {
    const action: string | undefined = undoBuffer.pop();
    if (!action) return;
    setUndoBuffer([...undoBuffer]);
    if (action === "erase") {
      const lastErased: LineType | undefined = eraseBuffer.pop();
      if (lastErased) {
        setLines(prevLines => [...prevLines, lastErased]);
        setRedoBuffer(prev => [...prev, "erase"]);
        setRedoEraseBuffer(prev => [...prev, lastErased]);
      }
      setEraseBuffer([...eraseBuffer]);
    } else if (action === "draw") {
      if (lines.length === 0) return;
      setUndoneLines(prevUndoneLines => {
        const updatedUndoneLines = [...prevUndoneLines, lines[lines.length - 1]];

        if (updatedUndoneLines.length > 50) {
          updatedUndoneLines.slice(1);
        }

        return updatedUndoneLines;
      });
      setRedoBuffer(prev => [...prev, "draw"]);
      setLines(prev => {
        const removed = prev[prev.length - 1];
        return prev.slice(0, -1);
      });
    }
  }

  const redo = () => {
    const action = redoBuffer[redoBuffer.length - 1];
    setRedoBuffer(prev => prev.slice(0, -1));
    if (!action) return;
    setRedoBuffer([...redoBuffer]);

    if (action === "erase") {
      const lastErased = redoEraseBuffer[redoEraseBuffer.length - 1];
      setRedoEraseBuffer(prev => prev.slice(0, -1));
      if (lastErased) {
        setLines(prev => prev.filter(line => line !== lastErased));
        setUndoBuffer(prev => [...prev, "erase"]);
        setEraseBuffer(prev => [...prev, lastErased]);
      }
      setRedoEraseBuffer([...redoEraseBuffer]);
    } else if (action === "draw") {
      const lastDrawn = undoneLines[undoneLines.length - 1];
      setUndoneLines(prev => prev.slice(0, -1));
      if (lastDrawn) {
        setLines(prev => [...prev, lastDrawn]);
        setUndoBuffer(prev => [...prev, "draw"]);
      }
      setUndoneLines([...undoneLines]);
    }
  };

  const initialPinch = useRef<{
    center: { x: number; y: number },
    stagePos: { x: number; y: number },
    stageScale: number,
    distance: number
  } | null>(null);

  const getRelativePointer = () => {
    const stage = stageRef.current;
    return stage.getRelativePointerPosition();
  };

  const handlePointerDown = (e: any) => {
    if (
      (e.evt.button === 2 ||
        e.evt.ctrlKey ||
        e.evt.metaKey ||
        e.evt.altKey ||
        e.evt.shiftKey)
    ) {
      setIsPanning(true);
      lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY };
      return;
    }
    isDrawing.current = true;
    drawPointerId.current = e.evt.pointerId;
    const pos = getRelativePointer();
    if (activeTool === "pen") {
      setLines(lines => [
        ...lines,
        { points: [pos.x, pos.y], color: currentColor, strokeWidth: currentStrokeWidth }
      ]);
      setRedoBuffer([]);
      setRedoEraseBuffer([]);
      setUndoneLines([]);
      setUndoBuffer(prev => [...prev, "draw"]);
    }
  };

  const handlePointerMove = (e: any) => {
    const pos = getRelativePointer();
    setCursorPos({ x: pos.x, y: pos.y });

    if (isPanning) {
      const dx = e.evt.clientX - lastPanPos.current.x;
      const dy = e.evt.clientY - lastPanPos.current.y;
      setStagePos(pos => ({
        x: pos.x + dx,
        y: pos.y + dy,
      }));
      lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY };
      return;
    }

    if (!isDrawing.current || drawPointerId.current !== e.evt.pointerId) return;

    if (activeTool === "eraser") {
      const prevLinesSnapshot = lines;
      const erasedLines = prevLinesSnapshot.filter(line =>
        isLineErased(line, { x: pos.x, y: pos.y }, eraserRadius, stageScale)
      );
      if (erasedLines.length > 0) {
        setLines(prevLines =>
          prevLines.filter(line =>
            !isLineErased(line, { x: pos.x, y: pos.y }, eraserRadius, stageScale)
          )
        );
        setEraseBuffer(prev => [...prev, ...erasedLines]);
        setUndoBuffer(prev => [...prev, ...erasedLines.map(() => "erase")]);
        setRedoBuffer([]);
        setRedoEraseBuffer([]);
        setUndoneLines([]);
      }
    } else if (activeTool === "pen") {
      setLines(lines => {
        let lastLine = lines[lines.length - 1];
        if (!lastLine) return lines;
        lastLine = {
          ...lastLine,
          points: lastLine.points.concat([pos.x, pos.y]),
          color: currentColor,
          strokeWidth: currentStrokeWidth
        };
        return [...lines.slice(0, -1), lastLine];
      });
      setRedoBuffer([]);
      setRedoEraseBuffer([]);
      setUndoneLines([]);
    }
  };

  const handlePointerUp = (e: any) => {
    if (isDrawing.current && drawPointerId.current === e.evt.pointerId) {
      isDrawing.current = false;
      drawPointerId.current = null;
    }
    if (isPanning) {
      setIsPanning(false);
    }
  };

  const handlePointerLeave = () => setCursorPos(null);

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

  const handleTouchStart = (e: KonvaEventObject<TouchEvent>) => {
    const nativeEvent = e.evt;
    if (nativeEvent.touches && nativeEvent.touches.length === 2) {
      const t0 = nativeEvent.touches[0];
      const t1 = nativeEvent.touches[1];
      const center = {
        x: (t0.clientX + t1.clientX) / 2,
        y: (t0.clientY + t1.clientY) / 2
      };
      const distance = Math.hypot(
        t0.clientX - t1.clientX,
        t0.clientY - t1.clientY
      );
      initialPinch.current = {
        center,
        stagePos: { ...stagePos },
        stageScale: stageScale,
        distance
      };
      setIsPanning(true);
    }
  };

  const handleTouchMove = (e: KonvaEventObject<TouchEvent>) => {
    const nativeEvent = e.evt;
    if (
      nativeEvent.touches &&
      nativeEvent.touches.length === 2 &&
      initialPinch.current
    ) {
      nativeEvent.preventDefault();

      const t0 = nativeEvent.touches[0];
      const t1 = nativeEvent.touches[1];
      const center = {
        x: (t0.clientX + t1.clientX) / 2,
        y: (t0.clientY + t1.clientY) / 2
      };
      const distance = Math.hypot(
        t0.clientX - t1.clientX,
        t0.clientY - t1.clientY
      );

      const { center: startCenter, stagePos: startPos, stageScale: startScale, distance: startDistance } = initialPinch.current;

      let scale = distance / startDistance * startScale;
      scale = Math.max(0.2, Math.min(5, scale));

      const worldPos = {
        x: (startCenter.x - startPos.x) / startScale,
        y: (startCenter.y - startPos.y) / startScale
      };

      const newPos = {
        x: center.x - worldPos.x * scale,
        y: center.y - worldPos.y * scale
      };

      setStageScale(scale);
      setStagePos(newPos);
    }
  };


  const handleTouchEnd = (e: KonvaEventObject<TouchEvent>) => {
    const nativeEvent = e.evt;
    if (!nativeEvent.touches || nativeEvent.touches.length < 2) {
      setIsPanning(false);
      initialPinch.current = null;
    }
  };

  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (e.touches && e.touches.length === 2) e.preventDefault();
    };
    document.addEventListener("touchmove", preventDefault, { passive: false });
    return () => {
      document.removeEventListener("touchmove", preventDefault);
    };
  }, []);

  return (
    <div>
      <Toolbar
        activeTool={activeTool}
        setTool={setActiveTool}
        penColor={currentColor}
        setPenColor={setCurrentColor}
        penThickness={currentStrokeWidth}
        setPenThickness={setCurrentStrokeWidth}
        selectedShape={currentShape}
        setSelectedShape={setCurrentShape}
        undo={undo}
        redo={redo}
      />
      <Layer listening={false}>
        <DotCanvasOverlay
          stagePos={stagePos}
          stageScale={stageScale}
          width={window.innerWidth}
          height={window.innerHeight}
          baseDotSpacing={32}
          dotRadius={1.5}
          color="#d8e1e4ff"
          opacity={0.75}
          minScreenSpacing={16}
        />
      </Layer>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        ref={stageRef}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerUp={handlePointerUp}
        onContextMenu={e => e.evt.preventDefault()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          background: "transparent",
          touchAction: "none",
          cursor: isPanning
            ? "grab"
            : activeTool === "eraser"
            ? "none"
            : activeTool === "pen"
            ? "crosshair"
            : "default",
        }}
      >
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