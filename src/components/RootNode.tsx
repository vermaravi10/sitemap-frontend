import { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  updateRootTitle,
  addNode,
  addSection,
  removeSection,
} from "../store/boardSlice";

const RootNode: React.FC<NodeProps> = () => {
  const dispatch = useAppDispatch();
  const root = useAppSelector((state) => state.board.root);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(root.title);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionContent, setNewSectionContent] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

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

  const handleAddSection = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (newSectionTitle.trim() && newSectionContent.trim()) {
      dispatch(
        addSection({
          nodeId: "root",
          title: newSectionTitle.trim(),
          content: newSectionContent.trim(),
        })
      );
      setNewSectionTitle("");
      setNewSectionContent("");
      setShowAddForm(false);
    }
  };

  const handleRemoveSection = (sectionId: string) => {
    dispatch(removeSection({ nodeId: "root", sectionId }));
  };

  const handleAddChildNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(addNode({ parentId: "root" }));
  };

  const handleShowAddForm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAddForm(true);
  };

  const handleCancelAddForm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAddForm(false);
  };

  return (
    <>
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]">
        <div className="text-center mb-4">
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
        </div>

        {/* Sections */}
        <div className="mb-4 space-y-2">
          {root.sections?.map((section) => (
            <div
              key={section.id}
              className="bg-white/90 border border-white/30 rounded-md p-3 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-800">{section.title}</h4>
                <button
                  onClick={() => handleRemoveSection(section.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  ×
                </button>
              </div>
              <p className="text-gray-600 text-sm">{section.content}</p>
            </div>
          ))}
        </div>

        {showAddForm ? (
          <div className="border border-white/30 rounded-md p-3 mb-4 bg-white/10">
            <input
              type="text"
              placeholder="Section title"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              className="w-full mb-2 px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/80 text-gray-800"
            />
            <textarea
              placeholder="Section content"
              value={newSectionContent}
              onChange={(e) => setNewSectionContent(e.target.value)}
              className="w-full mb-2 px-3 py-2 border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-white/50 resize-none bg-white/80 text-gray-800"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddSection}
                className="px-3 py-1 bg-white/20 text-white rounded-md hover:bg-white/30 text-sm"
              >
                Add
              </button>
              <button
                onClick={handleCancelAddForm}
                className="px-3 py-1 bg-white/10 text-white/80 rounded-md hover:bg-white/20 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center space-y-2">
            <button
              onClick={handleShowAddForm}
              className="w-1/2 py-2 border-2 border-dashed border-white/30 rounded-md text-white/80 hover:border-white/50 hover:text-white transition-colors"
            >
              + Add Section
            </button>
          </div>
        )}

        <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      </div>
      <div className="flex justify-start">
        <button onClick={handleAddChildNode}>⊕</button>
      </div>
    </>
  );
};

export default RootNode;
