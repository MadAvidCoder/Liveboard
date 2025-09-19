import React from "react";
import { Group, Circle } from "react-konva";

interface DotsBackgroundProps {
  width: number;
  height: number;
  stagePos: { x: number; y: number };
  stageScale: number;
  dotSpacing?: number;
  dotRadius?: number;
  color?: string;
  opacity?: number;
}

const DotsBackground: React.FC<DotsBackgroundProps> = ({
  width,
  height,
  stagePos,
  stageScale,
  dotSpacing = 32,
  dotRadius = 1.5,
  color = "#cfd8dc",
  opacity = 0.4,
}) => {
  const leftWorld = (-stagePos.x) / stageScale;
  const topWorld = (-stagePos.y) / stageScale;
  const rightWorld = (width - stagePos.x) / stageScale;
  const bottomWorld = (height - stagePos.y) / stageScale;

  const startX = Math.floor(leftWorld / dotSpacing) * dotSpacing;
  const startY = Math.floor(topWorld / dotSpacing) * dotSpacing;

  const dots = [];
  for ( let x = startX; x < rightWorld; x += dotSpacing ) {
    for ( let y = startY; y < bottomWorld; y += dotSpacing ) {
      const screenX = x * stageScale + stagePos.x;
      const screenY = y * stageScale + stagePos.y;
      dots.push(
        <Circle
          key={`${x},${y}`}
          x={screenX}
          y={screenY}
          radius={dotRadius}
          fill={color}
          opacity={opacity}
          listening={false}
        />
      );
    }
  }

  return <Group listening={false}>{dots}</Group>;
};

export default DotsBackground;