import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface TaskTag {
  id: string;
  task_id: string;
  tag_id: string;
  created_at: string;
}

export function useTags() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["tags", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data as Tag[];
    },
    enabled: !!user,
  });

  const createTag = useMutation({
    mutationFn: async (tag: { name: string; color: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("tags")
        .insert({ ...tag, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create tag: " + error.message);
    },
  });

  const updateTag = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tag> & { id: string }) => {
      const { data, error } = await supabase
        .from("tags")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update tag: " + error.message);
    },
  });

  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete tag: " + error.message);
    },
  });

  return { tags, isLoading, createTag, updateTag, deleteTag };
}

export function useTaskTags(taskId?: string) {
  const queryClient = useQueryClient();

  const { data: taskTags = [], isLoading } = useQuery({
    queryKey: ["task-tags", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const { data, error } = await supabase
        .from("task_tags")
        .select("*, tags(*)")
        .eq("task_id", taskId);
      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });

  const addTagToTask = useMutation({
    mutationFn: async ({ taskId, tagId }: { taskId: string; tagId: string }) => {
      const { data, error } = await supabase
        .from("task_tags")
        .insert({ task_id: taskId, tag_id: tagId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-tags"] });
    },
    onError: (error) => {
      toast.error("Failed to add tag: " + error.message);
    },
  });

  const removeTagFromTask = useMutation({
    mutationFn: async ({ taskId, tagId }: { taskId: string; tagId: string }) => {
      const { error } = await supabase
        .from("task_tags")
        .delete()
        .eq("task_id", taskId)
        .eq("tag_id", tagId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-tags"] });
    },
    onError: (error) => {
      toast.error("Failed to remove tag: " + error.message);
    },
  });

  return { taskTags, isLoading, addTagToTask, removeTagFromTask };
}
