import type { Project } from "../types";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8877/api";

export async function getProject(id: string): Promise<Project> {
  const r = await fetch(`${BASE}/projects/${id}`);
  if (!r.ok) throw new Error(`GET ${id} failed: ${r.status}`);
  return r.json();
}

export async function putProject(p: Project): Promise<Project> {
  const r = await fetch(`${BASE}/projects/${p._id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: p.title, nodes: p.nodes, edges: p.edges }),
  });
  if (!r.ok) throw new Error(`PUT ${p._id} failed: ${r.status}`);
  return r.json();
}
