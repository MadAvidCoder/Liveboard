import React, { useRef, useEffect } from "react";

interface DotCanvasOverlayProps {
  stagePos: { x: number; y: number };
  stageScale: number;
  width: number;
  height: number;
  baseDotSpacing?: number;
  dotRadius?: number;
  color?: string;
  opacity?: number;
  minScreenSpacing?: number;
}

const DotCanvasOverlay: React.FC<DotCanvasOverlayProps> = ({
  stagePos,
  stageScale,
  width,
  height,
  baseDotSpacing = 32,
  dotRadius = 1.5,
  color = "#d8e1e4ff",
  opacity = 0.75,
  minScreenSpacing = 16,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;

    let worldSpacing = baseDotSpacing;
    let screenSpacing = worldSpacing * stageScale;
    while (screenSpacing < minScreenSpacing) {
      worldSpacing *= 2;
      screenSpacing = worldSpacing * stageScale;
    }

    const leftWorld = (-stagePos.x) / stageScale;
    const topWorld = (-stagePos.y) / stageScale;
    const rightWorld = (width - stagePos.x) / stageScale;
    const bottomWorld = (height - stagePos.y) / stageScale;

    const startX = Math.floor(leftWorld / worldSpacing) * worldSpacing;
    const endX = Math.ceil(rightWorld / worldSpacing) * worldSpacing;
    const startY = Math.floor(topWorld / worldSpacing) * worldSpacing;
    const endY = Math.ceil(bottomWorld / worldSpacing) * worldSpacing;

    for (let x = startX; x <= endX; x += worldSpacing) {
      for (let y = startY; y <= endY; y += worldSpacing) {
        const sx = (x * stageScale + stagePos.x) * dpr;
        const sy = (y * stageScale + stagePos.y) * dpr;
        ctx.beginPath();
        ctx.arc(sx, sy, dotRadius * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [
    stagePos,
    stageScale,
    width,
    height,
    baseDotSpacing,
    dotRadius,
    color,
    opacity,
    minScreenSpacing,
  ]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
      width={width}
      height={height}
    />
  );
}

export default DotCanvasOverlay;