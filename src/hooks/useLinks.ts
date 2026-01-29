import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Link {
  id: string;
  title: string;
  url: string;
  description: string | null;
  category: string | null;
  is_favorite: boolean;
  created_at: string;
  user_id: string;
}

export function useLinks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["links", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("links")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Link[];
    },
    enabled: !!user,
  });

  const createLink = useMutation({
    mutationFn: async (link: { title: string; url: string; description?: string; category?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("links")
        .insert({ ...link, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      toast.success("Link saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save link: " + error.message);
    },
  });

  const updateLink = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Link> & { id: string }) => {
      const { data, error } = await supabase
        .from("links")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      toast.success("Link updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update link: " + error.message);
    },
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      toast.success("Link deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete link: " + error.message);
    },
  });

  return { links, isLoading, createLink, updateLink, deleteLink };
}
