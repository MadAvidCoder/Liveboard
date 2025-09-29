import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FaTrash } from "react-icons/fa";

const RESIZE_HANDLE_SIZE = 22;
const MIN_WIDTH = 120;
const MIN_HEIGHT = 80;

interface StickyNoteProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  content: string;
  isEditing: boolean;
  stageScale: number;
  stagePos: { x: number; y: number };
  onEdit: (id: string, newContent: string) => void;
  onStartEdit: (id: string) => void;
  onDoneEdit: (id: string) => void;
  onMove: (id: string, newX: number, newY: number) => void;
  onResize: (id: string, newWidth: number, newHeight: number) => void;
  onDelete?: (id: string) => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
};

const StickyNote: React.FC<StickyNoteProps> = ({
  id,
  x,
  y,
  width,
  height,
  color,
  content,
  isEditing,
  stageScale,
  stagePos,
  onEdit,
  onStartEdit,
  onDoneEdit,
  onMove,
  onResize,
  onDelete,
  selected,
  onSelect,
}) => {
  const dragging = useRef(false);
  const resizing = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ width: width, height: height, mouseX: 0, mouseY: 0 });

  function handleDragDown(e: React.MouseEvent) {
    dragging.current = true;
    dragOffset.current = {
      x: e.clientX - (x * stageScale + stagePos.x),
      y: e.clientY - (y * stageScale + stagePos.y),
    };
    onSelect && onSelect(id);
    window.addEventListener("mousemove", handleGlobalDragMove);
    window.addEventListener("mouseup", handleGlobalDragUp);
    e.stopPropagation();
  }

  function handleGlobalDragMove(e: MouseEvent) {
    if (dragging.current) {
      const screenX = e.clientX - dragOffset.current.x;
      const screenY = e.clientY - dragOffset.current.y;
      const x_canvas = (screenX - stagePos.x) / stageScale;
      const y_canvas = (screenY - stagePos.y) / stageScale;
      onMove(id, x_canvas, y_canvas);
    }
  }

  function handleGlobalDragUp() {
    dragging.current = false;
    window.removeEventListener("mousemove", handleGlobalDragMove);
    window.removeEventListener("mouseup", handleGlobalDragUp);
  }

  function handleResizeDown(e: React.MouseEvent) {
    resizing.current = true;
    resizeStart.current = {
      width,
      height,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
    onSelect && onSelect(id);
    window.addEventListener("mousemove", handleGlobalResizeMove);
    window.addEventListener("mouseup", handleGlobalResizeUp);
    e.stopPropagation();
  }

  function handleGlobalResizeMove(e: MouseEvent) {
    if (resizing.current) {
      const dx = (e.clientX - resizeStart.current.mouseX) / stageScale;
      const dy = (e.clientY - resizeStart.current.mouseY) / stageScale;
      onResize(
        id,
        Math.max(MIN_WIDTH, resizeStart.current.width + dx),
        Math.max(MIN_HEIGHT, resizeStart.current.height + dy)
      );
    }
  }

  function handleGlobalResizeUp() {
    resizing.current = false;
    window.removeEventListener("mousemove", handleGlobalResizeMove);
    window.removeEventListener("mouseup", handleGlobalResizeUp);
  }

  React.useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleGlobalDragMove);
      window.removeEventListener("mouseup", handleGlobalDragUp);
      window.removeEventListener("mousemove", handleGlobalResizeMove);
      window.removeEventListener("mouseup", handleGlobalResizeUp);
    };
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        left: x * stageScale + stagePos.x,
        top: y * stageScale + stagePos.y,
        width: width * stageScale,
        height: height * stageScale,
        background: color || "#fffecd",
        borderRadius: 15,
        boxShadow: selected ? "0 4px 18px #d6c97b99" : "0 4px 14px #d6c97b66",
        border: selected ? "2px solid #ffb700" : "1.5px solid #e8e28b",
        padding: "14px 14px 20px 14px",
        zIndex: 1000,
        userSelect: "none",
        cursor: dragging ? "move" : "grab",
        fontFamily: "Inter, Segoe UI, Arial, sans-serif",
        fontSize: "14px",
        color: "#444",
        transition: "box-shadow 0.15s, border 0.13s, background 0.13s",
      }}
      onMouseDown={handleDragDown}
      tabIndex={0}
      onDoubleClick={() => onStartEdit(id)}
    >
      <button
        style={{
          position: "absolute",
          top: 7,
          right: 7,
          border: "none",
          background: "none",
          cursor: "pointer",
          fontSize: "15px",
          color: "#d67b7b",
          zIndex: 10,
        }}
        title="Delete sticky note"
        onClick={e => { e.stopPropagation(); onDelete && onDelete(id); }}
      >
        {FaTrash({size: 14})}
      </button>
      <div
        style={{
          position: "absolute",
          right: 2,
          bottom: 2,
          width: RESIZE_HANDLE_SIZE,
          height: RESIZE_HANDLE_SIZE,
          cursor: "nwse-resize",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseDown={handleResizeDown}
      >
        <svg width="18" height="18">
          <path
            d="M4,16 Q16,16 16,4"
            stroke="#d6c97b"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {isEditing ? (
        <textarea
          value={content}
          autoFocus
          onChange={e => onEdit(id, e.target.value)}
          onBlur={() => onDoneEdit(id)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onDoneEdit(id);
            }
          }}
          style={{
            width: "100%",
            height: "100%",
            resize: "none",
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "inherit",
            fontSize: "0.8em",
            color: "#444",
            overflow: "hidden",
          }}
        />
      ) : (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({node, ...props}) => <h1 style={{fontSize:"1.1em",margin:"0.5em 0"}} {...props} />,
            h2: ({node, ...props}) => <h2 style={{fontSize:"0.95em",margin:"0.4em 0"}} {...props} />,
            h3: ({node, ...props}) => <h3 style={{fontSize:"0.85em",margin:"0.3em 0"}} {...props} />,
            p: ({node, ...props}) => <p style={{fontSize:"0.85em", margin:"0.3em 0"}} {...props} />,
            ul: ({node, ...props}) => <ul style={{paddingLeft:"0.8em"}} {...props} />,
            li: ({node, ...props}) => <li style={{fontSize: "0.85em", marginBottom:"0.33em"}} {...props} />,
            code: ({node, ...props}) => <code style={{background:"#fff6b0",padding:"2px 4px",borderRadius:"5px", fontSize:"0.92em"}} {...props} />,
        }}>
          {content}
        </ReactMarkdown>
      )}
    </div>
  );
};

export default StickyNote;