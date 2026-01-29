import { useState } from "react";
import { CheckSquare, Trash2, Tag as TagIcon, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskStatus } from "@/hooks/useTasks";
import { Tag } from "@/hooks/useTags";

interface BulkActionsProps {
  selectedCount: number;
  tags: Tag[];
  onChangeStatus: (status: TaskStatus) => void;
  onDelete: () => void;
  onAssignTag: (tagId: string) => void;
  onClearSelection: () => void;
}

export function BulkActions({
  selectedCount,
  tags,
  onChangeStatus,
  onDelete,
  onAssignTag,
  onClearSelection,
}: BulkActionsProps) {
  const [isTagOpen, setIsTagOpen] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl shadow-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-primary" />
          <span className="font-medium">{selectedCount} selected</span>
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Status Change */}
        <Select onValueChange={(v) => onChangeStatus(v as TaskStatus)}>
          <SelectTrigger className="w-auto gap-2 border-0 bg-transparent hover:bg-accent">
            <ArrowRight className="w-4 h-4" />
            <span>Move to</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>

        {/* Assign Tag */}
        <Popover open={isTagOpen} onOpenChange={setIsTagOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <TagIcon className="w-4 h-4" />
              Assign Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="center">
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">No tags available</p>
              ) : (
                tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      onAssignTag(tag.id);
                      setIsTagOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                  >
                    <Badge
                      className="text-xs"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                        borderColor: tag.color,
                      }}
                    >
                      {tag.name}
                    </Badge>
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Delete */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </Button>

        <div className="w-px h-6 bg-border" />

        {/* Clear Selection */}
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
