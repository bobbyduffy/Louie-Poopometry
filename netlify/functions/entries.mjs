import { getStore } from "@netlify/blobs";
import crypto from "crypto";

const STORE_NAME = "potty-entries";

export default async (req, context) => {
  const store = getStore({ name: STORE_NAME, consistency: "strong" });
  const url = new URL(req.url);
  const method = req.method;

  // GET /api/entries — list all entries
  if (method === "GET") {
    const { blobs } = await store.list();
    const entries = [];
    for (const blob of blobs) {
      const entry = await store.get(blob.key, { type: "json" });
      if (entry) {
        entries.push({ ...entry, id: blob.key });
      }
    }
    entries.sort((a, b) => b.time.localeCompare(a.time));
    return Response.json(entries);
  }

  // POST /api/entries — add a new entry
  if (method === "POST") {
    const body = await req.json();
    const id = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const entry = {
      type: body.type,
      location: body.location,
      notes: body.notes || "",
      time: body.time || new Date().toISOString(),
    };
    await store.setJSON(id, entry);
    return Response.json({ ...entry, id }, { status: 201 });
  }

  // DELETE /api/entries/:id — delete an entry
  if (method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) {
      return Response.json({ error: "Missing id parameter" }, { status: 400 });
    }
    await store.delete(id);
    return Response.json({ success: true });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
};

export const config = {
  path: "/api/entries",
};
