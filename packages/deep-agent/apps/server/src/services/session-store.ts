import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export interface Session {
  id: string;
  title: string;
  messages: ChatCompletionMessageParam[];
  createdAt: number;
  updatedAt: number;
}

const sessions = new Map<string, Session>();

export function createSession(id: string, title?: string): Session {
  const now = Date.now();
  const session: Session = {
    id,
    title: title || "New Chat",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  sessions.set(id, session);
  return session;
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

export function getOrCreateSession(id: string): Session {
  return sessions.get(id) || createSession(id);
}

export function listSessions(): Session[] {
  return Array.from(sessions.values()).sort(
    (a, b) => b.updatedAt - a.updatedAt
  );
}

export function deleteSession(id: string): boolean {
  return sessions.delete(id);
}

export function updateSessionTitle(id: string, title: string): Session | undefined {
  const session = sessions.get(id);
  if (session) {
    session.title = title;
    session.updatedAt = Date.now();
  }
  return session;
}

export function appendMessages(
  id: string,
  msgs: ChatCompletionMessageParam[]
): Session | undefined {
  const session = sessions.get(id);
  if (session) {
    session.messages.push(...msgs);
    session.updatedAt = Date.now();
  }
  return session;
}

export function getMessages(id: string): ChatCompletionMessageParam[] {
  return sessions.get(id)?.messages ?? [];
}
