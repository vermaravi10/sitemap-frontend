import type { RootState } from "./store";
import type { Project } from "../types";

export const selectBoard = (s: RootState) => s.board;

export const selectProjectPayload = (s: RootState): Project => ({
  _id: s.board.projectId ?? "local",
  title: s.board.title,
  nodes: s.board.nodes,
  edges: s.board.edges,
});
