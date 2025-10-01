import React from "react";
import InfiniteCanvas from "./components/InfiniteCanvas";
import WeatherWidget from "./components/WeatherWidget";

function App() {
  return (
    <>
      <InfiniteCanvas />
      <div style={{ position: "fixed", top: 16, left: 16, zIndex: 2000 }}>
        <WeatherWidget />
      </div>
    </>
  );
}

export default App;