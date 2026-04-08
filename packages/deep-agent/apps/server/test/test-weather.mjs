const WMO_CODES = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  80: "Slight showers",
  81: "Moderate showers",
  95: "Thunderstorm",
};

async function geocode(location) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  const data = await res.json();
  if (!data.results?.length)
    throw new Error(`Location not found: "${location}"`);
  const r = data.results[0];
  return {
    name: r.name,
    lat: r.latitude,
    lon: r.longitude,
    country: r.country,
  };
}

async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "wind_speed_10m",
      "wind_direction_10m",
      "weather_code",
      "precipitation",
    ].join(","),
    wind_speed_unit: "kmh",
    timezone: "auto",
  });
  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  const res = await fetch(url);
  console.log(
    "FBI WARNING>>>>>>>> ~ test-weather.mjs:49 ~ fetchWeather ~ res:",
    res,
  );
  if (!res.ok) throw new Error(`Weather API failed: ${res.status}`);
  return res.json();
}

for (const city of ["Beijing"]) {
  try {
    const geo = await geocode(city);
    const weather = await fetchWeather(geo.lat, geo.lon);
    const c = weather.current;
    console.log(`[${city}]`, {
      location: `${geo.name}, ${geo.country}`,
      temperature: `${c.temperature_2m}°C`,
      feelsLike: `${c.apparent_temperature}°C`,
      humidity: `${c.relative_humidity_2m}%`,
      wind: `${c.wind_speed_10m} km/h`,
      conditions: WMO_CODES[c.weather_code] ?? `Code ${c.weather_code}`,
      precipitation: `${c.precipitation} mm`,
    });
  } catch (e) {
    console.error(`[${city}] ERROR:`, e.message);
  }
}
