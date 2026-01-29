import { useState } from "react";
import { Plus, X, Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTags, Tag } from "@/hooks/useTags";

const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#6b7280", // gray
];

interface TagManagerProps {
  selectedTags: string[];
  onToggleTag: (tagId: string) => void;
}

export function TagManager({ selectedTags, onToggleTag }: TagManagerProps) {
  const { tags, createTag } = useTags();
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[4]);
  const [isOpen, setIsOpen] = useState(false);

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    createTag.mutate({ name: newTagName.trim(), color: newTagColor });
    setNewTagName("");
    setNewTagColor(PRESET_COLORS[4]);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <TagIcon className="w-4 h-4" />
          Tags
          {selectedTags.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {selectedTags.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          <div className="text-sm font-medium">Select Tags</div>
          
          {/* Existing tags */}
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                className="cursor-pointer transition-all"
                style={{
                  backgroundColor: selectedTags.includes(tag.id) ? tag.color : "transparent",
                  borderColor: tag.color,
                  color: selectedTags.includes(tag.id) ? "white" : tag.color,
                }}
                onClick={() => onToggleTag(tag.id)}
              >
                {tag.name}
                {selectedTags.includes(tag.id) && (
                  <X className="w-3 h-3 ml-1" />
                )}
              </Badge>
            ))}
            {tags.length === 0 && (
              <p className="text-xs text-muted-foreground">No tags yet. Create one below.</p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Create new tag */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Create New Tag</div>
            <div className="flex gap-2">
              <Input
                placeholder="Tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
              />
              <Button size="sm" className="h-8" onClick={handleCreateTag} disabled={!newTagName.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Color picker */}
            <div className="flex gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor: newTagColor === color ? "hsl(var(--foreground))" : "transparent",
                  }}
                  onClick={() => setNewTagColor(color)}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface TaskTagsDisplayProps {
  taskId: string;
  tags: Tag[];
  compact?: boolean;
}

export function TaskTagsDisplay({ taskId, tags, compact }: TaskTagsDisplayProps) {
  if (!tags || tags.length === 0) return null;
  
  const displayTags = compact ? tags.slice(0, 2) : tags;
  const remainingCount = tags.length - displayTags.length;

  return (
    <div className="flex flex-wrap gap-1">
      {displayTags.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          className="text-xs px-1.5 py-0"
          style={{
            backgroundColor: `${tag.color}20`,
            color: tag.color,
            borderColor: tag.color,
          }}
        >
          {tag.name}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="secondary" className="text-xs px-1.5 py-0">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}
