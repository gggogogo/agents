import { useState } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import { SessionList } from "./SessionList";
import { useToolRenderers } from "./tools/ToolRenderer";
import { useSessions } from "../hooks/useSessions";

type AgentMode = "default" | "langgraph";

function ChatArea() {
  useToolRenderers();
  return (
    <CopilotChat
      labels={{
        chatInputPlaceholder: "Type a message...",
      }}
      className="chat-container"
    />
  );
}

export function ChatPage() {
  const [agentMode, setAgentMode] = useState<AgentMode>("default");
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createNewSession,
    removeSession,
    renameSession,
    loading,
  } = useSessions();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <aside className="sidebar">
        <SessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={setActiveSessionId}
          onDelete={removeSession}
          onRename={renameSession}
          onNew={createNewSession}
        />
      </aside>
      <main className="chat-main">
        {activeSessionId ? (
          <>
            <div className="agent-switcher">
              <button
                className={agentMode === "default" ? "active" : ""}
                onClick={() => setAgentMode("default")}
              >
                Chat Agent
              </button>
              <button
                className={agentMode === "langgraph" ? "active" : ""}
                onClick={() => setAgentMode("langgraph")}
              >
                LangGraph Agent
              </button>
            </div>
            <CopilotKit
              key={`${activeSessionId}-${agentMode}`}
              runtimeUrl="/api/copilotkit"
              agent={agentMode === "langgraph" ? "langgraph" : undefined}
            >
              <ChatArea />
            </CopilotKit>
          </>
        ) : (
          <div className="no-session">
            <div className="no-session-icon">💬</div>
            <p>Start a conversation to begin</p>
            <button onClick={createNewSession}>New Chat</button>
          </div>
        )}
      </main>
    </div>
  );
}

