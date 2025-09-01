import { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { updateRootTitle, addNode } from "../store/boardSlice";

const RootNode: React.FC<NodeProps> = () => {
  const dispatch = useAppDispatch();
  const root = useAppSelector((state) => state.board.root);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(root.title);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    if (title.trim() !== root.title) {
      dispatch(updateRootTitle(title.trim()));
    }
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleBlur();
    }
  };

  const handleAddChildNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(addNode({ parentId: "root" }));
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-4 min-w-[200px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="text-center">
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyPress={handleKeyPress}
            className="bg-white/90 text-gray-800 px-2 py-1 rounded text-sm font-semibold w-full text-center focus:outline-none focus:ring-2 focus:ring-white/50"
            autoFocus
          />
        ) : (
          <h3
            className="text-white font-semibold text-lg cursor-pointer hover:bg-white/20 px-2 py-1 rounded transition-colors"
            onClick={() => setIsEditing(true)}
          >
            {root.title}
          </h3>
        )}
        <p className="text-white/80 text-sm mt-1">
          Root Node (Parent: {root.parent || "None"})
        </p>
      </div>

      <div className="mt-4">
        <button
          onClick={handleAddChildNode}
          className="w-full py-2 border-2 border-dashed border-white/30 rounded-md text-white/80 hover:border-white/50 hover:text-white transition-colors text-sm"
        >
          + Add Child Node
        </button>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
};

export default RootNode;
