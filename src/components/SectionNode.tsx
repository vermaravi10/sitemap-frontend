import { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
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
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  updateNodeTitle,
  addSection,
  removeSection,
  updateSection,
  reorderSections,
  removeNode,
  addNode,
} from "../store/boardSlice";

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

  const style = {
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  return (
    <div
      ref={setNodeRef}
      className="bg-white border border-gray-200 rounded-md p-3 mb-2 shadow-sm hover:shadow-md transition-shadow"
      style={{ ...style }} // keep touch from scrolling
      onPointerDown={(e) => e.stopPropagation()} // bubble phase — OK
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
            onKeyPress={handleKeyPress}
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

const SectionNode: React.FC<NodeProps> = ({ id }) => {
  const dispatch = useAppDispatch();
  const node = useAppSelector((state) =>
    state.board.nodes.find((n) => n.id === id)
  );
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(node?.title || "");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionContent, setNewSectionContent] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!node) return null;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    if (title.trim() !== node.title) {
      dispatch(updateNodeTitle({ id: node.id, title: title.trim() }));
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

  const handleRemoveSection = (sectionId: string) => {
    dispatch(removeSection({ nodeId: node.id, sectionId }));
  };

  const handleUpdateSection = (
    sectionId: string,
    title: string,
    content: string
  ) => {
    dispatch(updateSection({ nodeId: node.id, sectionId, title, content }));
  };

  const handleDragStart = () => {
    // Add dragging class to body to prevent scrolling
    document.body.classList.add("dragging");

    // Add event listeners to prevent scrolling
    const preventScroll = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Prevent wheel, touchmove, and mousemove events
    document.addEventListener("wheel", preventScroll, {
      passive: false,
      capture: true,
    });
    document.addEventListener("touchmove", preventScroll, {
      passive: false,
      capture: true,
    });
    document.addEventListener("mousemove", preventScroll, {
      passive: false,
      capture: true,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Remove dragging class from body
    document.body.classList.remove("dragging");

    // Remove event listeners
    const preventScroll = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    document.removeEventListener("wheel", preventScroll, { capture: true });
    document.removeEventListener("touchmove", preventScroll, { capture: true });
    document.removeEventListener("mousemove", preventScroll, { capture: true });

    if (active.id !== over?.id && over) {
      const oldIndex = node.sections.findIndex(
        (section) => section.id === active.id
      );
      const newIndex = node.sections.findIndex(
        (section) => section.id === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        dispatch(reorderSections({ nodeId: node.id, oldIndex, newIndex }));
      }
    }
  };

  const handleRemoveNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to remove this node?")) {
      dispatch(removeNode(node.id));
    }
  };

  const handleAddChildNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(addNode({ parentId: node.id }));
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
      <div className="bg-gradient-to-r from-[#e1e4e8] to-[#939ca3] border-2 border-gray-300 rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]">
        <Handle type="target" position={Position.Top} className="w-3 h-3" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                onKeyPress={handleKeyPress}
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
          <button
            onClick={handleRemoveNode}
            className="ml-2 text-red-500 hover:text-red-700 text-lg font-bold px-2 py-1 rounded hover:bg-red-50"
          >
            ×
          </button>
        </div>

        <div className="mb-4 rf-nopan">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            autoScroll={false}
          >
            <SortableContext
              items={node.sections.map((section) => section.id)}
              strategy={verticalListSortingStrategy}
            >
              {node.sections.map((section) => (
                <SortableSection
                  key={section.id}
                  id={section.id}
                  title={section.title}
                  content={section.content}
                  onRemove={() => handleRemoveSection(section.id)}
                  onUpdate={(title, content) =>
                    handleUpdateSection(section.id, title, content)
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
                onClick={handleCancelAddForm}
                className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className=" flex justify-center space-y-2">
            <button
              onClick={handleShowAddForm}
              className="w-1/2 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
            >
              + Add Section
            </button>
          </div>
        )}

        <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
      </div>
      <div className="flex justify-start">
        <button
          onClick={handleAddChildNode}
          //   className="w-1/3 my-2 py-2 border-2 border-dashed border-blue-300 rounded-md text-blue-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          ⊕
        </button>
      </div>
    </>
  );
};

export default SectionNode;
