# AG-UI / CopilotKit 包关系与架构文档

## 1. 包职责总览

### AG-UI 协议层（开放标准）

| 包 | 职责 |
|---|------|
| **@ag-ui/core** | 协议核心：定义 `EventType`、`BaseEvent`、`Message`、`RunAgentInput`、`State` 等 Zod Schema 和 TypeScript 类型。依赖 `zod` + `rxjs` |
| **@ag-ui/proto** | Protobuf 编码：将 AG-UI 事件编码/解码为 Protocol Buffers 二进制格式。依赖 `@bufbuild/protobuf` + `@ag-ui/core` |
| **@ag-ui/encoder** | 事件编码器：`EventEncoder` 类，负责将 AG-UI BaseEvent 序列化为传输格式（SSE text 或 proto 二进制）。依赖 `@ag-ui/core` + `@ag-ui/proto` |
| **@ag-ui/client** | 客户端 SDK：提供 `AbstractAgent`、`HttpAgent`、`Middleware`、`AgentSubscriber`、SSE/Proto 流解析等。这是面向开发者的主入口包。依赖 `@ag-ui/core` + `@ag-ui/encoder` + `@ag-ui/proto` |

### CopilotKit 层（产品框架）

| 包 | 职责 |
|---|------|
| **@copilotkit/shared** | 共享工具：telemetry、日志、GraphQL schema 等。peer 依赖 `@ag-ui/core` |
| **@copilotkit/runtime** | 后端运行时：`CopilotRuntime`（agent 注册/路由）、`copilotRuntimeNodeHttpEndpoint`（HTTP 适配器）、`ExperimentalEmptyAdapter`（空 LLM 适配器）、内置 Hono 应用。依赖 `@ag-ui/client` + `@ag-ui/core` + `hono` |
| **@copilotkit/react-core** | React 核心：`<CopilotKit>` Provider、`useAgent()`、`useCopilotAction()`、`useCoAgent()` 等 hooks。依赖 `@ag-ui/client` + `@copilotkit/shared` |
| **@copilotkit/react-ui** | React UI：`<CopilotSidebar>`、`<CopilotChat>`、`<CopilotPopup>` 等预制组件 + 样式。依赖 `@copilotkit/react-core` + `@copilotkit/shared` |

---

## 2. 关键符号（Symbol）来源

| Symbol | 来源包 | 说明 |
|--------|--------|------|
| `AbstractAgent` | `@ag-ui/client` | Agent 抽象基类，定义 `run(input): Observable<BaseEvent>` 接口 |
| `HttpAgent` | `@ag-ui/client` | `AbstractAgent` 的 HTTP 实现，POST JSON body → 接收 SSE 事件流 |
| `AgentSubscriber` | `@ag-ui/client` | 事件订阅接口，定义 `onTextMessageContentEvent`、`onToolCallStartEvent` 等回调 |
| `EventType` | `@ag-ui/core`（通过 `@ag-ui/client` 重导出） | 事件类型枚举：`RUN_STARTED`、`TEXT_MESSAGE_START`、`TOOL_CALL_START` 等 |
| `BaseEvent` | `@ag-ui/core`（通过 `@ag-ui/client` 重导出） | 所有事件的基类型（Zod infer） |
| `RunAgentInput` | `@ag-ui/core`（通过 `@ag-ui/client` 重导出） | Agent 运行输入：messages、tools、context、threadId、runId 等 |
| `CopilotRuntime` | `@copilotkit/runtime` | 后端运行时类。接收 `agents` map，处理路由、middleware、agent 发现（`/info`） |
| `ExperimentalEmptyAdapter` | `@copilotkit/runtime` | 空 ServiceAdapter，当仅使用 AG-UI agent（不使用内置 LLM）时使用 |
| `copilotRuntimeNodeHttpEndpoint` | `@copilotkit/runtime` | Node.js HTTP 适配函数。内部创建 Hono app，处理 Request → SSE Response |

---

## 3. 包依赖关系图

```
@ag-ui/core ◄─────────────────────────────────────────┐
  │  (EventType, BaseEvent, Message, RunAgentInput)    │
  │                                                     │
  ├──► @ag-ui/proto                                     │
  │      │  (protobuf encode/decode)                    │
  │      │                                              │
  │      ▼                                              │
  ├──► @ag-ui/encoder                                   │
  │      │  (EventEncoder: event → SSE/proto)           │
  │      │                                              │
  │      ▼                                              │
  └──► @ag-ui/client ◄─────────────────────┐            │
         │  (AbstractAgent, HttpAgent,      │            │
         │   AgentSubscriber, Middleware)    │            │
         │                                  │            │
         ▼                                  │            │
    @copilotkit/runtime ────────────────────┘            │
         │  (CopilotRuntime,                             │
         │   copilotRuntimeNodeHttpEndpoint,             │
         │   ExperimentalEmptyAdapter)                   │
         │  内置 hono + @hono/node-server               │
         │                                               │
         │  peer: @copilotkit/shared ──────► @ag-ui/core ┘
         │
    @copilotkit/react-core ──► @ag-ui/client
         │  (<CopilotKit>, useAgent(),
         │   useCopilotAction(), useCoAgent())
         │
         ▼
    @copilotkit/react-ui
         │  (<CopilotSidebar>, <CopilotChat>,
         │   <CopilotPopup>, styles.css)
```

