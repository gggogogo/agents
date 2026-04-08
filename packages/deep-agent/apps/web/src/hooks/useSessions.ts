import { useState, useEffect, useCallback } from "react";
import type { SessionInfo } from "../types";
import * as api from "../lib/api";

const STORAGE_KEY = "deep-agent-sessions";

function generateId(): string {
  return crypto.randomUUID();
}

function loadSessionsFromStorage(): SessionInfo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessionsToStorage(sessions: SessionInfo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function useSessions() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load sessions on mount
  useEffect(() => {
    const init = async () => {
      try {
        // Try to get from server first
        const serverSessions = await api.fetchSessions();
        if (serverSessions.length > 0) {
          setSessions(serverSessions);
          saveSessionsToStorage(serverSessions);
          setActiveSessionId(serverSessions[0].id);
        } else {
          // Fall back to local storage
          const local = loadSessionsFromStorage();
          if (local.length > 0) {
            setSessions(local);
            setActiveSessionId(local[0].id);
          } else {
            // Create first session
            const id = generateId();
            const session = await api.createSession(id, "New Chat");
            const newSession: SessionInfo = {
              ...session,
              updatedAt: session.createdAt,
              messageCount: 0,
            };
            setSessions([newSession]);
            saveSessionsToStorage([newSession]);
            setActiveSessionId(id);
          }
        }
      } catch {
        // If server is down, use local storage
        const local = loadSessionsFromStorage();
        if (local.length > 0) {
          setSessions(local);
          setActiveSessionId(local[0].id);
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const createNewSession = useCallback(async () => {
    const id = generateId();
    try {
      const session = await api.createSession(id, "New Chat");
      const newSession: SessionInfo = {
        ...session,
        updatedAt: session.createdAt,
        messageCount: 0,
      };
      setSessions((prev) => {
        const next = [newSession, ...prev];
        saveSessionsToStorage(next);
        return next;
      });
      setActiveSessionId(id);
      return id;
    } catch {
      // Offline fallback
      const newSession: SessionInfo = {
        id,
        title: "New Chat",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 0,
      };
      setSessions((prev) => {
        const next = [newSession, ...prev];
        saveSessionsToStorage(next);
        return next;
      });
      setActiveSessionId(id);
      return id;
    }
  }, []);

  const removeSession = useCallback(
    async (id: string) => {
      try {
        await api.deleteSession(id);
      } catch {
        // Proceed with local removal even if server fails
      }
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        saveSessionsToStorage(next);
        return next;
      });
      if (activeSessionId === id) {
        setSessions((prev) => {
          if (prev.length > 0) {
            setActiveSessionId(prev[0].id);
          } else {
            setActiveSessionId(null);
          }
          return prev;
        });
      }
    },
    [activeSessionId]
  );

  const renameSession = useCallback(async (id: string, title: string) => {
    try {
      await api.updateSessionTitle(id, title);
    } catch {
      // Proceed with local update
    }
    setSessions((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, title } : s));
      saveSessionsToStorage(next);
      return next;
    });
  }, []);

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    createNewSession,
    removeSession,
    renameSession,
    loading,
  };
}
