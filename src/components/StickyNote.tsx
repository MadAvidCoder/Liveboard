import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
}) => {
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  function handleMouseDown(e: React.MouseEvent) {
    setDragging(true);
    dragOffset.current = {
      x: e.clientX - (x * stageScale + stagePos.x),
      y: e.clientY - (y * stageScale + stagePos.y),
    };
    e.stopPropagation();
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (dragging) {
      const screenX = e.clientX - dragOffset.current.x;
      const screenY = e.clientY - dragOffset.current.y;
      const x_canvas = (screenX - stagePos.x) / stageScale;
      const y_canvas = (screenY - stagePos.y) / stageScale;
      onMove(id, x_canvas, y_canvas);
    }
  }

  function handleMouseUp() {
    setDragging(false);
  }

  return (
    <div
      style={{
        position: "absolute",
        left: x * stageScale + stagePos.x,
        top: y * stageScale + stagePos.y,
        width: width * stageScale,
        height: height * stageScale,
        background: color,
        borderRadius: 8,
        boxShadow: "0 2px 8px #0003",
        padding: 12,
        userSelect: "auto",
        overflow: "hidden",
        cursor: dragging ? "move" : "grab",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={() => onStartEdit(id)}
    >
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
            overflow: "hidden",
            resize: "none",
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "inherit",
            fontSize: "0.8em",
            color: "#333333",
            userSelect: "none",
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