import React from "react";

interface CanvasControlsProps {
  color: string;
  setColor: (color: string) => void;
  thickness: number;
  setThickness: (thickness: number) => void;
  onClear: () => void;
}

const CanvasControls: React.FC<CanvasControlsProps> = ({
  color,
  setColor,
  thickness,
  setThickness,
  onClear,
}) => {
    return (
        <div>
            {/* UI Elements for Canvas Controls */}
            <label>Color:</label>
            <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
            />
            <label>Thickness:</label>
            <span>{thickness}</span>
            <input
                type="range"
                min="1"
                max="10"
                value={thickness}
                onChange={(e) => setThickness(Number(e.target.value))}
            />
            <button onClick={onClear}>Clear All</button>
        </div>
    );
};

export default CanvasControls;
