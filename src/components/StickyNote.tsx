import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FaTrash, FaThumbtack } from "react-icons/fa";

const RESIZE_HANDLE_SIZE = 22;
const MIN_WIDTH = 120;
const MIN_HEIGHT = 80;

function getStickyBorderColor(color: string) {
  const map: Record<string, string> = {
    "#ffe066": "#fff6b0", // yellow
    "#cce3fa": "#eaf4fb", // blue
    "#ffd6e0": "#fff1f6", // pink
    "#b7e4c7": "#e6f7ed", // green
    "#f6d6ae": "#faecd6", // beige
    "#cccccc": "#eaeaea", // gray
  };
  return map[color] || "#f0f0f0";
}

interface StickyNoteProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  content: string;
  isEditingTitle: boolean;
  isEditingBody: boolean;
  stageScale: number;
  stagePos: { x: number; y: number };
  onEdit: (id: string, newContent: string) => void;
  onStartEdit: (id: string, initialContent: string) => void;
  onDoneEdit: (id: string, finalEdit: string) => void;
  onStartMove: (id: string, x: number, y: number) => void;
  onMove: (id: string, newX: number, newY: number) => void;
  onDoneMove: (id: string, newX: number, newY: number) => void;
  onResize: (id: string, newWidth: number, newHeight: number) => void;
  onDelete: (id: string) => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onToggleLock: (id: string) => void;
  title: string;
  onEditTitle: (id: string, newTitle: string) => void;
  onStartEditTitle: (id: string) => void;
  onDoneEditTitle: (id: string, finalTitle: string) => void;
  locked: boolean;
};

