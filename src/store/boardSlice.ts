import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";
import type {
  BoardState,
  FlowNode,
  Section,
  Project,
  FlowEdge,
} from "../types";

const initialState: BoardState = {
  projectId: null,
  title: "Untitled Project",
  nodes: [
    {
      id: "root",
      title: "Home",
      position: { x: 400, y: 100 },
      parent: "",
      sections: [],
    },
  ],
  edges: [],
};

// helpers...
const findNode = (nodes: FlowNode[], id: string) =>
  nodes.find((n) => n.id === id);
const childrenOf = (nodes: FlowNode[], parentId: string) =>
  nodes.filter((n) => n.parent === parentId);

const calculateChildPositions = (
  parent: FlowNode,
  childCount: number,
  childIndex: number
) => {
  const parentSectionsCount = parent.sections?.length || 0;
  const baseSpacing = 450;
  const sectionAdjustment = parentSectionsCount * 50;
  const adjustedSpacing = baseSpacing + sectionAdjustment;

  const sectionHeight = 120;
  const baseNodeHeight = 250;
  const dynamicBuffer = Math.max(100, parentSectionsCount * 30);
  const adjustedVerticalOffset =
    baseNodeHeight + parentSectionsCount * sectionHeight + dynamicBuffer;

  const totalWidth = (childCount - 1) * adjustedSpacing;
  const startX = parent.position.x - totalWidth / 2;

  return {
    x: startX + childIndex * adjustedSpacing,
    y: parent.position.y + adjustedVerticalOffset,
  };
};

const relayoutChildren = (nodes: FlowNode[], parentId: string) => {
  const parent = findNode(nodes, parentId);
  if (!parent) return;
  const kids = childrenOf(nodes, parentId);
  kids.forEach((kid, index) => {
    kid.position = calculateChildPositions(parent, kids.length, index);
  });
};

export const boardSlice = createSlice({
  name: "board",
  initialState,
  reducers: {
    setProjectFromServer(state, action: PayloadAction<Project>) {
      const p = action.payload;
      state.projectId = p._id;
      state.title = p.title;
      state.nodes = p.nodes;
      state.edges = p.edges as FlowEdge[];
    },

    updateProjectTitle(state, action: PayloadAction<string>) {
      state.title = action.payload;
    },

    addNode(state, action: PayloadAction<{ parentId: string }>) {
      const parentId = action.payload.parentId;
      const parent = findNode(state.nodes, parentId);
      if (!parent) return;

      const siblings = childrenOf(state.nodes, parentId);
      const pos = calculateChildPositions(
        parent,
        siblings.length + 1,
        siblings.length
      );

      const newNode: FlowNode = {
        id: nanoid(),
        title: `Page ${state.nodes.length + 1}`,
        sections: [],
        position: pos,
        parent: parentId,
      };

      state.nodes.push(newNode);
      state.edges.push({ id: nanoid(), source: parentId, target: newNode.id });
      relayoutChildren(state.nodes, parentId);
    },

    removeNode(state, action: PayloadAction<string>) {
      const id = action.payload;
      const node = findNode(state.nodes, id);
      if (!node) return;

      const toDelete = new Set<string>();
      const collect = (nid: string) => {
        toDelete.add(nid);
        childrenOf(state.nodes, nid).forEach((c) => collect(c.id));
      };
      collect(id);

      state.nodes = state.nodes.filter((n) => !toDelete.has(n.id));
      state.edges = state.edges.filter(
        (e) => !toDelete.has(e.source) && !toDelete.has(e.target)
      );

      if (node.parent) relayoutChildren(state.nodes, node.parent);
    },

    updateNodeTitle(
      state,
      action: PayloadAction<{ id: string; title: string }>
    ) {
      const node = findNode(state.nodes, action.payload.id);
      if (node) node.title = action.payload.title;
    },

    addSection(
      state,
      action: PayloadAction<{ nodeId: string; title: string; content: string }>
    ) {
      const { nodeId, title, content } = action.payload;
      const node = findNode(state.nodes, nodeId);
      if (!node) return;
      node.sections.push({ id: nanoid(), title, content });
      relayoutChildren(state.nodes, node.id);
    },

    removeSection(
      state,
      action: PayloadAction<{ nodeId: string; sectionId: string }>
    ) {
      const { nodeId, sectionId } = action.payload;
      const node = findNode(state.nodes, nodeId);
      if (!node) return;
      node.sections = node.sections.filter((s) => s.id !== sectionId);
      relayoutChildren(state.nodes, node.id);
    },

    updateSection(
      state,
      action: PayloadAction<{
        nodeId: string;
        sectionId: string;
        title: string;
        content: string;
      }>
    ) {
      const { nodeId, sectionId, title, content } = action.payload;
      const node = findNode(state.nodes, nodeId);
      if (!node) return;
      const sec = node.sections.find((s) => s.id === sectionId);
      if (sec) {
        sec.title = title;
        sec.content = content;
      }
    },

    reorderSections(
      state,
      action: PayloadAction<{
        nodeId: string;
        oldIndex: number;
        newIndex: number;
      }>
    ) {
      const { nodeId, oldIndex, newIndex } = action.payload;
      const node = findNode(state.nodes, nodeId);
      if (!node) return;
      const [removed] = node.sections.splice(oldIndex, 1);
      node.sections.splice(newIndex, 0, removed);
      relayoutChildren(state.nodes, node.id);
    },
  },
});

export const {
  setProjectFromServer,
  updateProjectTitle,
  addNode,
  removeNode,
  updateNodeTitle,
  addSection,
  removeSection,
  updateSection,
  reorderSections,
} = boardSlice.actions;

export default boardSlice.reducer;