---

## 4. 当前项目架构图

### 4.1 整体分层

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (React)                        │
│                                                             │
│  @copilotkit/react-ui    @copilotkit/react-core             │
│  ┌─────────────────┐    ┌──────────────────────────┐        │
│  │ <CopilotChat/>  │    │ <CopilotKit> Provider    │        │
│  │                 │    │ useSessions() hook        │        │
│  └────────┬────────┘    │ useCopilotAction() tools  │        │
│           │             └──────────┬───────────────┘        │
│           └────────┬───────────────┘                        │
│                    │                                        │
│    SessionList ◄───┤  (localStorage + API)                  │
│    ToolRenderer    │                                        │
└────────────────────┼────────────────────────────────────────┘
                     │ HTTP/SSE (via Vite proxy :5173→:4000)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Hono Server (:4000)                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Routes                                                │   │
│  │                                                       │   │
│  │  /api/copilotkit/* ── CopilotRuntime ──┐              │   │
│  │    (copilotRuntimeNodeHttpEndpoint)     │              │   │
│  │                                         │              │   │
│  │  /api/agent        ── Direct AG-UI ─────┤              │   │
│  │    (SSE streaming)                      │              │   │
│  │                                         ▼              │   │
│  │  /api/sessions     ── Session CRUD   ChatAgent         │   │
│  │                                         │              │   │
│  └─────────────────────────────────────────┼──────────────┘   │
│                                            │                  │
│  ┌─────────────────────────────────────────┼──────────────┐   │
│  │ Agent Layer                             │              │   │
│  │                                         ▼              │   │
│  │  BaseAgent (extends AbstractAgent)                     │   │
│  │     └── ChatAgent                                      │   │
│  │           │  run(input) → Observable<BaseEvent>         │   │
│  │           │  LLM loop: call → tool_call → result → ... │   │
│  │           │                                            │   │
│  └───────────┼────────────────────────────────────────────┘   │
│              │                                                │
│  ┌───────────┼────────────────────────────────────────────┐   │
│  │ Service Layer                                          │   │
│  │           │                                            │   │
│  │  ┌───────┴────────┐  ┌──────────┐  ┌───────────────┐  │   │
│  │  │ LLM Service    │  │ Tool     │  │ Skill         │  │   │
│  │  │ (OpenAI compat)│  │ Registry │  │ Registry      │  │   │
│  │  │ dashscope/     │  │          │  │               │  │   │
│  │  │ qwen-plus      │  │ weather  │  │ summarize     │  │   │
│  │  └────────────────┘  └──────────┘  └───────────────┘  │   │
│  │                                                        │   │
│  │  SessionStore (Map<threadId, messages>)                │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
            dashscope API (LLM)
```

### 4.2 请求流程

**CopilotKit 前端路径**（生产路径）：

```
Browser                         Hono Server                      LLM
  │                                │                              │
  │ POST /api/copilotkit           │                              │
  │ (CopilotKit React 自动发起)    │                              │
  ├───────────────────────────────►│                              │
  │                                │ copilotRuntimeNodeHttpEndpoint│
  │                                │  → CopilotRuntime             │
  │                                │  → 路由到 "default" agent     │
  │                                │  → ChatAgent.run()            │
  │                                │         │                     │
  │                                │         ├──stream──────────►  │
  │                                │         │  chat completion    │
  │                                │         │◄────chunks──────── │
  │                                │         │                     │
  │                                │         │ (if tool_call)      │
  │                                │         ├──► ToolRegistry     │
  │                                │         │◄── result           │
  │                                │         │                     │
  │                                │         ├──stream──────────►  │
  │                                │         │◄────chunks──────── │
  │                                │                              │
  │ ◄─── SSE: AG-UI events ───────│                              │
  │  TEXT_MESSAGE_START            │                              │
  │  TEXT_MESSAGE_CONTENT (delta)  │                              │
  │  TOOL_CALL_START               │                              │
  │  TOOL_CALL_ARGS                │                              │
  │  TOOL_CALL_END                 │                              │
  │  TOOL_CALL_RESULT              │                              │
  │  TEXT_MESSAGE_END              │                              │
  │  RUN_FINISHED                  │                              │
```

**HttpAgent 直连路径**（测试/独立客户端）：

```
HttpAgent Client               Hono Server
  │                                │
  │ POST /api/agent                │
  │ body: RunAgentInput (JSON)     │
  ├───────────────────────────────►│
  │                                │ → ChatAgent.run()
  │                                │ → same LLM loop
  │ ◄─── SSE: AG-UI events ───────│
  │  (identical event stream)      │
```

### 4.3 两条路径的区别

| 特性 | `/api/copilotkit` (CopilotRuntime) | `/api/agent` (Direct AG-UI) |
|------|------|------|
| 客户端 | CopilotKit React 组件 | `HttpAgent` / 任意 HTTP 客户端 |
| 协议层 | CopilotKit 封装的 AG-UI | 原生 AG-UI SSE |
| Agent 发现 | 自动（`/info` 端点） | 手动指定 |
| Middleware | 支持（A2UI、MCP 等） | 无 |
| 前端工具 | `useCopilotAction` 自动注入 | 需手动传 `tools` |
| 认证 | CopilotRuntime 默认提供 | 需自行实现 |
| 适用场景 | Web 前端（生产） | API 测试、CLI、其他客户端 |
