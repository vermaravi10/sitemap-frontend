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
  updateRootTitle,
  addNode,
  addSection,
  removeSection,
  reorderSections,
} from "../store/boardSlice";

interface SortableSectionProps {
  id: string;
  title: string;
  content: string;
  onRemove: () => void;
}

const SortableSection: React.FC<SortableSectionProps> = ({
  id,
  title,
  content,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white/90 border border-white/30 rounded-md p-3 shadow-sm"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-800">{title}</h4>
        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 text-sm font-medium"
        >
          ×
        </button>
      </div>
      <p className="text-gray-600 text-sm">{content}</p>

      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="rf-nopan w-full h-4 bg-white/30 rounded cursor-move hover:bg-white/50 transition-colors mt-3 flex items-center justify-center"
        style={{ touchAction: "none" }}
      >
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-white/60 rounded-full"></div>
          <div className="w-1 h-1 bg-white/60 rounded-full"></div>
          <div className="w-1 h-1 bg-white/60 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

const RootNode: React.FC<NodeProps> = () => {
  const dispatch = useAppDispatch();
  const root = useAppSelector((state) => state.board.root);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(root.title);
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

  const handleDragStart = () => {
    // Prevent canvas scrolling during drag
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
    // Remove dragging class and allow canvas scrolling
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

    const { active, over } = event;

    if (active.id !== over?.id && over) {
      const oldIndex = root.sections.findIndex(
        (section) => section.id === active.id
      );
      const newIndex = root.sections.findIndex(
        (section) => section.id === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        dispatch(reorderSections({ nodeId: "root", oldIndex, newIndex }));
      }
    }
  };

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
      <div className="bg-gradient-to-r from-[#e1e4e8] to-[#d4d4d4] rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]">
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
        <div className="mb-4 space-y-2 rf-nopan">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={root.sections?.map((section) => section.id) || []}
              strategy={verticalListSortingStrategy}
            >
              {root.sections?.map((section) => (
                <SortableSection
                  key={section.id}
                  id={section.id}
                  title={section.title}
                  content={section.content}
                  onRemove={() => handleRemoveSection(section.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
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
