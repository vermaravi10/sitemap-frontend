import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";
import type { BoardState, Node, Section } from "../types";

const initialState: BoardState = {
  root: {
    id: "root",
    title: "Main Board",
    position: { x: 400, y: 100 },
    parent: "",
  },
  nodes: [],
  edges: [],
};

// Helper function to calculate child positions
const calculateChildPositions = (
  parentX: number,
  parentY: number,
  childCount: number,
  childIndex: number
) => {
  const spacing = 300; // Horizontal spacing between children
  const verticalOffset = 200; // Vertical distance from parent
  const totalWidth = (childCount - 1) * spacing;
  const startX = parentX - totalWidth / 2;

  return {
    x: startX + childIndex * spacing,
    y: parentY + verticalOffset,
  };
};

// Helper function to update all child positions when a parent moves
const updateChildPositions = (state: BoardState, parentId: string) => {
  const children = state.nodes.filter((node) => node.parent === parentId);
  const parent =
    parentId === "root"
      ? state.root
      : state.nodes.find((n) => n.id === parentId);

  if (!parent) return;

  children.forEach((child, index) => {
    const newPosition = calculateChildPositions(
      parent.position.x,
      parent.position.y,
      children.length,
      index
    );
    child.position = newPosition;
  });
};

const boardSlice = createSlice({
  name: "board",
  initialState,
  reducers: {
    addNode: (state, action: PayloadAction<{ parentId: string }>) => {
      const parentId = action.payload.parentId;
      const parent =
        parentId === "root"
          ? state.root
          : state.nodes.find((n) => n.id === parentId);

      if (!parent) return;

      const existingChildren = state.nodes.filter(
        (node) => node.parent === parentId
      );
      const newPosition = calculateChildPositions(
        parent.position.x,
        parent.position.y,
        existingChildren.length + 1,
        existingChildren.length
      );

      const newNode: Node = {
        id: nanoid(),
        title: `Node ${state.nodes.length + 1}`,
        sections: [],
        position: newPosition,
        parent: parentId,
      };

      state.nodes.push(newNode);

      // Add edge from parent to new node
      state.edges.push({
        id: nanoid(),
        source: parentId,
        target: newNode.id,
      });

      // Update positions of existing children to maintain equal spacing
      updateChildPositions(state, parentId);
    },

    removeNode: (state, action: PayloadAction<string>) => {
      const nodeId = action.payload;
      const node = state.nodes.find((n) => n.id === nodeId);

      if (!node) return;

      const parentId = node.parent;

      // Remove the node
      state.nodes = state.nodes.filter((n) => n.id !== nodeId);

      // Remove edges to/from this node
      state.edges = state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      );

      // Update positions of remaining children
      updateChildPositions(state, parentId);
    },

    updateNodePosition: (
      state,
      action: PayloadAction<{ id: string; x: number; y: number }>
    ) => {
      const node = state.nodes.find((n) => n.id === action.payload.id);
      if (node) {
        node.position = { x: action.payload.x, y: action.payload.y };
        // Update positions of children when parent moves
        updateChildPositions(state, node.id);
      }
    },

    updateNodeTitle: (
      state,
      action: PayloadAction<{ id: string; title: string }>
    ) => {
      const node = state.nodes.find((n) => n.id === action.payload.id);
      if (node) {
        node.title = action.payload.title;
      }
    },

    addSection: (
      state,
      action: PayloadAction<{
        nodeId: string;
        title: string;
        content: string;
      }>
    ) => {
      const node = state.nodes.find((n) => n.id === action.payload.nodeId);
      if (node) {
        const newSection: Section = {
          id: nanoid(),
          title: action.payload.title,
          content: action.payload.content,
        };
        node.sections.push(newSection);
      }
    },

    removeSection: (
      state,
      action: PayloadAction<{ nodeId: string; sectionId: string }>
    ) => {
      const node = state.nodes.find((n) => n.id === action.payload.nodeId);
      if (node) {
        node.sections = node.sections.filter(
          (section) => section.id !== action.payload.sectionId
        );
      }
    },

    updateSection: (
      state,
      action: PayloadAction<{
        nodeId: string;
        sectionId: string;
        title: string;
        content: string;
      }>
    ) => {
      const node = state.nodes.find((n) => n.id === action.payload.nodeId);
      if (node) {
        const section = node.sections.find(
          (section) => section.id === action.payload.sectionId
        );
        if (section) {
          section.title = action.payload.title;
          section.content = action.payload.content;
        }
      }
    },

    reorderSections: (
      state,
      action: PayloadAction<{
        nodeId: string;
        oldIndex: number;
        newIndex: number;
      }>
    ) => {
      const node = state.nodes.find((n) => n.id === action.payload.nodeId);
      if (node) {
        const { oldIndex, newIndex } = action.payload;
        const [removed] = node.sections.splice(oldIndex, 1);
        node.sections.splice(newIndex, 0, removed);
      }
    },

    updateRootTitle: (state, action: PayloadAction<string>) => {
      state.root.title = action.payload;
    },

    updateRootPosition: (
      state,
      action: PayloadAction<{ x: number; y: number }>
    ) => {
      state.root.position = action.payload;
      // Update positions of children when root moves
      updateChildPositions(state, "root");
    },
  },
});

export const {
  addNode,
  removeNode,
  updateNodePosition,
  updateNodeTitle,
  addSection,
  removeSection,
  updateSection,
  reorderSections,
  updateRootTitle,
  updateRootPosition,
} = boardSlice.actions;

export default boardSlice.reducer;
