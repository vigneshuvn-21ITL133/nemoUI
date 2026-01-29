import { useState } from "react";
import { Circle, Clock, Check, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Task, TaskStatus } from "@/hooks/useTasks";
import { Tag } from "@/hooks/useTags";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  taskTagsMap?: Record<string, Tag[]>;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDragStart: (task: Task) => void;
  onDragEnd: () => void;
  onDrop: (status: TaskStatus) => void;
  isDragOver: boolean;
  selectionMode?: boolean;
  selectedTaskIds?: Set<string>;
  onToggleSelect?: (taskId: string) => void;
}

const statusConfig = {
  todo: { label: "To Do", icon: Circle },
  in_progress: { label: "In Progress", icon: Clock },
  done: { label: "Done", icon: Check },
};

export function TaskColumn({
  status,
  tasks,
  taskTagsMap = {},
  onEdit,
  onDelete,
  onStatusChange,
  onDragStart,
  onDragEnd,
  onDrop,
  isDragOver,
  selectionMode = false,
  selectedTaskIds = new Set(),
  onToggleSelect,
}: TaskColumnProps) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const [draggedOverTaskId, setDraggedOverTaskId] = useState<string | null>(null);

  const selectAllInColumn = () => {
    tasks.forEach(task => {
      if (!selectedTaskIds.has(task.id)) {
        onToggleSelect?.(task.id);
      }
    });
  };

  return (
    <div
      className={cn(
        "space-y-4 min-h-[200px] rounded-lg p-2 transition-colors",
        isDragOver && "bg-primary/5 ring-2 ring-primary/20"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(status);
      }}
    >
      <div className="flex items-center gap-2">
        {selectionMode && tasks.length > 0 && (
          <button
            onClick={selectAllInColumn}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Select all
          </button>
        )}
        <StatusIcon className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold">{config.label}</h3>
        <Badge variant="secondary" className="ml-auto">
          {tasks.length}
        </Badge>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={cn("relative", selectionMode && "flex gap-2")}
            draggable={!selectionMode}
            onDragStart={(e) => {
              if (selectionMode) return;
              e.dataTransfer.effectAllowed = "move";
              onDragStart(task);
            }}
            onDragEnd={onDragEnd}
            onDragOver={() => setDraggedOverTaskId(task.id)}
            onDragLeave={() => setDraggedOverTaskId(null)}
          >
            {selectionMode && (
              <div className="flex items-center pt-4">
                <Checkbox
                  checked={selectedTaskIds.has(task.id)}
                  onCheckedChange={() => onToggleSelect?.(task.id)}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            )}
            <div className={cn("flex-1", selectionMode && selectedTaskIds.has(task.id) && "ring-2 ring-primary rounded-lg")}>
              <TaskCard
                task={task}
                tags={taskTagsMap[task.id] || []}
                onEdit={onEdit}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
                isDragging={draggedOverTaskId === task.id}
              />
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div
            className={cn(
              "text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg transition-colors",
              isDragOver && "border-primary bg-primary/5"
            )}
          >
            {isDragOver ? "Drop here" : "No tasks"}
          </div>
        )}
      </div>
    </div>
  );
}
