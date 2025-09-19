import React from "react";
import styles from "./CanvasControls.module.css";

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
        <div className={styles.canvasControls}>
            <button
                className={styles.iconButton}
                title="Pen Color"
                aria-label="Pen Color"
                style={{padding: 0}}
            >
                <input
                className={styles.colorInput}
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                aria-label="Pick color"
                />
            </button>
            <button
                className={styles.iconButton}
                title="Line Thickness"
                aria-label="Line Thickness"
                style={{padding: 0}}
                disabled
                tabIndex={-1}
            >
                <span role="img" aria-label="thickness" style={{fontSize: "1.5em"}}>📏</span>
            </button>
            <input
                className={styles.rangeInput}
                type="range"
                min="1"
                max="10"
                value={thickness}
                onChange={e => setThickness(Number(e.target.value))}
                aria-label="Line thickness"
                style={{marginRight: "1.2em"}}
            />
            <button
                className={styles.iconButton}
                title="Clear All"
                aria-label="Clear All"
                onClick={onClear}
            >
                <span role="img" aria-label="clear" style={{fontSize: "1.45em"}}>🧹</span>
            </button>
            </div>
    );
};

export default CanvasControls;
