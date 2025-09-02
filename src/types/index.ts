export type Section = {
  id: string;
  title: string;
  content: string;
};

export type FlowNode = {
  id: string; // includes "root"
  title: string;
  position: { x: number; y: number };
  parent: string; // "" for root
  sections: Section[];
};

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
};

export type Project = {
  _id: string;
  title: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
};
