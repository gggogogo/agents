import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchWeather, parseWeatherResult, getWeather } from "./index.js";

// ── Mock helpers ──────────────────────────────────────────────────────────────

function makeWttrResponse(overrides: Record<string, any> = {}) {
  return {
    current_condition: [
      {
        temp_C: "18",
        FeelsLikeC: "16",
        humidity: "42",
        windspeedKmph: "12",
        winddirDegree: "180",
        weatherDesc: [{ value: "Partly cloudy" }],
        precipMM: "0.0",
        ...overrides,
      },
    ],
    nearest_area: [
      {
        areaName: [{ value: "Beijing" }],
        country: [{ value: "China" }],
      },
    ],
  };
}

function makeFetchMock(status: number, body?: object) {
  return vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body ?? {}),
    } as Response),
  );
}

// ── fetchWeather ──────────────────────────────────────────────────────────────

describe("fetchWeather()", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("返回 wttr.in 原始 JSON 数据", async () => {
    vi.stubGlobal("fetch", makeFetchMock(200, makeWttrResponse()));

    const data = await fetchWeather("Beijing");

    expect(data.current_condition[0].temp_C).toBe("18");
    expect(data.nearest_area[0].country[0].value).toBe("China");
  });

  it("请求 URL 包含城市名和 format=j1", async () => {
    const mockFetch = makeFetchMock(200, makeWttrResponse());
    vi.stubGlobal("fetch", mockFetch);

    await fetchWeather("New York");

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("New%20York");
    expect(calledUrl).toContain("format=j1");
  });

  it("HTTP 失败时抛出错误", async () => {
    vi.stubGlobal("fetch", makeFetchMock(503));

    await expect(fetchWeather("Beijing")).rejects.toThrow(
      "Weather API request failed: 503",
    );
  });

  it("HTTP 502 时抛出错误", async () => {
    vi.stubGlobal("fetch", makeFetchMock(502));

    await expect(fetchWeather("Beijing")).rejects.toThrow(
      "Weather API request failed: 502",
    );
  });
});

// ── parseWeatherResult ────────────────────────────────────────────────────────

describe("parseWeatherResult()", () => {
  it("将原始数据映射为 WeatherResult", () => {
    const result = parseWeatherResult(makeWttrResponse());

    expect(result).toEqual({
      location: "Beijing, China",
      temperature: "18°C",
      feelsLike: "16°C",
      humidity: "42%",
      wind: "12 km/h",
      windDirection: "180°",
      conditions: "Partly cloudy",
      precipitation: "0.0 mm",
    });
  });
});

// ── getWeather ────────────────────────────────────────────────────────────────

describe("getWeather()", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("组合 fetch + parse，返回 WeatherResult", async () => {
    vi.stubGlobal("fetch", makeFetchMock(200, makeWttrResponse()));

    const result = await getWeather("Beijing");

    expect(result.location).toBe("Beijing, China");
    expect(result.temperature).toBe("18°C");
    expect(result.conditions).toBe("Partly cloudy");
  });

  it("fetch 失败时向上抛出错误", async () => {
    vi.stubGlobal("fetch", makeFetchMock(500));

    await expect(getWeather("Beijing")).rejects.toThrow(
      "Weather API request failed: 500",
    );
  });
});
