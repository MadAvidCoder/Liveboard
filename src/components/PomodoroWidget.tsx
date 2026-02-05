import React, { useEffect, useRef, useState } from "react";
import { FaPause, FaPlay } from "react-icons/fa";
import { FaArrowsRotate } from "react-icons/fa6";

const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;

const CHIME_URL = "https://cdn.hackclub.com/rescue?url=https://hc-cdn.hel1.your-objectstorage.com/s/v3/bd5677662ec116d25a76fcbd725343aa4e7bd507_notification-bell-sound-376888_audio.mp4";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

const SIZE = 74;
const STROKE = 5;
const RADIUS = (SIZE / 2) - (STROKE / 2);
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const PomodoroWidget: React.FC = () => {
  const [secondsLeft, setSecondsLeft] = useState(Math.round(WORK_MINUTES * 60));
  const [isRunning, setIsRunning] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const totalSeconds = onBreak
    ? Math.round(BREAK_MINUTES * 60)
    : Math.round(WORK_MINUTES * 60);
  const progress = 1 - secondsLeft / totalSeconds;


  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft(sec => {
          if (sec > 0) {
            return sec - 1;
          } else {
            if (audioRef.current) {
              audioRef.current.volume = 0.13; 
              audioRef.current.currentTime = 0;
              audioRef.current.play();
            }
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
  const progressColor = onBreak
    ? "#0db57b"
    : "#4f8cff";

  return (
    <div
      className="floating-widget"
      style={{
        padding: "18px 22px",
        fontSize: 16,
        minWidth: 128,
        textAlign: "center",
        userSelect: "none",
      }}
    >
      <audio ref={audioRef} src={CHIME_URL} preload="auto" />
      <div style={{display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 6}}>
        <div style={{position: "relative", width: SIZE, height: SIZE, marginBottom: 3}}>
          <svg width={SIZE} height={SIZE}>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke="var(--border)"
              strokeWidth={STROKE}
              fill="none"
            />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={progressColor}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              strokeLinecap="round"
              style={{
                transition: "stroke-dashoffset 0.8s cubic-bezier(.77,0,.18,1)",
                filter: "drop-shadow(0 1px 2px #0001)"
              }}
            />
          </svg>
          <div style={{
            position: "absolute",
            left: 0, top: 0, width: SIZE, height: SIZE,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "monospace",
            fontSize: 26,
            fontWeight: 600,
            pointerEvents: "none",
            letterSpacing: 1,
            textShadow: "0 1px 3px var(--surface)",
          }}>
            {pad(minutes)}:{pad(seconds)}
          </div>
        </div>
        <div style={{
          marginTop: 2,
          fontWeight: 600,
          fontSize: 17,
          color: onBreak ? "#0db57b" : "#4f8cff"
        }}>
          {onBreak ? "Break" : "Work"}
        </div>
      </div>
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: 10,
        marginTop: 6,
      }}>
        <button
          className="toolbar-btn"
          onClick={handleStartStop}
          title={isRunning ? "Pause timer" : "Start timer"}
          aria-label={isRunning ? "Pause timer" : "Start timer"}
        >
          {isRunning ? FaPause({size: 17}) : FaPlay({size: 17})}
        </button>
        <button
          className="toolbar-btn"
          onClick={handleReset}
          title="Reset timer"
          aria-label="Reset timer"
        >
          {FaArrowsRotate({size: 17})}
        </button>
      </div>
    </div>
  );
};

export default PomodoroWidget;