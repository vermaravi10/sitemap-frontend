import React, { useEffect, useMemo } from "react";
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
import { useAppSelector } from "../store/hooks";
import FlowNode from "./FlowNode";

const nodeTypes: NodeTypes = { flow: FlowNode };

const FlowBoard: React.FC = () => {
  const { nodes, edges } = useAppSelector((s) => s.board);
  console.log("🚀 ~ FlowBoard ~ edges:", edges);
  console.log("🚀 ~ FlowBoard ~ nodes:", nodes);

  const rfNodes: Node[] = useMemo(
    () =>
      nodes?.map((n) => ({
        id: n.id,
        type: "flow",
        position: n.position,
        data: n as unknown as Record<string, unknown>,
      })),
    [nodes]
  );

  const rfEdges: Edge[] = useMemo(
    () =>
      edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: "smoothstep",
        style: { stroke: "#6b7280", strokeWidth: 1 },
      })),
    [edges]
  );

  const [nodeState, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edgeState, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    setNodes(rfNodes);
  }, [rfNodes, setNodes]);
  useEffect(() => {
    setEdges(rfEdges);
  }, [rfEdges, setEdges]);

  return (
    <div className="w-full h-screen bg-gray-50">
      <ReactFlow
        nodes={nodeState}
        edges={edgeState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(p: Connection) => setEdges((eds) => addEdge(p, eds))}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
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
