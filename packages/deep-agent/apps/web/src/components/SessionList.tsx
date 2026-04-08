import type { SessionInfo } from "../types";
import { SessionItem } from "./SessionItem";

interface SessionListProps {
  sessions: SessionInfo[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onNew: () => void;
}

export function SessionList({
  sessions,
  activeSessionId,
  onSelect,
  onDelete,
  onRename,
  onNew,
}: SessionListProps) {
  return (
    <div className="session-list">
      <div className="session-list-header">
        <h2>Deep Agent</h2>
        <button className="new-session-btn" onClick={onNew} title="New Chat">
          +
        </button>
      </div>
      <div className="session-list-items">
        {sessions.length === 0 ? (
          <div className="session-empty">No sessions yet</div>
        ) : (
          sessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              onSelect={onSelect}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))
        )}
      </div>
    </div>
  );
}
