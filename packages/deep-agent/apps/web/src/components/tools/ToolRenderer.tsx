import { z } from "zod";
import {
  useFrontendTool,
  useRenderTool,
  ToolCallStatus,
} from "@copilotkit/react-core/v2";

/**
 * Registers frontend tool renderers with CopilotKit v2.
 * - useRenderTool: render-only for backend tools (no handler)
 */
export function useToolRenderers() {
  // Weather tool
  useRenderTool(
    {
      name: "getWeather",
      parameters: z.object({
        location: z.string().describe("City or location name, e.g. 'Beijing'"),
      }),
      render: (props) => {
        const { status, result } = props;
        const weatherData =
          status === ToolCallStatus.Complete && result
            ? tryParseWeather(result)
            : null;
        return (
          <div className="tool-card weather-card">
            <div className="tool-card-header">
              <span className="tool-icon">🌤️</span>
              <span className="tool-name">Weather</span>
              {status !== ToolCallStatus.Complete && (
                <span className="tool-status">Loading...</span>
              )}
            </div>
            <div className="tool-card-body">
              {weatherData ? (
                <div className="weather-details">
                  <div className="weather-temp">{weatherData.temperature}</div>
                  <div className="weather-grid">
                    <div>
                      <span className="label">Conditions</span>
                      <span className="value">{weatherData.conditions}</span>
                    </div>
                    <div>
                      <span className="label">Humidity</span>
                      <span className="value">{weatherData.humidity}</span>
                    </div>
                    <div>
                      <span className="label">Wind</span>
                      <span className="value">{weatherData.wind}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="weather-placeholder">
                  Fetching weather data...
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    [],
  );

  // Unified skill renderer — renders any skill invoked via use_skill
  useRenderTool(
    {
      name: "use_skill",
      parameters: z.object({
        skill: z.string(),
        args: z.string().optional(),
      }),
      render: ({ parameters, status, result }) => {
        const skillName = parameters.skill || "unknown";
        const isComplete = status === ToolCallStatus.Complete;
        const parsed = isComplete && result ? tryParseSkillResult(result) : null;

        const description = parsed?.description;
        const skillArgs = parsed?.args;
        const instruction = parsed?.instruction;
        const error = parsed?.error;

        // Format args for display (show key=value pairs)
        const argEntries = skillArgs
          ? Object.entries(skillArgs).filter(([, v]) => v !== undefined)
          : [];

        return (
          <div className="tool-card skill-card">
            {/* Header: icon + name + status badge */}
            <div className="tool-card-header">
              <span className="tool-icon">⚡</span>
              <span className="tool-name">{skillName}</span>
              <span className={`skill-badge ${isComplete ? (error ? "skill-badge-error" : "skill-badge-done") : "skill-badge-running"}`}>
                {isComplete ? (error ? "Failed" : "Done") : "Running..."}
              </span>
            </div>

            <div className="tool-card-body">
              {/* Description */}
              {description && (
                <div className="skill-description">{description}</div>
              )}

              {/* Args preview */}
              {argEntries.length > 0 && (
                <div className="skill-args">
                  {argEntries.map(([key, val]) => {
                    const display = String(val);
                    return (
                      <div key={key} className="skill-arg-item">
                        <span className="skill-arg-key">{key}</span>
                        <span className="skill-arg-val">
                          {display.length > 80 ? display.substring(0, 80) + "..." : display}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Error */}
              {error && <div className="skill-error">{error}</div>}

              {/* Instruction result (collapsible preview) */}
              {instruction && !error && (
                <details className="skill-instruction-details">
                  <summary>Instruction loaded ({instruction.length} chars)</summary>
                  <div className="skill-instruction-body">
                    {instruction.length > 500
                      ? instruction.substring(0, 500) + "..."
                      : instruction}
                  </div>
                </details>
              )}

              {/* Loading state */}
              {!isComplete && (
                <div className="skill-placeholder">
                  <span className="skill-spinner" />
                  Loading skill...
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    [],
  );
}

function tryParseWeather(result: string): Record<string, string> | null {
  try {
    return JSON.parse(result);
  } catch {
    return null;
  }
}

function tryParseSkillResult(result: string): {
  skill: string;
  description?: string;
  args?: Record<string, any>;
  instruction?: string;
  error?: string;
} | null {
  try {
    return JSON.parse(result);
  } catch {
    return null;
  }
}
