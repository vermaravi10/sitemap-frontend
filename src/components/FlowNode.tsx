// src/components/FlowNode.tsx
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAppDispatch } from "../store/hooks";
import {
  updateNodeTitle,
  addSection,
  removeSection,
  updateSection,
  reorderSections,
  removeNode,
  addNode,
} from "../store/boardSlice";
import type { FlowNode } from "../types";

// ---------- Sortable Section ----------
interface SortableSectionProps {
  id: string;
  title: string;
  content: string;
  onRemove: () => void;
  onUpdate: (title: string, content: string) => void;
}

const SortableSection: React.FC<SortableSectionProps> = ({
  id,
  title,
  content,
  onRemove,
  onUpdate,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editContent, setEditContent] = useState(content);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    if (editTitle.trim() !== title || editContent.trim() !== content) {
      onUpdate(editTitle.trim(), editContent.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 rounded-md p-3 mb-2 shadow-sm hover:shadow-md transition-shadow"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            className="flex-1 bg-gray-50 border border-gray-300 rounded px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <h4
            className="flex-1 font-medium text-gray-800 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
            onClick={() => setIsEditing(true)}
          >
            {title}
          </h4>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-2 text-red-500 hover:text-red-700 text-sm font-medium"
        >
          ×
        </button>
      </div>

      {isEditing ? (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onBlur={handleSave}
          className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={2}
        />
      ) : (
        <p className="text-gray-600 text-sm">{content}</p>
      )}

      <div
        {...attributes}
        {...listeners}
        className="rf-nopan w-full h-4 bg-gray-100 rounded cursor-move hover:bg-gray-200 transition-colors mt-3 flex items-center justify-center"
        style={{ touchAction: "none" }}
      >
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

const FlowNodeComponent: React.FC<NodeProps> = ({ id, data }) => {
  const dispatch = useAppDispatch();
  const node = data as FlowNode;

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(node.title);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionContent, setNewSectionContent] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!node) return null;
  const isRoot = node.parent === "";

  const handleTitleBlur = () => {
    if (title.trim() !== node.title) {
      dispatch(updateNodeTitle({ id: node.id, title: title.trim() }));
    }
    setIsEditing(false);
  };

  const handleAddSection = () => {
    if (newSectionTitle?.trim() && newSectionContent?.trim()) {
      dispatch(
        addSection({
          nodeId: node.id,
          title: newSectionTitle.trim(),
          content: newSectionContent.trim(),
        })
      );
      setNewSectionTitle("");
      setNewSectionContent("");
      setShowAddForm(false);
    }
  };

  const handleRemoveNode = () => {
    if (!isRoot && confirm("Remove this node and all its children?")) {
      dispatch(removeNode(node.id));
    }
  };

  const onSectionsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && over) {
      const oldIndex = node.sections.findIndex(
        (s) => s.id === String(active.id)
      );
      const newIndex = node.sections.findIndex((s) => s.id === String(over.id));
      if (oldIndex !== -1 && newIndex !== -1) {
        dispatch(reorderSections({ nodeId: node.id, oldIndex, newIndex }));
      }
    }
  };

  return (
    <>
      <div
        className={`bg-gradient-to-r ${
          isRoot ? "from-[#e1e4e8] to-[#d4d4d4]" : "from-[#e1e4e8] to-[#939ca3]"
        } border-2 border-gray-300 rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]`}
      >
        {!isRoot && (
          <Handle type="target" position={Position.Top} className="w-3 h-3" />
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="bg-gray-50 border border-gray-300 rounded px-2 py-1 text-lg font-semibold w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            ) : (
              <h3
                className="text-lg font-semibold text-gray-800 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                onClick={() => setIsEditing(true)}
              >
                {node.title}
              </h3>
            )}
          </div>
          {!isRoot && (
            <button
              onClick={handleRemoveNode}
              className="ml-2 text-red-500 hover:text-red-700 text-lg font-bold px-2 py-1 rounded hover:bg-red-50"
            >
              ×
            </button>
          )}
        </div>

        {/* Sections */}
        <div className="mb-4 rf-nopan">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onSectionsDragEnd}
          >
            <SortableContext
              items={node.sections.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              {node.sections.map((s) => (
                <SortableSection
                  key={s.id}
                  id={s.id}
                  title={s.title}
                  content={s.content}
                  onRemove={() =>
                    dispatch(
                      removeSection({ nodeId: node.id, sectionId: s.id })
                    )
                  }
                  onUpdate={(t, c) =>
                    dispatch(
                      updateSection({
                        nodeId: node.id,
                        sectionId: s.id,
                        title: t,
                        content: c,
                      })
                    )
                  }
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {showAddForm ? (
          <div className="border border-gray-200 rounded-md p-3 mb-4 bg-gray-50">
            <input
              type="text"
              placeholder="Section title"
              value={newSectionTitle}
              onChange={(e) => setNewSectionTitle(e.target.value)}
              className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Section content"
              value={newSectionContent}
              onChange={(e) => setNewSectionContent(e.target.value)}
              className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddSection}
                className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center space-y-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="w-1/2 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
            >
              + Add Section
            </button>
          </div>
        )}

        <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      </div>

      {/* Add child button */}
      <div className="flex justify-start">
        <button onClick={() => dispatch(addNode({ parentId: node.id }))}>
          ⊕
        </button>
      </div>
    </>
  );
};

export default FlowNodeComponent;
