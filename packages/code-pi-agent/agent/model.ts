
import { createModels, createProvider } from "@earendil-works/pi-ai";
import { openAICompletionsApi } from "@earendil-works/pi-ai/api/openai-completions.lazy";

const AUTH_TOKEN =
  "gpustack_03fb373bcb95da2a_73e036e5a9bd503dd5c9160bb0c91910";

const crsecDeepseekProvider = createProvider({
  id: "crsec-deepseek",
  name: "Deepseek",
  baseUrl: "http://115.190.106.124:8080/v1",
  auth: {
    apiKey: {
      name: "Static bearer token",
      resolve: async () => ({
        auth: {}, // 认证信息通过 model 级 headers 携带
        source: "static token",
      }),
    },
  },
  models: [
    {
      id: "deepseek-v4-flash",
      name: "DeepSeek V4 Flash",
      api: "openai-completions",
      baseUrl: "http://115.190.106.124:8080/v1",
      provider: "crsec-deepseek",
      reasoning: true,
      input: ["text"],
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      cost: { input: 0.14, output: 0.28, cacheRead: 0.0028, cacheWrite: 0 },
      contextWindow: 1000000,
      maxTokens: 384000,
      compat: {
        supportsStore: false,
        supportsDeveloperRole: false,
        maxTokensField: "max_tokens",
        requiresReasoningContentOnAssistantMessages: true,
        thinkingFormat: "deepseek",
      },
      thinkingLevelMap: {
        minimal: null,
        low: "low",
        medium: null,
        high: "high",
        max: "max",
      },
    },
  ],
  api: openAICompletionsApi(),
});

const models = createModels();

// Set the crsec-deepseek provider as the default
models.setProvider(crsecDeepseekProvider);
const found = models.getModel("crsec-deepseek", "deepseek-v4-flash");

// Add the deepseek provider to the models
// models.setProvider(deepseekProvider());
// const found = models.getModel("deepseek", "deepseek-v4-flash");

if (!found) {
  console.log("Model not found");
  throw new Error("Model not found");
}

const model: typeof found = found; // 此时类型已收窄为 Model<Api>，不再含 undefined

export { models };
export default model;
