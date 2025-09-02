import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Node, Edge, NodeTypes, Connection } from "@xyflow/react";
import {
  Background,
  Controls,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nanoid } from "nanoid";
import FlowNode from "./FlowNode";
import type { FlowNode as DNode, FlowEdge, Project } from "../types";
import { getProject, putProject } from "../services/api";

// ---------- helpers (ported from your reducers) ----------
const findNode = (nodes: DNode[], id: string) => nodes.find((n) => n.id === id);
const childrenOf = (nodes: DNode[], parentId: string) =>
  nodes.filter((n) => n.parent === parentId);

const calculateChildPositions = (
  parent: DNode,
  childCount: number,
  childIndex: number
) => {
  const parentSectionsCount = parent.sections?.length || 0;
  const baseSpacing = 450;
  const sectionAdjustment = parentSectionsCount * 50;
  const adjustedSpacing = baseSpacing + sectionAdjustment;

  const sectionHeight = 120; // Height per section
  const baseNodeHeight = 250; // Base height of a node without sections
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

const relayoutChildren = (nodes: DNode[], parentId: string) => {
  const parent = findNode(nodes, parentId);
  if (!parent) return;
  const kids = childrenOf(nodes, parentId);
  kids.forEach((kid, index) => {
    kid.position = calculateChildPositions(parent, kids.length, index);
  });
};

const nodeTypes: NodeTypes = { flow: FlowNode };

const FlowBoard: React.FC = () => {
  const projectId = "68b6aaa720cc8c85153a7de9";

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!projectId) throw new Error("No projectId provided");
        const p = await getProject(projectId);
        if (!active) return;
        setProject(p);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [projectId]);

  // --- save-on-change (no debounce), dedup + in-flight guard ---
  const lastSent = useRef<string>("");
  const inFlight = useRef(false);
  function saveIfChanged(p: Project) {
    const body = JSON.stringify({
      title: p.title,
      nodes: p.nodes,
      edges: p.edges,
    });
    if (body === lastSent.current || inFlight.current) return;
    inFlight.current = true;
    void putProject(p)
      .then((res) => {
        lastSent.current = JSON.stringify({
          title: res.title,
          nodes: res.nodes,
          edges: res.edges,
        });
      })
      .catch((e) => {
        console.error("save failed", e);
      })
      .finally(() => {
        inFlight.current = false;
      });
  }

  // ----- mutations -----
  const updateNodeTitle = useCallback((id: string, title: string) => {
    setProject((prev) => {
      if (!prev) return prev;
      const nodes = prev.nodes.map((n) => (n.id === id ? { ...n, title } : n));
      const next: Project = { ...prev, nodes };
      saveIfChanged(next);
      return next;
    });
  }, []);

  const addChildNode = useCallback((parentId: string) => {
    setProject((prev) => {
      if (!prev) return prev;
      const parent = findNode(prev.nodes, parentId);
      if (!parent) return prev;

      const siblings = childrenOf(prev.nodes, parentId);
      const pos = calculateChildPositions(
        parent,
        siblings.length + 1,
        siblings.length
      );

      const newNode: DNode = {
        id: nanoid(),
        title: `Page ${prev.nodes.length + 1}`,
        sections: [],
        position: pos,
        parent: parentId,
      };
      const nodes = [...prev.nodes, newNode];
      const edges: FlowEdge[] = [
        ...prev.edges,
        { id: nanoid(), source: parentId, target: newNode.id },
      ];

      relayoutChildren(nodes, parentId);

      const next: Project = { ...prev, nodes, edges };
      saveIfChanged(next);
      return next;
    });
  }, []);

  const removeNode = useCallback((id: string) => {
    if (!confirm("Remove this node and its children?")) return;
    setProject((prev) => {
      if (!prev) return prev;
      const node = findNode(prev.nodes, id);
      if (!node) return prev;

      const toDelete = new Set<string>();
      const collect = (nid: string) => {
        toDelete.add(nid);
        childrenOf(prev.nodes, nid).forEach((c) => collect(c.id));
      };
      collect(id);

      const nodes = prev.nodes.filter((n) => !toDelete.has(n.id));
      const edges = prev.edges.filter(
        (e) => !toDelete.has(e.source) && !toDelete.has(e.target)
      );

      if (node.parent) relayoutChildren(nodes, node.parent);

      const next: Project = { ...prev, nodes, edges };
      saveIfChanged(next);
      return next;
    });
  }, []);

  const addSection = useCallback(
    (nodeId: string, title: string, content: string) => {
      setProject((prev) => {
        if (!prev) return prev;
        const nodes = prev.nodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                sections: [...n.sections, { id: nanoid(), title, content }],
              }
            : n
        );
        relayoutChildren(nodes, nodeId);
        const next: Project = { ...prev, nodes };
        saveIfChanged(next);
        return next;
      });
    },
    []
  );

  const removeSection = useCallback((nodeId: string, sectionId: string) => {
    setProject((prev) => {
      if (!prev) return prev;
      const nodes = prev.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, sections: n.sections.filter((s) => s.id !== sectionId) }
          : n
      );
      relayoutChildren(nodes, nodeId);
      const next: Project = { ...prev, nodes };
      saveIfChanged(next);
      return next;
    });
  }, []);

  const updateSection = useCallback(
    (nodeId: string, sectionId: string, title: string, content: string) => {
      setProject((prev) => {
        if (!prev) return prev;
        const nodes = prev.nodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                sections: n.sections.map((s) =>
                  s.id === sectionId ? { ...s, title, content } : s
                ),
              }
            : n
        );
        const next: Project = { ...prev, nodes };
        saveIfChanged(next);
        return next;
      });
    },
    []
  );

  const reorderSections = useCallback(
    (nodeId: string, oldIndex: number, newIndex: number) => {
      setProject((prev) => {
        if (!prev) return prev;
        const nodes = prev.nodes.map((n) => {
          if (n.id !== nodeId) return n;
          const arr = [...n.sections];
          const [removed] = arr.splice(oldIndex, 1);
          arr.splice(newIndex, 0, removed);
          return { ...n, sections: arr };
        });
        relayoutChildren(nodes, nodeId);
        const next: Project = { ...prev, nodes };
        saveIfChanged(next);
        return next;
      });
    },
    []
  );

  const onConnectRF = useCallback((p: Connection) => {
    if (!p.source || !p.target) return;
    setProject((prev) => {
      if (!prev) return prev;
      // prevent duplicate edge
      if (
        prev.edges.some((e) => e.source === p.source && e.target === p.target)
      )
        return prev;
      const edges = [
        ...prev.edges,
        { id: nanoid(), source: p.source, target: p.target },
      ];
      const next: Project = { ...prev, edges };
      saveIfChanged(next);
      return next;
    });
  }, []);

  // ----- map to React Flow -----
  const rfNodes: Node[] = useMemo(() => {
    if (!project) return [];
    return project.nodes.map((n) => ({
      id: n.id,
      type: "flow",
      position: n.position,
      data: {
        node: n,
        onUpdateTitle: updateNodeTitle,
        onAddSection: addSection,
        onRemoveSection: removeSection,
        onUpdateSection: updateSection,
        onReorderSections: reorderSections,
        onRemoveNode: removeNode,
        onAddChildNode: addChildNode,
      } as Record<string, unknown>,
    }));
  }, [
    project,
    updateNodeTitle,
    addSection,
    removeSection,
    updateSection,
    reorderSections,
    removeNode,
    addChildNode,
  ]);

  const rfEdges: Edge[] = useMemo(() => {
    if (!project) return [];
    return project.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: "smoothstep",
      style: { stroke: "#6b7280", strokeWidth: 1 },
    }));
  }, [project]);

  const [nodeState, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edgeState, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    setNodes(rfNodes);
  }, [rfNodes, setNodes]);
  useEffect(() => {
    setEdges(rfEdges);
  }, [rfEdges, setEdges]);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!project) return <div className="p-6">No project found.</div>;

  return (
    <div className="w-full h-screen bg-gray-50">
      <ReactFlow
        nodes={nodeState}
        edges={edgeState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(p) => {
          onConnectRF(p);
          // also reflect in RF state for immediate feedback
          setEdges((eds) => addEdge(p, eds));
        }}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={true}
        elementsSelectable
        fitView
        attributionPosition="bottom-left"
        className="bg-gray-50"
        minZoom={0.2}
        maxZoom={1.5}
        panOnDrag
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch
        selectionOnDrag={false}
        noPanClassName="rf-nopan"
      >
        <Background color="#9ca3af" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default FlowBoard;
