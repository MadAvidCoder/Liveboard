import React, { useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface CanvasTextboxInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    isEditing: boolean;
}

let ignoreNextBlur = false;

const CanvasTextboxInput: React.FC<CanvasTextboxInputProps> = ({ isEditing, ...props }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isEditing && inputRef.current) {
      ignoreNextBlur = true; // Ignore the next blur
      inputRef.current.focus();
      setTimeout(() => {
        ignoreNextBlur = false; // After 200ms, allow blur again
      }, 200);
    }
  }, [isEditing]);

  return createPortal(
    <input
      ref={inputRef}
      {...props}
      onBlur={e => {
        if (ignoreNextBlur) return; // Ignore the initial unwanted blur
        props.onBlur && props.onBlur(e);
      }}
    />,
    document.body
  );
};

export default CanvasTextboxInput;