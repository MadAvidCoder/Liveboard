import React, { useRef, useState } from "react";
import { Stage, Layer, Line } from "react-konva";

type LineType = { points: number[] };

const INITIAL_SCALE = 1;

const InfiniteCanvas: React.FC = () => {
  const [lines, setLines] = useState<LineType[]>([]);
  const isDrawing = useRef(false);
  const stageRef = useRef<any>(null);

  const [stageScale, setStageScale] = useState(INITIAL_SCALE);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  const [isPanning, setIsPanning] = useState(false);
  const lastPanPos = useRef({ x: 0, y: 0 });

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
    setLines([...lines, { points: [pos.x, pos.y] }]);
  };

  const handleMouseMove = (e: any) => {
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
    const pos = getRelativePointer();
    let lastLine = lines[lines.length - 1];
    if (!lastLine) return;

    lastLine = {
      ...lastLine,
      points: lastLine.points.concat([pos.x, pos.y])
    };
    const newLines = [...lines.slice(0, -1), lastLine];
    setLines(newLines);
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    setIsPanning(false);
  };

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
      <button
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 10
        }}
        onClick={handleClear}
      >
        Clear All
      </button>
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
        onMouseup={handleMouseUp}
        onContextMenu={e => e.evt.preventDefault()}
        style={{ background: "#fff", cursor: isPanning ? "grab" : "crosshair" }}
      >
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke="#222"
              strokeWidth={2}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation="source-over"
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default InfiniteCanvas;