import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Edit, Trash2, GripVertical } from "lucide-react";
import { Example } from "@/hooks/useExamples";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableExamplesGridProps {
  examples: Example[];
  onEdit: (example: Example) => void;
  onDelete: (id: string) => void;
  onReorder: (reorderedExamples: Example[]) => void;
}

interface SortableExampleCardProps {
  example: Example;
  onEdit: () => void;
  onDelete: () => void;
}

const SortableExampleCard = ({ example, onEdit, onDelete }: SortableExampleCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: example.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className={`hover:shadow-elegant transition-all duration-300 ${isDragging ? 'z-50' : ''}`}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 flex-1">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:cursor-grabbing p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{example.title}</CardTitle>
              <span className="text-sm bg-brand-primary/10 text-brand-primary px-2 py-1 rounded-full">
                {example.category}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">{example.description}</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Image Avant</Label>
            <div className="h-20 bg-gray-100 rounded border overflow-hidden">
              {example.beforeImage ? (
                <img 
                  src={example.beforeImage} 
                  alt="Image avant" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<div class="h-full flex items-center justify-center text-xs text-gray-500">Image introuvable</div>';
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-500">
                  Aucune image
                </div>
              )}
            </div>
          </div>
          <div>
            <Label className="text-xs">Image Après</Label>
            <div className="h-20 bg-gray-100 rounded border overflow-hidden">
              {example.afterImage ? (
                <img 
                  src={example.afterImage} 
                  alt="Image après" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<div class="h-full flex items-center justify-center text-xs text-gray-500">Image introuvable</div>';
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-500">
                  Aucune image
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const SortableExamplesGrid = ({ examples, onEdit, onDelete, onReorder }: SortableExamplesGridProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = examples.findIndex(example => example.id.toString() === active.id);
      const newIndex = examples.findIndex(example => example.id.toString() === over?.id);
      
      const reorderedItems = arrayMove(examples, oldIndex, newIndex);
      onReorder(reorderedItems);
    }
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={examples.map(ex => ex.id.toString())}
        strategy={verticalListSortingStrategy}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {examples.map((example) => (
            <SortableExampleCard
              key={example.id}
              example={example}
              onEdit={() => onEdit(example)}
              onDelete={() => onDelete(example.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};