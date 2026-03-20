import { useState, useEffect } from "react";

// 💡 Replace with your key from openweathermap.org/api
const API_KEY = "YOUR_API_KEY_HERE"; 

export const useWeather = () => {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState("metric");

  const fetchWeather = async (searchCity = city) => {
    if (!searchCity) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${searchCity}&appid=${API_KEY}&units=${unit}`
      );
      if (!res.ok) throw new Error("City not found");
      const data = await res.json();
      setWeather({
        name: data.name,
        temp: Math.round(data.main.temp),
        condition: data.weather[0].main,
        icon: data.weather[0].icon,
      });
    } catch (err) {
      setError(err.message);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (weather) fetchWeather();
  }, [unit]);

  return { city, setCity, weather, loading, error, unit, setUnit, fetchWeather };
};