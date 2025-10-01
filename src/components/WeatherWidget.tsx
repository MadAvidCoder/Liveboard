import React, { useEffect, useState } from "react";

const WEATHER_API_KEY = "a240431b6777492fa5b112605250110";

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<string>("");

  function fetchWeather(loc: string) {
    fetch(
      `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(loc)}`
    )
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error.message || "Weather error");
          setWeather(null);
        } else {
          setWeather(data);
          setLocation(data.location?.name || loc);
          setError(null);
        }
      })
      .catch(err => {
        setError(String(err));
        setWeather(null);
      });
  }

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then(res => res.json())
      .then(ipData => {
        if (ipData.city) {
          fetchWeather(ipData.city);
        } else if (ipData.latitude && ipData.longitude) {
          fetchWeather(`${ipData.latitude},${ipData.longitude}`);
        } else {
          fetchWeather("Melbourne");
        }
      })
      .catch(() => fetchWeather("Melbourne"));
  }, []);

  if (error) return <div style={{padding: 8, color: 'red'}}>Weather error: {error}</div>;
  if (!weather) return <div style={{padding: 8}}>Loading weather...</div>;

  const iconUrl =
    weather.current?.condition?.icon
      ? (weather.current.condition.icon.startsWith("http")
          ? weather.current.condition.icon
          : "https:" + weather.current.condition.icon)
      : "";
  const temp = weather.current?.temp_c;
  const desc = weather.current?.condition?.text || "";
  const city = location || weather.location?.name || "";

  return (
    <div style={{
      background: "rgba(255,255,255,0.8)",
      borderRadius: 10,
      padding: "8px 16px",
      boxShadow: "0 2px 8px #0002",
      fontSize: 16,
      display: "flex",
      alignItems: "center"
    }}>
      {iconUrl && (
        <img
          src={iconUrl}
          alt={desc}
          style={{ width: 36, height: 36, marginRight: 8 }}
        />
      )}
      <span style={{fontWeight: 600, marginRight: 8}}>
        {typeof temp === "number" ? Math.round(temp) + "°C" : "--"}
      </span>
      <span style={{color: "#555"}}>{city}</span>
    </div>
  );
};

export default WeatherWidget;