import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";
import type { BoardState, Node, Section } from "../types";

const initialState: BoardState = {
  root: {
    id: "root",
    title: "Home",
    position: { x: 400, y: 100 },
    parent: "",
    sections: [],
  },
  nodes: [],
  edges: [],
};

// Helper function to calculate child positions
const calculateChildPositions = (
  parentX: number,
  parentY: number,
  childCount: number,
  childIndex: number,
  parentSectionsCount: number = 0
) => {
  const baseSpacing = 450; // Base horizontal spacing between children

  // Adjust horizontal spacing based on parent's section count
  const sectionAdjustment = parentSectionsCount * 50; // 50px per section
  const adjustedSpacing = baseSpacing + sectionAdjustment;

  // Calculate vertical offset based on parent's content height
  // Each section adds approximately 120px to the node height
  const sectionHeight = 120; // Height per section
  const baseNodeHeight = 250; // Base height of a node without sections
  const parentContentHeight =
    baseNodeHeight + parentSectionsCount * sectionHeight;

  // Dynamic vertical offset: content height + dynamic buffer (more sections = more buffer)
  const dynamicBuffer = Math.max(100, parentSectionsCount * 30); // Buffer increases with section count
  const adjustedVerticalOffset = parentContentHeight + dynamicBuffer;

  const totalWidth = (childCount - 1) * adjustedSpacing;
  const startX = parentX - totalWidth / 2;

  return {
    x: startX + childIndex * adjustedSpacing,
    y: parentY + adjustedVerticalOffset,
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

  const parentSectionsCount = parent.sections?.length || 0;

  children.forEach((child, index) => {
    const newPosition = calculateChildPositions(
      parent.position.x,
      parent.position.y,
      children.length,
      index,
      parentSectionsCount
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
          : state?.nodes?.find((n) => n?.id === parentId);

      if (!parent) return;

      const existingChildren = state?.nodes?.filter(
        (node) => node.parent === parentId
      );
      const newPosition = calculateChildPositions(
        parent.position.x,
        parent.position.y,
        existingChildren.length + 1,
        existingChildren.length,
        parent.sections?.length || 0
      );

      const newNode: Node = {
        id: nanoid(),
        title: `Page ${state.nodes.length + 2}`,
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
      const { nodeId, title, content } = action.payload;

      if (nodeId === "root") {
        const newSection: Section = {
          id: nanoid(),
          title,
          content,
        };
        state.root.sections.push(newSection);
        // Update child positions when root sections change
        updateChildPositions(state, "root");
      } else {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (node) {
          const newSection: Section = {
            id: nanoid(),
            title,
            content,
          };
          node.sections.push(newSection);
          // Update child positions when parent sections change
          updateChildPositions(state, nodeId);
        }
      }
    },

    removeSection: (
      state,
      action: PayloadAction<{ nodeId: string; sectionId: string }>
    ) => {
      const { nodeId, sectionId } = action.payload;

      if (nodeId === "root") {
        state.root.sections = state.root.sections.filter(
          (section) => section.id !== sectionId
        );
        // Update child positions when root sections change
        updateChildPositions(state, "root");
      } else {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (node) {
          node.sections = node.sections.filter(
            (section) => section.id !== sectionId
          );
          // Update child positions when parent sections change
          updateChildPositions(state, nodeId);
        }
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
      const { nodeId, sectionId, title, content } = action.payload;

      if (nodeId === "root") {
        const section = state.root.sections.find(
          (section) => section.id === sectionId
        );
        if (section) {
          section.title = title;
          section.content = content;
        }
      } else {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (node) {
          const section = node.sections.find(
            (section) => section.id === sectionId
          );
          if (section) {
            section.title = title;
            section.content = content;
          }
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
      const { nodeId, oldIndex, newIndex } = action.payload;

      if (nodeId === "root") {
        const [removed] = state.root.sections.splice(oldIndex, 1);
        state.root.sections.splice(newIndex, 0, removed);
        // Update child positions when root sections change
        updateChildPositions(state, "root");
      } else {
        const node = state.nodes.find((n) => n.id === nodeId);
        if (node) {
          const [removed] = node.sections.splice(oldIndex, 1);
          node.sections.splice(newIndex, 0, removed);
        }
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
