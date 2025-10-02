import React, { useEffect, useRef, useState } from "react";
import { FaPause, FaPlay } from "react-icons/fa";
import { FaArrowsRotate } from "react-icons/fa6";

const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

const PomodoroWidget: React.FC = () => {
  const [secondsLeft, setSecondsLeft] = useState(Math.round(WORK_MINUTES * 60));
  const [isRunning, setIsRunning] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft(sec => {
          if (sec > 0) {
            return sec - 1;
          } else {
            if (onBreak) {
              setOnBreak(false);
              return Math.round(WORK_MINUTES * 60);
            } else {
              setOnBreak(true);
              return Math.round(BREAK_MINUTES * 60);
            }
          }
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, onBreak]);

  function handleReset() {
    setIsRunning(false);
    setOnBreak(false);
    setSecondsLeft(Math.round(WORK_MINUTES * 60));
  }

  function handleStartStop() {
    setIsRunning(running => !running);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div
      className="floating-widget"
      style={{
        padding: "12px 18px 10px 18px",
        fontSize: 16,
        minWidth: 116,
        textAlign: "center",
        userSelect: "none"
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 1 }}>
        {onBreak ? "Break" : "Work"}
      </div>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 26,
          letterSpacing: 1,
          marginBottom: 6
        }}
      >
        {pad(minutes)}:{pad(seconds)}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
        <button
          onClick={handleStartStop}
          className="pomodoro-btn"
        >
          {isRunning ? FaPause({size: 14}) : FaPlay({size: 14})}
        </button>
        <button
          onClick={handleReset}
          className="pomodoro-btn"
        >
          {FaArrowsRotate({size: 14})}
        </button>
      </div>
    </div>
  );
};

export default PomodoroWidget;