const StickyNote: React.FC<StickyNoteProps> = ({
  id,
  x,
  y,
  width,
  height,
  color,
  content,
  isEditingTitle,
  isEditingBody,
  stageScale,
  stagePos,
  onEdit,
  onStartEdit,
  onDoneEdit,
  onStartMove,
  onMove,
  onDoneMove,
  onResize,
  onDelete,
  selected,
  onSelect,
  onToggleLock,
  title,
  onEditTitle,
  onStartEditTitle,
  onDoneEditTitle,
  locked,
}) => {
  const dragging = useRef(false);
  const resizing = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ width: width, height: height, mouseX: 0, mouseY: 0 });


  function handleDragDown(e: React.MouseEvent) {
    if (locked) return;
    dragging.current = true;
    dragOffset.current = {
      x: e.clientX - (x * stageScale + stagePos.x),
      y: e.clientY - (y * stageScale + stagePos.y),
    };
    onSelect && onSelect(id);
    onStartMove(id, x, y);
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

  function handleGlobalDragUp(e: MouseEvent) {
    if (dragging.current) {
      const screenX = e.clientX - dragOffset.current.x;
      const screenY = e.clientY - dragOffset.current.y;
      const x_canvas = (screenX - stagePos.x) / stageScale;
      const y_canvas = (screenY - stagePos.y) / stageScale;
      onDoneMove(id, x_canvas, y_canvas);
    }
    dragging.current = false;
    window.removeEventListener("mousemove", handleGlobalDragMove);
    window.removeEventListener("mouseup", handleGlobalDragUp);
  }

  function handleResizeDown(e: React.MouseEvent) {
    if (locked) return;
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
        transform: `translate3d(0,0,0)`,
        left: x * stageScale + stagePos.x,
        top: y * stageScale + stagePos.y,
        overflow: "hidden",
        width: width * stageScale,
        height: height * stageScale,
        background: color,
        borderRadius: 15,
        boxShadow: selected
          ? `0 4px 18px ${color}99`
          : `0 4px 14px ${color}66`,
        border: selected
          ? `2px solid ${getStickyBorderColor(color)}`
          : `1px solid ${getStickyBorderColor(color)}`,
        padding: "14px 14px 20px 14px",
        zIndex: locked ? 1200 : 1000,
        userSelect: "none",
        cursor: locked ? "default" : dragging.current ? "move" : "grab",
        fontFamily: "Inter, Segoe UI, Arial, sans-serif",
        fontSize: "14px",
        color: "#444",
        transition: "box-shadow 0.15s, border 0.13s, background 0.13s",
      }}
      onMouseDown={handleDragDown}
      tabIndex={0}
      onClick={e => {
        e.stopPropagation();
        if (!locked && !isEditingBody && !isEditingTitle) onStartEdit(id, content);
      }}
    >
      <button
        style={{
          position: "absolute",
          top: 9,
          left: 9,
          border: "none",
          background: "none",
          cursor: "pointer",
          fontSize: "16px",
          color: locked ? "#0f68e4ff" : "#88888F",
          zIndex: 10,
          padding: 0,
          margin: 0,
          lineHeight: 1,
        }}
        title={locked ? "Unpin sticky note" : "Pin sticky note"}
        onClick={e => {
          e.stopPropagation();
          onToggleLock && onToggleLock(id);
        }}
      >
        <span style={{display: "inline-block", transform: "rotate(-34deg)"}}>
          {FaThumbtack({size: 16})}
        </span>
      </button>
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
          top: 5,
          left: 29,
          right: 32,
          height: 22,
          display: "flex",
          alignItems: "center",
          background: "transparent",
          zIndex: 11,
        }}
        onClick={e => {
          e.stopPropagation();
          if (!locked && !isEditingTitle) onStartEditTitle(id);
        }}
      >
        {isEditingTitle && !locked ? (
          <input
            type="text"
            value={title}
            autoFocus
            onBlur={() => onDoneEditTitle(id, title)}
            onKeyDown={e => {
              if (e.key === "Enter") onDoneEditTitle(id, title);
            }}
            onChange={e => onEditTitle(id, e.target.value)}
            placeholder="Untitled"
            style={{
              width: "100%",
              border: "none",
              background: "transparent",
              fontWeight: "bold",
              fontSize: "1em",
              color: "#444",
              outline: "none",
              pointerEvents: "auto"
            }}
          />
        ) : (
          <span
            style={{
              fontWeight: "bold",
              fontSize: "1em",
              color: "#444",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              pointerEvents: "auto"
            }}
            title={title}
          >
            {title || <span style={{opacity:0.5}}>Untitled</span>}
          </span>
        )}
      </div>
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
            stroke={getStickyBorderColor(color)}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {isEditingBody ? (
        <textarea
          disabled={locked}
          value={content}
          autoFocus
          onChange={e => onEdit(id, e.target.value)}
          onBlur={() => onDoneEdit(id, content)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onDoneEdit(id, content);
            }
          }}
          style={{
            paddingTop: "16px",
            width: "100%",
            height: "100%",
            resize: "none",
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "inherit",
            fontSize: "0.85em",
            color: "#444",
            overflow: "hidden",
          }}
        />
      ) : (
        <div
          style={{
            marginTop: "18px",
            cursor: locked ? "default" : "text",
            pointerEvents: "auto",
          }}
          onClick={e => {
            e.stopPropagation(); 
            if (!locked && !isEditingBody && !isEditingTitle) onStartEdit(id, content);
          }}
        >
          <div style={{ pointerEvents: "none" }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({node, ...props}) => <h1 style={{fontSize:"1.1em",margin:"0.5em 0"}} {...props} />,
                h2: ({node, ...props}) => <h2 style={{fontSize:"0.95em",margin:"0.4em 0"}} {...props} />,
                h3: ({node, ...props}) => <h3 style={{fontSize:"0.875em",margin:"0.3em 0"}} {...props} />,
                p: ({node, ...props}) => <p style={{fontSize:"0.875em", margin:"0.3em 0"}} {...props} />,
                ul: ({node, ...props}) => <ul style={{paddingLeft:"0.8em"}} {...props} />,
                li: ({node, ...props}) => <li style={{fontSize: "0.875em", marginBottom:"0.33em"}} {...props} />,
                code: ({node, ...props}) => <code style={{background:"#fff6b0",padding:"2px 4px",borderRadius:"5px", fontSize:"0.92em"}} {...props} />,
            }}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export default StickyNote;