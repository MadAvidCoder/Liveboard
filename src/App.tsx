import React from "react";
import InfiniteCanvas from "./components/InfiniteCanvas";
import WeatherWidget from "./components/WeatherWidget";
import ClockWidget from "./components/ClockWidget";
import PomodoroWidget from "./components/PomodoroWidget";
import "./FloatingWidget.css";

function App() {
  return (
    <>
      <InfiniteCanvas />
      <div style={{ position: "fixed", top: 16, left: 16, zIndex: 2000 }}>
        <ClockWidget />
      </div>
      <div style={{ position: "fixed", bottom: 16, left: 16, zIndex: 2000 }}>
        <WeatherWidget />
      </div>
      <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 2000 }}>
        <PomodoroWidget />
      </div>
    </>
  );
}

export default App;