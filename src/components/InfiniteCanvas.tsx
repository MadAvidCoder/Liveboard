import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Line, Circle, Arrow, Rect, Ellipse, Text } from "react-konva";
import Toolbar from "./Toolbar";
import "./InfiniteCanvas.css";
import DotCanvasOverlay from "./DotCanvasOverlay";
import { KonvaEventObject } from "konva/lib/Node";

export type ShapeType = "line" | "arrow" | "circle" | "rectangle";
type Shape = {
  points: number[],
  color: string,
  strokeWidth: number,
  type: ShapeType
};

export type Tool = "pen" | "eraser" | "shape" | "text" | null;

type Textbox = {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  isEditing: boolean;
};

const INITIAL_SCALE = 1;

function distToSegment(p: { x: number, y: number }, v: { x: number, y: number }, w: { x: number, y: number }) {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

function isLineErased(line: Shape, eraserPoint: { x: number, y: number }, radius: number, stageScale: number = 1) {
  const pts = line.points;
  for (let i = 0; i < pts.length - 2; i += 2) {
    const x1 = pts[i], y1 = pts[i + 1];
    const x2 = pts[i + 2], y2 = pts[i + 3];
    if (distToSegment(eraserPoint, { x: x1, y: y1 }, { x: x2, y: y2 }) < radius / stageScale) return true;
  }
  return false;
}

function getTextWidth(text: string, fontSize: number, fontFamily: string) {
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0;
  ctx.font = `${fontSize}px ${fontFamily}`;
  return ctx.measureText(text || "M").width + 6;
}
getTextWidth.canvas = null as HTMLCanvasElement | null;

const CANVAS_FONT = "Inter, SF Pro Display, Segoe UI, Roboto, Arial, sans-serif";

const InfiniteCanvas: React.FC = () => {
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const [lines, setLines] = useState<Shape[]>([]);
  const [undoneLines, setUndoneLines] = useState<Shape[]>([]);
  const [undoBuffer, setUndoBuffer] = useState<string[]>([]);
  const [eraseBuffer, setEraseBuffer] = useState<Shape[]>([]);
  const [redoBuffer, setRedoBuffer] = useState<string[]>([]);
  const [redoEraseBuffer, setRedoEraseBuffer] = useState<Shape[]>([]);

  const [currentShape, setCurrentShape] = useState<ShapeType>("line");
  const [shapePreview, setShapePreview] = useState<null | { points: number[], color: string, strokeWidth: number, type: ShapeType }>(null);

  const [currentTextFontSize, setCurrentTextFontSize] = useState(24);
  const [textboxes, setTextboxes] = useState<Textbox[]>([]);
  const [editingTextboxId, setEditingTextboxId] = useState<string | null>(null);

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

  const initialPinch = useRef<{
    center: { x: number; y: number },
    stagePos: { x: number; y: number },
    stageScale: number,
    distance: number
  } | null>(null);

  const inputRefs = useRef<{ [id: string]: HTMLInputElement | null }>({});
  const [inputWidths, setInputWidths] = useState<{ [id: string]: number }>({});

  useEffect(() => {
    textboxes.forEach(tb => {
      if (tb.isEditing) {
        const width = getTextWidth(tb.text, tb.fontSize * stageScale, CANVAS_FONT);
        setInputWidths(w => ({ ...w, [tb.id]: width }));
      }
    });
  }, [textboxes, stageScale]);

  useEffect(() => {
    if (editingTextboxId) {
      document.body.classList.add('noscroll');
      document.documentElement.classList.add('noscroll');
      window.scrollTo(0, 0);
    } else {
      document.body.classList.remove('noscroll');
      document.documentElement.classList.remove('noscroll');
      window.scrollTo(0, 0);
    }
    return () => {
      document.body.classList.remove('noscroll');
      document.documentElement.classList.remove('noscroll');
      window.scrollTo(0, 0);
    };
  }, [editingTextboxId]);

  useEffect(() => {
    if (!editingTextboxId) return;
    const preventScroll = (e: Event) => {
      e.preventDefault();
    };
    window.addEventListener("scroll", preventScroll, true);
    return () => {
      window.removeEventListener("scroll", preventScroll, true);
    };
  }, [editingTextboxId]);

  const resetScroll = () => {
    window.scrollTo(0, 0);
    setTimeout(() => window.scrollTo(0, 0), 1);
  };

  const handleDivClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (activeTool !== "text") return;
    if ((e.target as HTMLElement).tagName === "INPUT") return;
    const stageContainer = (stageRef.current as any)?.container();
    if (!stageContainer || !stageContainer.contains(e.target as Node)) return;
    const boundingRect = stageContainer.getBoundingClientRect();

    const screenX = e.clientX - boundingRect.left;
    const screenY = e.clientY - boundingRect.top;
    const x = (screenX - stagePos.x) / stageScale;
    const y = (screenY - stagePos.y) / stageScale;
    
    const id = Math.random().toString(36).substr(2, 9);
    setTextboxes(textboxes => [
      ...textboxes,
      {
        id,
        x,
        y,
        text: "",
        fontSize: currentTextFontSize,
        color: currentColor,
        isEditing: true,
      }
    ]);
    setEditingTextboxId(id);
  };

  const toWorld = (pos: { x: number; y: number }) => ({
    x: (pos.x - stagePos.x) / stageScale,
    y: (pos.y - stagePos.y) / stageScale,
  });

  const undo = () => {
    const action: string | undefined = undoBuffer.pop();
    if (!action) return;
    setUndoBuffer([...undoBuffer]);
    if (action === "erase") {
      const lastErased: Shape | undefined = eraseBuffer.pop();
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
  };

  const redo = () => {
    const action = redoBuffer[redoBuffer.length - 1];
    if (!action) return;
    setRedoBuffer(prev => prev.slice(0, -1));

    if (action === "erase") {
      const lastErased = redoEraseBuffer[redoEraseBuffer.length - 1];
      if (!lastErased) return;
      setRedoEraseBuffer(prev => prev.slice(0, -1));
      setLines(prev => prev.filter(line => line !== lastErased));
      setUndoBuffer(prev => [...prev, "erase"]);
      setEraseBuffer(prev => [...prev, lastErased]);
    } else if (action === "draw") {
      const lastDrawn = undoneLines[undoneLines.length - 1];
      if (!lastDrawn) return;
      setUndoneLines(prev => prev.slice(0, -1));
      setLines(prev => [...prev, lastDrawn]);
      setUndoBuffer(prev => [...prev, "draw"]);
    }
  };

  const handlePointerDown = (e: any) => {
    if (
      (e.evt.button === 2 ||
        e.evt.ctrlKey ||
        e.evt.metaKey ||
        e.evt.altKey)
    ) {
      setIsPanning(true);
      lastPanPos.current = { x: e.evt.clientX, y: e.evt.clientY };
      return;
    }
    const pos = stageRef.current?.getPointerPosition();
    if (!pos) return;
    const { x, y } = toWorld(pos);
    if (activeTool === "pen") {
      isDrawing.current = true;
      drawPointerId.current = e.evt.pointerId;
      setLines(lines => [
        ...lines,
        { points: [x, y], color: currentColor, strokeWidth: currentStrokeWidth, type: "line" }
      ]);
      setRedoBuffer([]);
      setRedoEraseBuffer([]);
      setUndoneLines([]);
      setUndoBuffer(prev => [...prev, "draw"]);
    } else if (activeTool === "shape") {
      isDrawing.current = true;
      drawPointerId.current = e.evt.pointerId;
      setShapePreview({
        points: [x, y, x, y],
        color: currentColor,
        strokeWidth: currentStrokeWidth,
        type: currentShape
      });
    } else if (activeTool === "eraser") {
      isDrawing.current = true;
      drawPointerId.current = e.evt.pointerId;
    }
  };

  const handlePointerMove = (e: any) => {
    const stage = stageRef.current;
    const pos = stage ? stage.getPointerPosition() : null;
    if (!pos) return;

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

    const { x, y } = toWorld(pos);

    if (activeTool === "eraser") {
      const prevLinesSnapshot = lines;
      const erasedLines = prevLinesSnapshot.filter(line =>
        isLineErased(line, { x: x, y: y }, eraserRadius, stageScale)
      );
      if (erasedLines.length > 0) {
        setLines(prevLines =>
          prevLines.filter(line =>
            !isLineErased(line, { x: x, y: y }, eraserRadius, stageScale)
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
          points: lastLine.points.concat([x, y]),
          color: currentColor,
          strokeWidth: currentStrokeWidth
        };
        return [...lines.slice(0, -1), lastLine];
      });
      setRedoBuffer([]);
      setRedoEraseBuffer([]);
      setUndoneLines([]);
    } else if (activeTool === "shape" && shapePreview) {
      const [x1, y1] = shapePreview.points;
      let x2 = x;
      let y2 = y;
      if (
        (shapePreview.type === "rectangle" || shapePreview.type === "circle") &&
        e.evt.shiftKey
      ) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const mag = Math.max(Math.abs(dx), Math.abs(dy));
        x2 = x1 + mag * Math.sign(dx || 1);
        y2 = y1 + mag * Math.sign(dy || 1);
      }
      setShapePreview({
        ...shapePreview,
        points: [x1, y1, x2, y2]
      });
    }
  };

  const handlePointerUp = (e: any) => {
    if (isDrawing.current && drawPointerId.current === e.evt.pointerId) {
      isDrawing.current = false;
      drawPointerId.current = null;
    }
    if (activeTool === "shape" && shapePreview) {
      setLines(lines => [
        ...lines,
        {
          points: shapePreview.points,
          color: shapePreview.color,
          strokeWidth: shapePreview.strokeWidth,
          type: shapePreview.type,
        },
      ]);
      setShapePreview(null);
      setUndoBuffer(prev => [...prev, "draw"]);
      setRedoBuffer([]);
    }
    setIsPanning(false);
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
    <div
      style={{ width: "100vw", height: "100vh", position: "relative" }}
      onClick={handleDivClick}
    >
      <Toolbar
        activeTool={activeTool}
        setTool={setActiveTool}
        penColor={currentColor}
        setPenColor={setCurrentColor}
        penThickness={currentStrokeWidth}
        setPenThickness={setCurrentStrokeWidth}
        selectedShape={currentShape}
        setSelectedShape={setCurrentShape}
        textFontSize={currentTextFontSize}
        setTextFontSize={setCurrentTextFontSize}
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
        onPointerDown={activeTool === "text" ? undefined : handlePointerDown}
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
          {lines.map((shape, i) => {
            switch (shape.type) {
              case "arrow":
                return (
                  <Arrow
                    key={i}
                    points={shape.points}
                    stroke={shape.color}
                    fill={shape.color}
                    strokeWidth={shape.strokeWidth}
                    pointerLength={16}
                    pointerWidth={16}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation="source-over"
                  />
                );
              case "rectangle":
                return (
                  <Rect
                    key={i}
                    x={Math.min(shape.points[0], shape.points[2])}
                    y={Math.min(shape.points[1], shape.points[3])}
                    width={Math.abs(shape.points[2] - shape.points[0])}
                    height={Math.abs(shape.points[3] - shape.points[1])}
                    stroke={shape.color}
                    strokeWidth={shape.strokeWidth}
                    globalCompositeOperation="source-over"
                  />
                );
              case "circle":
                return (
                  <Ellipse
                    key={i}
                    x={(shape.points[0] + shape.points[2]) / 2}
                    y={(shape.points[1] + shape.points[3]) / 2}
                    radiusX={Math.abs(shape.points[2] - shape.points[0]) / 2}
                    radiusY={Math.abs(shape.points[3] - shape.points[1]) / 2}
                    stroke={shape.color}
                    strokeWidth={shape.strokeWidth}
                    globalCompositeOperation="source-over"
                  />
                );
              case "line":
              default:
                return (
                  <Line
                    key={i}
                    points={shape.points}
                    stroke={shape.color}
                    strokeWidth={shape.strokeWidth}
                    tension={0}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation="source-over"
                  />
                );
            }
          })}
          {shapePreview && activeTool === "shape" && (
            <>
              {shapePreview.type === "line" && (
                <Line
                  points={shapePreview.points}
                  stroke={shapePreview.color}
                  strokeWidth={shapePreview.strokeWidth}
                  tension={0}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation="source-over"
                  dash={[10, 5]}
                />
              )}
              {shapePreview.type === "arrow" && (
                <Arrow
                  points={shapePreview.points}
                  stroke={shapePreview.color}
                  fill={shapePreview.color}
                  strokeWidth={shapePreview.strokeWidth}
                  pointerLength={16}
                  pointerWidth={16}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation="source-over"
                  dash={[10, 5]}
                />
              )}
              {shapePreview.type === "rectangle" && (
                <Rect
                  x={Math.min(shapePreview.points[0], shapePreview.points[2])}
                  y={Math.min(shapePreview.points[1], shapePreview.points[3])}
                  width={Math.abs(shapePreview.points[2] - shapePreview.points[0])}
                  height={Math.abs(shapePreview.points[3] - shapePreview.points[1])}
                  stroke={shapePreview.color}
                  strokeWidth={shapePreview.strokeWidth}
                  globalCompositeOperation="source-over"
                  dash={[10, 5]}
                />
              )}
              {shapePreview.type === "circle" && (
                <Ellipse
                  x={(shapePreview.points[0] + shapePreview.points[2]) / 2}
                  y={(shapePreview.points[1] + shapePreview.points[3]) / 2}
                  radiusX={Math.abs(shapePreview.points[2] - shapePreview.points[0]) / 2}
                  radiusY={Math.abs(shapePreview.points[3] - shapePreview.points[1]) / 2}
                  stroke={shapePreview.color}
                  strokeWidth={shapePreview.strokeWidth}
                  globalCompositeOperation="source-over"
                  dash={[10, 5]}
                />
              )}
            </>
          )}
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
        <Layer>
          {textboxes.map(tb =>
            tb.isEditing ? (
              null
            ) : (
              <Text
                key={tb.id}
                x={tb.x}
                y={tb.y}
                text={tb.text}
                fontSize={tb.fontSize}
                fill={tb.color}
                fontFamily={CANVAS_FONT}
                draggable
                onClick={() => {
                  setTextboxes(boxes =>
                    boxes.map(b =>
                      b.id === tb.id ? { ...b, isEditing: true } : b
                    )
                  );
                  setEditingTextboxId(tb.id);
                }}
              />
            )
          )}
        </Layer>
      </Stage>
      {textboxes.map(tb =>
        tb.isEditing ? (
          <input
            key={tb.id}
            ref={el => { inputRefs.current[tb.id] = el; }}
            className="canvas-textbox-input"
            style={{
              position: "fixed",
              left: tb.x * stageScale + stagePos.x,
              top: tb.y * stageScale + stagePos.y - 7 * stageScale,
              fontSize: tb.fontSize * stageScale,
              color: tb.color,
              fontFamily: CANVAS_FONT,
              width: inputWidths[tb.id] || 24,
              minWidth: 12,
              background: "none",
              border: "none",
              outline: "none",
              boxShadow: "none",
              padding: 0,
              lineHeight: 1,
              zIndex: 10
            }}
            value={tb.text}
            autoFocus
            spellCheck={false}
            onFocus={e => {
              e.target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
              resetScroll();
            }}
            onChange={e => {
              setTextboxes(boxes =>
                boxes.map(b =>
                  b.id === tb.id ? { ...b, text: e.target.value } : b
                )
              );
              setInputWidths(w => ({
                ...w,
                [tb.id]: getTextWidth(e.target.value, tb.fontSize * stageScale, CANVAS_FONT)
              }));
            }}
            onBlur={() => {
              setTextboxes(boxes =>
                boxes.map(b =>
                  b.id === tb.id ? { ...b, isEditing: false } : b
                )
              );
              setEditingTextboxId(null);
              resetScroll();
            }}
            onKeyDown={e => {
              if (e.key === "Enter") {
                setTextboxes(boxes =>
                  boxes.map(b =>
                    b.id === tb.id ? { ...b, isEditing: false } : b
                  )
                );
                setEditingTextboxId(null);
                resetScroll();
              }
            }}
          />
        ) : null
      )}
    </div>
  );
};

export default InfiniteCanvas;