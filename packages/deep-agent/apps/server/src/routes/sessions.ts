import { Hono } from "hono";
import { v4 as uuid } from "uuid";
import {
  listSessions,
  createSession,
  getSession,
  deleteSession,
  updateSessionTitle,
} from "../services/session-store.js";

const sessions = new Hono();

// List all sessions
sessions.get("/", (c) => {
  const all = listSessions().map((s) => ({
    id: s.id,
    title: s.title,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    messageCount: s.messages.length,
  }));
  return c.json(all);
});

// Create a new session
sessions.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const id = body.id || uuid();
  const title = body.title || "New Chat";
  const session = createSession(id, title);
  return c.json(
    { id: session.id, title: session.title, createdAt: session.createdAt },
    201
  );
});

// Get a single session
sessions.get("/:id", (c) => {
  const session = getSession(c.req.param("id"));
  if (!session) return c.json({ error: "Session not found" }, 404);
  return c.json({
    id: session.id,
    title: session.title,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    messageCount: session.messages.length,
  });
});

// Update session title
sessions.patch("/:id", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const session = updateSessionTitle(c.req.param("id"), body.title);
  if (!session) return c.json({ error: "Session not found" }, 404);
  return c.json({ id: session.id, title: session.title });
});

// Delete a session
sessions.delete("/:id", (c) => {
  const deleted = deleteSession(c.req.param("id"));
  if (!deleted) return c.json({ error: "Session not found" }, 404);
  return c.json({ ok: true });
});

export { sessions };
