import type { SessionInfo } from "../types";

interface SessionItemProps {
  session: SessionInfo;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

export function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: SessionItemProps) {
  const handleDoubleClick = () => {
    const newTitle = prompt("Rename session:", session.title);
    if (newTitle && newTitle.trim()) {
      onRename(session.id, newTitle.trim());
    }
  };

  return (
    <div
      className={`session-item ${isActive ? "active" : ""}`}
      onClick={() => onSelect(session.id)}
      onDoubleClick={handleDoubleClick}
    >
      <div className="session-item-content">
        <span className="session-title">{session.title}</span>
        <span className="session-meta">
          {new Date(session.createdAt).toLocaleDateString()}
        </span>
      </div>
      <button
        className="session-delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(session.id);
        }}
        title="Delete session"
      >
        ×
      </button>
    </div>
  );
}
