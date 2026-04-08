import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load .env from the monorepo root (../../.env relative to src/)
config({ path: resolve(__dirname, "../../../.env") });
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { initLLM } from "./services/llm.js";
import { toolRegistry } from "./tools/registry.js";
import { skillRegistry } from "./skills/registry.js";
import { weatherTool } from "./tools/builtin/weather.js";
import { useSkillTool } from "./tools/builtin/use-skill.js";
import { copilotkit } from "./routes/copilotkit.js";
import { sessions } from "./routes/sessions.js";
import { agentRoute } from "./routes/agent.js";

// Initialize LLM
initLLM({
  apiKey: process.env.LLM_API_KEY!,
  baseURL: process.env.LLM_BASE_URL!,
  model: process.env.LLM_MODEL_ID || "qwen-plus",
});

// Discover and register skills from Markdown files
// skill .md files live at apps/server/skills/ (outside src/, not compiled)
const skillsDir = resolve(__dirname, "../skills");
await skillRegistry.discoverFromDirectory(skillsDir);

// Register built-in tools (including the unified use_skill tool)
toolRegistry.register(weatherTool);
toolRegistry.register(useSkillTool);

// Create Hono app
const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Routes
app.route("/api/copilotkit", copilotkit);
app.route("/api/sessions", sessions);
app.route("/api/agent", agentRoute);

// Start server
const port = parseInt(process.env.PORT || "4000", 10);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`🚀 Deep Agent server running at http://localhost:${info.port}`);
  console.log(`   CopilotKit endpoint: http://localhost:${info.port}/api/copilotkit`);
  console.log(`   Sessions API:        http://localhost:${info.port}/api/sessions`);
});
