import { Check, Edit2, Trash2, GripVertical, Calendar, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Task, TaskStatus } from "@/hooks/useTasks";
import { Tag } from "@/hooks/useTags";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { TaskTagsDisplay } from "./TagManager";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface TaskCardProps {
  task: Task;
  tags?: Tag[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  isDragging?: boolean;
}

const priorityConfig = {
  low: { label: "Low", color: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", color: "bg-secondary text-secondary-foreground" },
  high: { label: "High", color: "bg-destructive text-destructive-foreground" },
};

export function TaskCard({ task, tags = [], onEdit, onDelete, onStatusChange, isDragging }: TaskCardProps) {
  const { user } = useAuth();

  const toggleStatus = () => {
    const statusOrder: TaskStatus[] = ["todo", "in_progress", "done"];
    const currentIndex = statusOrder.indexOf(task.status);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    onStatusChange(task.id, nextStatus);
  };

  const getDueDateInfo = () => {
    if (!task.due_date) return null;
    const dueDate = new Date(task.due_date);
    
    if (task.status === "done") {
      return { text: format(dueDate, "MMM d"), className: "text-muted-foreground" };
    }
    
    if (isPast(dueDate) && !isToday(dueDate)) {
      return { text: "Overdue", className: "text-destructive font-medium" };
    }
    if (isToday(dueDate)) {
      return { text: "Due today", className: "text-warning font-medium" };
    }
    if (isTomorrow(dueDate)) {
      return { text: "Tomorrow", className: "text-primary" };
    }
    return { text: format(dueDate, "MMM d"), className: "text-muted-foreground" };
  };

  const dueDateInfo = getDueDateInfo();

  const sendReminder = async () => {
    if (!user?.email || !task.due_date) return;
    
    try {
      const response = await supabase.functions.invoke("send-task-reminder", {
        body: {
          taskId: task.id,
          taskTitle: task.title,
          dueDate: task.due_date,
          userEmail: user.email,
        },
      });
      
      if (response.error) throw response.error;
      toast.success("Reminder email sent!");
    } catch (error: any) {
      toast.error("Failed to send reminder: " + error.message);
    }
  };

  return (
    <Card
      className={cn(
        "group hover:shadow-md transition-all cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 rotate-2 shadow-lg"
      )}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <GripVertical className="w-4 h-4 mt-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            <button onClick={toggleStatus} className="mt-0.5 flex-shrink-0">
              <div
                className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                  task.status === "done"
                    ? "bg-module-task border-module-task"
                    : "border-muted-foreground hover:border-primary"
                )}
              >
                {task.status === "done" && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h4
              className={cn(
                "font-medium",
                task.status === "done" && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </h4>
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {task.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {task.due_date && (
              <Button variant="ghost" size="sm" onClick={sendReminder} title="Send reminder email">
                <Bell className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task.id)}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {/* Tags */}
        {tags.length > 0 && (
          <TaskTagsDisplay taskId={task.id} tags={tags} compact />
        )}
        
        <div className="flex items-center justify-between">
          <Badge className={priorityConfig[task.priority].color}>
            {priorityConfig[task.priority].label}
          </Badge>
          <div className="flex items-center gap-2">
            {dueDateInfo && (
              <span className={cn("text-xs flex items-center gap-1", dueDateInfo.className)}>
                <Calendar className="w-3 h-3" />
                {dueDateInfo.text}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {format(new Date(task.created_at), "MMM d")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
