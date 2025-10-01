import React, { useEffect, useState } from "react";

const pad = (n: number) => n.toString().padStart(2, "0");

const ClockWidget: React.FC = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  return (
    <div className="floating-widget"
      style={{
        background: "rgba(255,255,255,0.75)",
        borderRadius: 8,
        padding: "6px 14px 2px 10px",
        fontFamily: "monospace",
        fontSize: 20,
        boxShadow: "0 1px 6px #0002",
        userSelect: "none",
        color: "#333",
        minWidth: 110,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}
      title={date}
    >
      <span style={{paddingTop: 4, fontSize: 21, fontWeight: 600, letterSpacing: 1}}>
        {hours}:{minutes}:{seconds}
      </span>
      <span style={{paddingTop: 3, paddingBottom: 3, fontSize: 14, color: "#4A4A4A", marginTop: 1}}>
        {date}
      </span>
    </div>
  );
};

export default ClockWidget;