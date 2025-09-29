import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Line, Circle, Arrow, Rect, Ellipse, Text } from "react-konva";
import Toolbar from "./Toolbar";
import CanvasTextboxInput from "./CanvasTextboxInput";
import "./InfiniteCanvas.css";
import DotCanvasOverlay from "./DotCanvasOverlay";
import StickyNote from "./StickyNote";
import { KonvaEventObject } from "konva/lib/Node";
import { FaMoon, FaSun } from "react-icons/fa";

interface LiveboardAPI {
  autosavePath: () => string;
  writeFile: (filePath: string, data: string) => void;
  readFile: (filePath: string) => string;
  fileExists: (filePath: string) => boolean;
  mkdir: (dirPath: string) => void;
  dirname: (filePath: string) => string;
}
declare const window: Window & { liveboardAPI: LiveboardAPI };

export type ShapeType = "line" | "arrow" | "circle" | "rectangle";
type Shape = {
  points: number[],
  color: string,
  strokeWidth: number,
  type: ShapeType
};

export type Tool = "pen" | "eraser" | "shape" | "text" | "sticky" | null;

type Textbox = {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  isEditing: boolean;
};

type StickyNoteType = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  content: string;
  isEditing: boolean;
};

const INITIAL_SCALE = 1;

function getCanvasColor(color: string, theme: "light" | "dark") {
  const isBlack = color === "#222" || color === "#000" || color.toLowerCase() === "black";
  const isWhite = color === "#fff" || color.toLowerCase() === "white";
  if (theme === "dark" && isBlack) return "#fff";
  if (theme === "dark" && isWhite) return "#222";
  return color;
}

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
  const themePath = window.liveboardAPI.autosavePath().replace(/\.json$/, ".theme");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const autosavePath = window.liveboardAPI.autosavePath();

  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const [lines, setLines] = useState<Shape[]>([]);

  const [stickyNotes, setStickyNotes] = useState<StickyNoteType[]>([]);

  type UndoAction =
  | { type: "draw" }
  | { type: "erase" }
  | { type: "addText"; textbox: Textbox }
  | { type: "editText"; id: string; from: string; to: string }
  | { type: "removeText"; textbox: Textbox }
  | { type: "addSticky"; sticky: StickyNoteType }
  | { type: "editSticky"; id: string; from: string; to: string }
  | { type: "removeSticky"; sticky: StickyNoteType }
  | { type: "moveSticky"; id: string; from: { x: number, y: number }, to: { x: number, y: number } };

  const [undoneLines, setUndoneLines] = useState<Shape[]>([]);
  const [undoBuffer, setUndoBuffer] = useState<UndoAction[]>([]);
  const [redoBuffer, setRedoBuffer] = useState<UndoAction[]>([]);
  const [eraseBuffer, setEraseBuffer] = useState<Shape[]>([]);
  const [redoEraseBuffer, setRedoEraseBuffer] = useState<Shape[]>([]);

  const [editingInitialText, setEditingInitialText] = useState<string | null>(null);

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
  
  const stageRef = useRef<any>(null);
  
  const lastPanPos = useRef({ x: 0, y: 0 });
  const isDrawing = useRef(false);
  const drawPointerId = useRef<number | null>(null);

  const [autosaveLoaded, setAutosaveLoaded] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);

  function handleDoneEdit(id: string) {
    setStickyNotes(notes =>
      notes.map(n =>
        n.id === id ? { ...n, isEditing: false } : n
      )
    );
  }

  useEffect(() => {
    try {
      setThemeLoaded(true);
      if (window.liveboardAPI.fileExists(themePath)) {
        const fileContent = window.liveboardAPI.readFile(themePath);
        if (fileContent === "light" || fileContent === "dark") {
          setTheme(fileContent);
        }
      }
    } catch (err) {
      console.error("Theme load error:", err);
      setThemeLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!themeLoaded) return;
    document.documentElement.setAttribute("data-theme", theme);
    try {
      window.liveboardAPI.writeFile(themePath, theme);
    } catch (err) {
      console.error("Theme save error:", err);
    }
  }, [theme, themeLoaded]);
  
  const initialPinch = useRef<{
    center: { x: number; y: number },
    stagePos: { x: number; y: number },
    stageScale: number,
    distance: number
  } | null>(null);

  const inputRefs = useRef<{ [id: string]: HTMLInputElement | null }>({});
  const [inputWidths, setInputWidths] = useState<{ [id: string]: number }>({});

  const [eraserRadius, setEraserRadius] = useState(10);
  const clearCanvas = () => {
    setLines([]);
    setTextboxes([]);
    setShapePreview(null);
    setUndoneLines([]);
    setEraseBuffer([]);
    setRedoEraseBuffer([]);
    setUndoBuffer([]);
    setRedoBuffer([]);
    setStickyNotes([]);
  };

  function handleDeleteStickyNote(id: string) {
    setStickyNotes(notes => notes.filter(n => n.id !== id));
  }

  const handleStageStickyMouseDown = (e: any) => {
    if (activeTool !== "sticky") return;
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const x = (pointer.x - stagePos.x) / stageScale;
    const y = (pointer.y - stagePos.y) / stageScale;
    const id = crypto.randomUUID();
    setStickyNotes(notes => [
      ...notes,
      {
        id,
        x,
        y,
        width: 220,
        height: 160,
        color: "#ffe066",
        content: "",
        isEditing: true,
      },
    ]);
  };

  function handleResizeSticky(id: string, newWidth: number, newHeight: number) {
    setStickyNotes(notes =>
      notes.map(n =>
        n.id === id ? { ...n, width: newWidth, height: newHeight } : n
      )
    );
  }

  const handleStageTextMouseDown = (e: any) => {
    if (activeTool !== "text") return;
    const stage = stageRef.current;
    if (!stage) return;

    if (e.target && typeof e.target.getClassName === "function" && e.target.getClassName() === "Text") {
      return;
    }
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const x = (pointer.x - stagePos.x) / stageScale;
    const y = (pointer.y - stagePos.y) / stageScale;

    setTextboxes(prev => {
      let changed = false;
      let newBoxes = prev.map(tb => {
        if (tb.isEditing) {
          if (editingInitialText !== null && editingInitialText !== tb.text) {
            setUndoBuffer(ub => [...ub, {
              type: "editText",
              id: tb.id,
              from: editingInitialText,
              to: tb.text,
            }]);
            setRedoBuffer([]);
            changed = true;
          }
          return { ...tb, isEditing: false };
        }
        return tb;
      });
      if (changed) {
        setEditingTextboxId(null);
        setEditingInitialText(null);
      }
      return newBoxes;
    });

    setEditingTextboxId(null);
    setEditingInitialText(null);
    setTimeout(() => {
      const id = crypto.randomUUID();
      const newTextbox: Textbox = {
        id,
        x,
        y,
        text: "",
        fontSize: currentTextFontSize,
        color: currentColor,
        isEditing: true,
      };
      setTextboxes(textboxes => textboxes.concat([newTextbox]));
      setEditingTextboxId(id);
      setUndoBuffer(prev => [...prev, { type: "addText", textbox: newTextbox }]);
      setRedoBuffer([]);
    }, 0);
  };

  useEffect(() => {
    try {
      if (window.liveboardAPI.fileExists(autosavePath)) {
        const fileContent = window.liveboardAPI.readFile(autosavePath);
        const data = JSON.parse(fileContent);
        setLines(data.lines || []);
        setTextboxes(data.textboxes || []);
        setStickyNotes(data.stickyNotes || []);
        setStageScale(data.stageScale || INITIAL_SCALE);
        setStagePos(data.stagePos || { x: 0, y: 0 });
      }
      setAutosaveLoaded(true);
    } catch (err) {
      console.error("Autosave load error:", err);
      setAutosaveLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!autosaveLoaded) return;
    try {
      window.liveboardAPI.mkdir(window.liveboardAPI.dirname(autosavePath));
      const data = JSON.stringify({ lines, textboxes, stickyNotes, stageScale, stagePos });
      window.liveboardAPI.writeFile(autosavePath, data);
    } catch (err) {
      console.error("Autosave error:", err);
    }
  }, [lines, textboxes, stickyNotes, stageScale, stagePos, autosaveLoaded]);

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
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undoBuffer, redoBuffer, lines, textboxes]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'p') setActiveTool('pen');
      if (e.key === 'e') setActiveTool('eraser');
      if (e.key === 't') setActiveTool('text');
      if (e.key === 's') setActiveTool('shape');
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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

  const toWorld = (pos: { x: number; y: number }) => ({
    x: (pos.x - stagePos.x) / stageScale,
    y: (pos.y - stagePos.y) / stageScale,
  });

  const undo = () => {
    const action = undoBuffer.pop();
    if (!action) return;
    setUndoBuffer([...undoBuffer]);
    switch (action.type) {
      case "erase":
        const lastErased: Shape | undefined = eraseBuffer.pop();
        if (lastErased) {
          setLines(prevLines => [...prevLines, lastErased]);
          setRedoBuffer(prev => [...prev, { type: "erase" }]);
          setRedoEraseBuffer(prev => [...prev, lastErased]);
        }
        setEraseBuffer([...eraseBuffer]);
        break
      case "draw":
        if (lines.length === 0) return;
        setUndoneLines(prevUndoneLines => {
          const updatedUndoneLines = [...prevUndoneLines, lines[lines.length - 1]];
          if (updatedUndoneLines.length > 50) {
            updatedUndoneLines.slice(1);
          }
          return updatedUndoneLines;
        });
        setRedoBuffer(prev => [...prev, { type: "draw" }]);
        setLines(prev => {
          const removed = prev[prev.length - 1];
          return prev.slice(0, -1);
        });
        break;
      case "addText":
        const removedTextbox = textboxes.find(tb => tb.id === action.textbox.id);
        setTextboxes(tbs => tbs.filter(tb => tb.id !== action.textbox.id));
        if (removedTextbox) {
          setRedoBuffer(rb => [...rb, { type: "addText", textbox: removedTextbox }]);
        } else {
          setRedoBuffer(rb => [...rb, action]);
        }
        break;
      case "editText":
        setTextboxes(tbs => tbs.map(tb =>
          tb.id === action.id ? { ...tb, text: action.from } : tb
        ));
        setRedoBuffer(rb => [...rb, action]);
        break;
      case "removeText":
        setTextboxes(tbs => [...tbs, action.textbox]);
        setRedoBuffer(rb => [...rb, action]);
        break;
    }
  };

  const redo = () => {
    const action = redoBuffer.pop();
    if (!action) return;
    setRedoBuffer([...redoBuffer]);
    switch (action.type) {
      case "erase":
        const lastErased = redoEraseBuffer[redoEraseBuffer.length - 1];
        if (!lastErased) return;
        setRedoEraseBuffer(prev => prev.slice(0, -1));
        setLines(prev => prev.filter(line => line !== lastErased));
        setUndoBuffer(prev => [...prev, { type: "erase" }]);
        setEraseBuffer(prev => [...prev, lastErased]);
        break;
      case "draw":
        const lastDrawn = undoneLines[undoneLines.length - 1];
        if (!lastDrawn) return;
        setUndoneLines(prev => prev.slice(0, -1));
        setLines(prev => [...prev, lastDrawn]);
        setUndoBuffer(prev => [...prev, { type: "draw" }]);
        break;
      case "addText":
        setTextboxes(tbs => {
          if (tbs.some(tb => tb.id === action.textbox.id)) return tbs;
          return [...tbs, action.textbox];
        });
        setUndoBuffer(ub => [...ub, action]);
        break;
      case "editText":
        setTextboxes(tbs => tbs.map(tb =>
          tb.id === action.id ? { ...tb, text: action.to } : tb
        ));
        setUndoBuffer(ub => [...ub, action]);
        break;
      case "removeText":
        setTextboxes(tbs => {
          if (!tbs.some(tb => tb.id === action.textbox.id)) return tbs;
          return tbs.filter(tb => tb.id !== action.textbox.id);
        });
        setUndoBuffer(ub => [...ub, action]);
        break;
    }
  };

  const handlePointerDown = (e: any) => {
    if (
      (e.evt.button === 2 ||
        e.evt.ctrlKey ||
        e.evt.metaKey ||
        e.evt.altKey) && !e.evt.shiftKey
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
      setUndoBuffer(prev => [...prev, { type: "draw" }]);
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
        setUndoBuffer(prev => [...prev, ...erasedLines.map((): UndoAction => ({ type: "erase" }))]);
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
      setUndoBuffer(prev => [...prev, { type: "draw" }]);
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
        eraserRadius={eraserRadius}
        setEraserRadius={setEraserRadius}
        clearCanvas={clearCanvas}
        undo={undo}
        redo={redo}
        theme={theme}
        getCanvasColor={getCanvasColor}
      />
      <button
        className="theme-toggle-btn"
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        style={{
          position: "fixed",
          bottom: 22,
          right: 22,
          zIndex: 100,
          background: "var(--surface-glass)",
          color: "var(--on-surface)",
          borderRadius: "50%",
          width: 40,
          height: 40,
          border: "1.5px solid var(--border)",
          boxShadow: "var(--shadow)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          cursor: "pointer",
          transition: "background var(--transition), color var(--transition), border var(--transition)"
        }}
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        {theme === "dark" ? FaSun({size: 22}) : FaMoon({size: 22})}
      </button>
      <DotCanvasOverlay
        stagePos={stagePos}
        stageScale={stageScale}
        width={window.innerWidth}
        height={window.innerHeight}
        baseDotSpacing={32}
        dotRadius={1.5}
        color={theme === "light" ? "#d8e1e4" : "#383a43"}
        opacity={theme === "light" ? 0.75 : 0.31}
        minScreenSpacing={16}
      />
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        ref={stageRef}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        onWheel={handleWheel}
        onMouseDown={activeTool === "sticky" ? handleStageStickyMouseDown : activeTool === "text" ? handleStageTextMouseDown : undefined}
        onPointerDown={activeTool === "text" ? undefined : activeTool === "sticky" ? undefined : handlePointerDown}
        onPointerLeave={handlePointerLeave}
        onPointerMove={handlePointerMove}
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
                    stroke={getCanvasColor(shape.color, theme)}
                    fill={getCanvasColor(shape.color, theme)}
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
                    stroke={getCanvasColor(shape.color, theme)}
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
                    stroke={getCanvasColor(shape.color, theme)}
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
                    stroke={getCanvasColor(shape.color, theme)}
                    strokeWidth={shape.strokeWidth}
                    tension={0.5}
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
                  stroke={getCanvasColor(shapePreview.color, theme)}
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
                  stroke={getCanvasColor(shapePreview.color, theme)}
                  fill={getCanvasColor(shapePreview.color, theme)}
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
                  stroke={getCanvasColor(shapePreview.color, theme)}
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
                  stroke={getCanvasColor(shapePreview.color, theme)}
                  strokeWidth={shapePreview.strokeWidth}
                  globalCompositeOperation="source-over"
                  dash={[10, 5]}
                />
              )}
            </>
          )}
          {activeTool === "eraser" && cursorPos && (
            <Circle
              x={toWorld(cursorPos).x}
              y={toWorld(cursorPos).y}
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
                fill={getCanvasColor(tb.color, theme)}
                fontFamily={CANVAS_FONT}
                listening={true}
                onClick={
                  activeTool === "text"
                    ? (evt) => {
                        evt.cancelBubble = true;
                        setEditingInitialText(tb.text);
                        setTextboxes(boxes =>
                          boxes.map(b =>
                            b.id === tb.id ? { ...b, isEditing: true } : b
                          )
                        );
                        setEditingTextboxId(tb.id);
                      }
                    : undefined
                }
              />
            )
          )}
        </Layer>
      </Stage>
      {(() => {
        const editingTb = textboxes.find(tb => tb.isEditing);
        if (!editingTb) return null;
        return (
          <CanvasTextboxInput
            isEditing={true}
            key={editingTb.id}
            className="canvas-textbox-input"
            style={{
              position: "fixed",
              left: editingTb.x * stageScale + stagePos.x,
              top: editingTb.y * stageScale + stagePos.y - 4 / 24 * editingTb.fontSize * stageScale,
              fontSize: editingTb.fontSize * stageScale,
              color: getCanvasColor(editingTb.color, theme),
              fontFamily: CANVAS_FONT,
              width: Math.max(60, inputWidths[editingTb.id] || 0),
              minWidth: 12,
              background: "transparent",
              border: "none",
              outline: "none",
              boxShadow: "none",
              padding: 0,
              lineHeight: 1,
              zIndex: 10000,  
              }}
            value={editingTb.text}
            spellCheck={false}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setTextboxes(boxes =>
                boxes.map(b =>
                  b.id === editingTb.id ? { ...b, text: e.target.value } : b
                )
              );
              setInputWidths(w => ({
                ...w,
                [editingTb.id]: getTextWidth(e.target.value, editingTb.fontSize * stageScale, CANVAS_FONT)
              }));
            }}
            onBlur={(e) => {
              setTimeout(() => {
                if (document.activeElement !== e.target) {
                  setTextboxes(boxes =>
                    boxes.map(b =>
                      b.id === editingTb.id ? { ...b, isEditing: false } : b
                    )
                  );
                  setEditingTextboxId(null);
                  resetScroll();

                  if (editingInitialText !== null && editingInitialText !== editingTb.text) {
                    setUndoBuffer(prev => [...prev, {
                      type: "editText",
                      id: editingTb.id,
                      from: editingInitialText,
                      to: editingTb.text,
                    }]);
                    setRedoBuffer([]);
                  }
                  setEditingInitialText(null);

                  if (editingInitialText === "" && editingTb.text !== "") {
                    setUndoBuffer(prev =>
                      prev.map(action =>
                        action.type === "addText" && action.textbox.id === editingTb.id
                          ? { ...action, textbox: { ...action.textbox, text: editingTb.text } }
                          : action
                      )
                    );
                  }

                  setEditingInitialText(null);
                }
              }, 0);
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                setTextboxes(boxes =>
                  boxes.map(b =>
                    b.id === editingTb.id ? { ...b, isEditing: false } : b
                  )
                );
                setEditingTextboxId(null);
                resetScroll();
                if (editingInitialText !== null && editingInitialText !== editingTb.text) {
                  setUndoBuffer(prev => [...prev, {
                    type: "editText",
                    id: editingTb.id,
                    from: editingInitialText,
                    to: editingTb.text,
                  }]);
                  setRedoBuffer([]);
                }
                setEditingInitialText(null);
              }
            }}
          />
        );
      })()}
      {stickyNotes.map(note => (
        <StickyNote
          key={note.id}
          {...note}
          stageScale={stageScale}
          stagePos={stagePos}
          onEdit={(id, newContent) =>
            setStickyNotes(notes =>
              notes.map(n => n.id === id ? { ...n, content: newContent } : n)
            )
          }
          onStartEdit={id =>
            setStickyNotes(notes =>
              notes.map(n => n.id === id ? { ...n, isEditing: true } : n)
            )
          }
          onDoneEdit={handleDoneEdit}
          onMove={(id, x, y) =>
            setStickyNotes(notes =>
              notes.map(n => n.id === id ? { ...n, x, y } : n)
            )
          }
          onResize={handleResizeSticky}
          onDelete={handleDeleteStickyNote}
        />
      ))}
    </div>
  );
};

export default InfiniteCanvas;