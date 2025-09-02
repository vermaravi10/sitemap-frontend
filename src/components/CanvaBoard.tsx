import type { Connection, Edge, Node, NodeTypes } from "@xyflow/react";
import {
  Background,
  Controls,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo } from "react";
import { useAppSelector } from "../store/hooks";
// import { addNode } from "../store/boardSlice";
import "@xyflow/react/dist/style.css";
import RootNode from "./RootNode";
import SectionNode from "./SectionNode";

const nodeTypes: NodeTypes = {
  root: RootNode,
  node: SectionNode,
};

const CanvaBoard: React.FC = () => {
  const { root, nodes, edges } = useAppSelector((state) => state.board);
  console.log("🚀 ~ CanvaBoard ~ root:", root);
  console.log("🚀 ~ CanvaBoard ~ nodes:", nodes);
  console.log("🚀 ~ CanvaBoard ~ edges:", edges);

  const reactFlowNodes: Node[] = useMemo(() => {
    const allNodes: Node[] = [
      {
        id: root.id,
        type: "root",
        position: root.position,
        data: root as unknown as Record<string, unknown>,
      },
      ...nodes.map((node) => ({
        id: node.id,
        type: "node",
        position: node.position,
        data: node as unknown as Record<string, unknown>,
      })),
    ];
    return allNodes;
  }, [root, nodes]);

  const reactFlowEdges: Edge[] = useMemo(() => {
    return edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "smoothstep",
      style: { stroke: "#6b7280", strokeWidth: 2 },
    }));
  }, [edges]);

  const [reactFlowNodesState, setReactFlowNodes, onNodesChange] =
    useNodesState<Node>([]);
  const [reactFlowEdgesState, setReactFlowEdges, onEdgesChange] =
    useEdgesState<Edge>([]);

  // Sync nodes with Redux state
  useEffect(() => {
    setReactFlowNodes(reactFlowNodes);
  }, [reactFlowNodes, setReactFlowNodes]);

  // Sync edges with Redux state
  useEffect(() => {
    setReactFlowEdges(reactFlowEdges);
  }, [reactFlowEdges, setReactFlowEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setReactFlowEdges((eds) => addEdge(params, eds));
    },
    [setReactFlowEdges]
  );

  // Disable node dragging - nodes are positioned automatically
  const onNodeDragStop = useCallback(() => {
    // No-op - nodes are not draggable
  }, []);

  return (
    <div className="w-full h-screen bg-gray-50">
      <ReactFlow
        nodes={reactFlowNodesState}
        edges={reactFlowEdgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
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
        /* 🔑 any element with this class won’t trigger pane panning */
        noPanClassName="rf-nopan"
      >
        <Background color="#9ca3af" gap={20} />
        <Controls />
        {/* <MiniMap nodeColor="#6b7280" nodeStrokeWidth={3} zoomable pannable /> */}
      </ReactFlow>
    </div>
  );
};

export default CanvaBoard;
