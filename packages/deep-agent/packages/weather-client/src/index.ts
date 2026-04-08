export interface WeatherResult {
  location: string;
  temperature: string;
  feelsLike: string;
  humidity: string;
  wind: string;
  windDirection: string;
  conditions: string;
  precipitation: string;
}

// https://wttr.in/:location?format=j1
export async function fetchWeather(location: string): Promise<any> {
  const url = `https://wttr.in/${encodeURIComponent(location)}?format=j1`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!res.ok) throw new Error(`Weather API request failed: ${res.status}`);
  return res.json();
}

export function parseWeatherResult(data: any): WeatherResult {
  const c = data.current_condition[0];
  const area = data.nearest_area[0];
  return {
    location: `${area.areaName[0].value}, ${area.country[0].value}`,
    temperature: `${c.temp_C}°C`,
    feelsLike: `${c.FeelsLikeC}°C`,
    humidity: `${c.humidity}%`,
    wind: `${c.windspeedKmph} km/h`,
    windDirection: `${c.winddirDegree}°`,
    conditions: c.weatherDesc[0].value,
    precipitation: `${c.precipMM} mm`,
  };
}

export async function getWeather(location: string): Promise<WeatherResult> {
  const data = await fetchWeather(location);
  return parseWeatherResult(data);
}
