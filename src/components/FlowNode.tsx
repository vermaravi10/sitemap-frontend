import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FlowNode as DNode } from "../types";

type Handlers = {
  onUpdateTitle: (id: string, title: string) => void;
  onAddSection: (nodeId: string, title: string, content: string) => void;
  onRemoveSection: (nodeId: string, sectionId: string) => void;
  onUpdateSection: (
    nodeId: string,
    sectionId: string,
    title: string,
    content: string
  ) => void;
  onReorderSections: (
    nodeId: string,
    oldIndex: number,
    newIndex: number
  ) => void;
  onRemoveNode: (id: string) => void;
  onAddChildNode: (parentId: string) => void;
};

type FlowNodeData = {
  node: DNode;
} & Handlers;

/* -------------------- SortableSection -------------------- */

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

  // separate edit states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);

  const [editTitle, setEditTitle] = useState(title);
  const [editContent, setEditContent] = useState(content);

  // keep local state in sync if parent updates (rare but safe)
  if (title !== editTitle && !isEditingTitle) setEditTitle(title);
  if (content !== editContent && !isEditingContent) setEditContent(content);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const saveAndExitTitle = () => {
    const t = editTitle.trim();
    if (t !== title) onUpdate(t, editContent);
    setIsEditingTitle(false);
  };
  const cancelTitle = () => {
    setEditTitle(title);
    setIsEditingTitle(false);
  };

  const saveAndExitContent = () => {
    const c = editContent.trim();
    if (c !== content) onUpdate(editTitle, c);
    setIsEditingContent(false);
  };
  const cancelContent = () => {
    setEditContent(content);
    setIsEditingContent(false);
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
        {isEditingTitle ? (
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={saveAndExitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveAndExitTitle();
              if (e.key === "Escape") cancelTitle();
            }}
            className="flex-1 bg-gray-50 border border-gray-300 rounded px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <h4
            className="flex-1 font-medium text-gray-800 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
            onClick={() => setIsEditingTitle(true)}
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

      {isEditingContent ? (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onBlur={saveAndExitContent}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter")
              saveAndExitContent();
            if (e.key === "Escape") cancelContent();
          }}
          className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={2}
          autoFocus
        />
      ) : (
        <p
          className="text-gray-600 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
          onClick={() => setIsEditingContent(true)}
        >
          {content}
        </p>
      )}

      <div
        {...attributes}
        {...listeners}
        className="rf-nopan w-full h-4 bg-gray-100 rounded cursor-move hover:bg-gray-200 transition-colors mt-3 flex items-center justify-center"
        style={{ touchAction: "none" }}
      >
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-gray-400 rounded-full" />
          <div className="w-1 h-1 bg-gray-400 rounded-full" />
          <div className="w-1 h-1 bg-gray-400 rounded-full" />
        </div>
      </div>
    </div>
  );
};

/* -------------------- FlowNode (container) -------------------- */

const FlowNodeComponent: React.FC<NodeProps> = ({ data }) => {
  const { node, ...handlers } = data as FlowNodeData;

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(node.title);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionContent, setNewSectionContent] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const isRoot = node.parent === "";

  const onSectionsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && over) {
      const oldIndex = node.sections.findIndex(
        (s) => s.id === String(active.id)
      );
      const newIndex = node.sections.findIndex((s) => s.id === String(over.id));
      if (oldIndex !== -1 && newIndex !== -1) {
        handlers.onReorderSections(node.id, oldIndex, newIndex);
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  if (title.trim() !== node.title) {
                    handlers.onUpdateTitle(node.id, title.trim());
                  }
                  setIsEditing(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const t = title.trim();
                    if (t !== node.title) handlers.onUpdateTitle(node.id, t);
                    setIsEditing(false);
                  }
                  if (e.key === "Escape") {
                    setTitle(node.title);
                    setIsEditing(false);
                  }
                }}
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
              onClick={() => handlers.onRemoveNode(node.id)}
              className="ml-2 text-red-500 hover:text-red-700 text-lg font-bold px-2 py-1 rounded hover:bg-red-50"
            >
              ×
            </button>
          )}
        </div>

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
                  onRemove={() => handlers.onRemoveSection(node.id, s.id)}
                  onUpdate={(t, c) =>
                    handlers.onUpdateSection(node.id, s.id, t, c)
                  }
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {showAddForm ? (
          <div className="border border-gray-200 rounded-md p-3 mb-4 bg-gray-50">
            <input
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
                onClick={() => {
                  const t = newSectionTitle.trim();
                  const c = newSectionContent.trim();
                  if (t && c) {
                    handlers.onAddSection(node.id, t, c);
                    setNewSectionTitle("");
                    setNewSectionContent("");
                    setShowAddForm(false);
                  }
                }}
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

      <div className="flex justify-start">
        <button onClick={() => handlers.onAddChildNode(node.id)}>⊕</button>
      </div>
    </>
  );
};

export default FlowNodeComponent;
