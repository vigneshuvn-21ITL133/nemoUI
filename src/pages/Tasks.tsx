import { useState, useEffect } from "react";
import { CheckSquare, Plus, Search, Loader2, ListChecks } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTasks, Task, TaskStatus, TaskPriority } from "@/hooks/useTasks";
import { useTags, Tag } from "@/hooks/useTags";
import { TaskColumn } from "@/components/tasks/TaskColumn";
import { TagManager } from "@/components/tasks/TagManager";
import { BulkActions } from "@/components/tasks/BulkActions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Tasks() {
  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks();
  const { tags } = useTags();
  const [taskTagsMap, setTaskTagsMap] = useState<Record<string, Tag[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [editingTagIds, setEditingTagIds] = useState<string[]>([]);
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    priority: TaskPriority;
    due_date: string;
  }>({ title: "", description: "", priority: "medium", due_date: "" });

  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  
  // Bulk selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  // Fetch task tags
  useEffect(() => {
    const fetchTaskTags = async () => {
      if (tasks.length === 0) return;
      
      const { data, error } = await supabase
        .from("task_tags")
        .select("task_id, tag_id, tags(*)")
        .in("task_id", tasks.map(t => t.id));
      
      if (error) return;
      
      const tagsMap: Record<string, Tag[]> = {};
      data.forEach((item: any) => {
        if (!tagsMap[item.task_id]) tagsMap[item.task_id] = [];
        if (item.tags) tagsMap[item.task_id].push(item.tags);
      });
      setTaskTagsMap(tagsMap);
    };
    
    fetchTaskTags();
  }, [tasks]);

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const groupedTasks = {
    todo: filteredTasks.filter((t) => t.status === "todo"),
    in_progress: filteredTasks.filter((t) => t.status === "in_progress"),
    done: filteredTasks.filter((t) => t.status === "done"),
  };

  const handleCreate = async () => {
    if (!newTask.title.trim()) return;
    
    const result = await createTask.mutateAsync({
      title: newTask.title,
      description: newTask.description || undefined,
      priority: newTask.priority,
      due_date: newTask.due_date || undefined,
    });
    
    // Add tags to the task
    if (selectedTagIds.length > 0 && result) {
      for (const tagId of selectedTagIds) {
        await supabase.from("task_tags").insert({ task_id: result.id, tag_id: tagId });
      }
    }
    
    setNewTask({ title: "", description: "", priority: "medium", due_date: "" });
    setSelectedTagIds([]);
    setIsCreateOpen(false);
  };

  const handleUpdate = async () => {
    if (!editingTask) return;
    
    updateTask.mutate({
      id: editingTask.id,
      title: editingTask.title,
      description: editingTask.description,
      priority: editingTask.priority,
      status: editingTask.status,
      due_date: editingTask.due_date,
    });
    
    // Update tags - remove all and re-add
    await supabase.from("task_tags").delete().eq("task_id", editingTask.id);
    for (const tagId of editingTagIds) {
      await supabase.from("task_tags").insert({ task_id: editingTask.id, tag_id: tagId });
    }
    
    setEditingTask(null);
    setEditingTagIds([]);
  };

  const handleEditOpen = (task: Task) => {
    setEditingTask(task);
    setEditingTagIds(taskTagsMap[task.id]?.map(t => t.id) || []);
  };

  const toggleSelectedTag = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const toggleEditingTag = (tagId: string) => {
    setEditingTagIds(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleStatusChange = (id: string, status: TaskStatus) => {
    updateTask.mutate({ id, status });
  };

  const handleDragStart = (task: Task) => {
    if (selectionMode) return;
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverStatus(null);
  };

  const handleDrop = (status: TaskStatus) => {
    if (draggedTask && draggedTask.status !== status) {
      updateTask.mutate({ id: draggedTask.id, status });
    }
    handleDragEnd();
  };

  // Bulk actions handlers
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleBulkStatusChange = async (status: TaskStatus) => {
    const ids = Array.from(selectedTaskIds);
    for (const id of ids) {
      await updateTask.mutateAsync({ id, status });
    }
    toast.success(`Moved ${ids.length} tasks to ${status.replace("_", " ")}`);
    setSelectedTaskIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedTaskIds.size} tasks?`)) return;
    const ids = Array.from(selectedTaskIds);
    for (const id of ids) {
      await deleteTask.mutateAsync(id);
    }
    toast.success(`Deleted ${ids.length} tasks`);
    setSelectedTaskIds(new Set());
    setSelectionMode(false);
  };

  const handleBulkAssignTag = async (tagId: string) => {
    const ids = Array.from(selectedTaskIds);
    for (const id of ids) {
      // Check if tag already exists
      const existingTags = taskTagsMap[id]?.map(t => t.id) || [];
      if (!existingTags.includes(tagId)) {
        await supabase.from("task_tags").insert({ task_id: id, tag_id: tagId });
      }
    }
    toast.success(`Added tag to ${ids.length} tasks`);
  };

  const clearSelection = () => {
    setSelectedTaskIds(new Set());
    setSelectionMode(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Tasks"
        description="Manage and track your tasks"
        icon={<CheckSquare className="w-6 h-6 text-module-task" />}
        actions={
          <div className="flex gap-2">
            <Button
              variant={selectionMode ? "secondary" : "outline"}
              className="gap-2"
              onClick={() => {
                setSelectionMode(!selectionMode);
                if (selectionMode) setSelectedTaskIds(new Set());
              }}
            >
              <ListChecks className="w-4 h-4" />
              {selectionMode ? "Cancel" : "Select"}
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter task title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter task description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select
                        value={newTask.priority}
                        onValueChange={(v) => setNewTask({ ...newTask, priority: v as TaskPriority })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={newTask.due_date}
                        onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <TagManager 
                      selectedTags={selectedTagIds} 
                      onToggleTag={toggleSelectedTag} 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={createTask.isPending}>
                    {createTask.isPending ? "Creating..." : "Create Task"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Task Columns */}
      <div
        className="grid gap-6 lg:grid-cols-3"
        onDragOver={(e) => e.preventDefault()}
      >
        {(["todo", "in_progress", "done"] as TaskStatus[]).map((status) => (
            <TaskColumn
              key={status}
              status={status}
              tasks={groupedTasks[status]}
              taskTagsMap={taskTagsMap}
              onEdit={handleEditOpen}
              onDelete={(id) => deleteTask.mutate(id)}
              onStatusChange={handleStatusChange}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              isDragOver={draggedTask !== null && draggedTask.status !== status && dragOverStatus === status}
              selectionMode={selectionMode}
              selectedTaskIds={selectedTaskIds}
              onToggleSelect={toggleTaskSelection}
          />
        ))}
      </div>

      {/* Bulk Actions Bar */}
      <BulkActions
        selectedCount={selectedTaskIds.size}
        tags={tags}
        onChangeStatus={handleBulkStatusChange}
        onDelete={handleBulkDelete}
        onAssignTag={handleBulkAssignTag}
        onClearSelection={clearSelection}
      />

      {/* Edit Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => { if (!open) { setEditingTask(null); setEditingTagIds([]); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingTask.description || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={editingTask.priority}
                    onValueChange={(v) => setEditingTask({ ...editingTask, priority: v as TaskPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editingTask.status}
                    onValueChange={(v) => setEditingTask({ ...editingTask, status: v as TaskStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={editingTask.due_date || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Tags</Label>
                <TagManager 
                  selectedTags={editingTagIds} 
                  onToggleTag={toggleEditingTag} 
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleUpdate} disabled={updateTask.isPending}>
              {updateTask.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
