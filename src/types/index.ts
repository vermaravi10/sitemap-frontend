export interface Section {
  id: string;
  title: string;
  content: string;
}

export interface Node {
  id: string;
  title: string;
  sections: Section[];
  position: { x: number; y: number };
  parent: string;
}

export interface RootNode {
  id: string;
  title: string;
  position: { x: number; y: number };
  parent: string;
  sections: Section[];
}

export interface BoardState {
  root: RootNode;
  nodes: Node[];
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}
