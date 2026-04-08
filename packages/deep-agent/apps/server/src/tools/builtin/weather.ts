import { z } from "zod";
import type { ToolDefinition } from "../types.js";
import { fetchWeather, parseWeatherResult } from "@deep-agent/weather-client";

export { fetchWeather } from "@deep-agent/weather-client";

export const weatherTool: ToolDefinition = {
  name: "getWeather",
  description:
    "Get the current real-time weather for a given city or location. Returns temperature, humidity, wind speed and conditions.",
  parameters: z.object({
    location: z
      .string()
      .describe(
        "The city or location name to get weather for, e.g. 'Beijing', 'London', 'New York'",
      ),
  }),
  handler: async (args) => {
    const data = await fetchWeather(args.location);
    return JSON.stringify(parseWeatherResult(data));
  },
};

