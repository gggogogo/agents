import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { fetchWeather, parseWeatherResult } from "@deep-agent/weather-client";

export const getWeatherTool = tool(
  async ({ location }) => {
    const data = await fetchWeather(location);
    return JSON.stringify(parseWeatherResult(data));
  },
  {
    name: "getWeather",
    description:
      "Get the current real-time weather for a given city or location. Returns temperature, humidity, wind speed and conditions.",
    schema: z.object({
      location: z.string().describe("The city or location name to get weather for, e.g. 'Beijing', 'London', 'New York'"),
    }),
  }
);

export const tools = [getWeatherTool];


