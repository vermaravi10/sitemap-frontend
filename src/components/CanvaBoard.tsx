import { useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
} from "@xyflow/react";
import type { Node, Edge, Connection, NodeTypes } from "@xyflow/react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
// import { addNode } from "../store/boardSlice";
import RootNode from "./RootNode";
import SectionNode from "./SectionNode";
import "@xyflow/react/dist/style.css";

const nodeTypes: NodeTypes = {
  root: RootNode,
  node: SectionNode,
};

const CanvaBoard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { root, nodes, edges } = useAppSelector((state) => state.board);

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

  //   const handleAddNode = () => {
  //     dispatch(addNode({ parentId: "root" }));
  //   };

  return (
    <div className="w-full h-screen bg-gray-50">
      {/* <div className="absolute top-4 left-4 z-10">
        <button
          onClick={handleAddNode}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg shadow-lg transition-colors"
        >
          + Add Node to Root
        </button>
      </div> */}

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
      >
        <Background color="#9ca3af" gap={20} />
        <Controls />
        {/* <MiniMap nodeColor="#6b7280" nodeStrokeWidth={3} zoomable pannable /> */}
      </ReactFlow>
    </div>
  );
};

export default CanvaBoard;
