import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState } from "react";

export interface FileItem {
  id: string;
  name: string;
  storage_path: string;
  size_bytes: number;
  mime_type: string | null;
  created_at: string;
  user_id: string;
}

export function useFiles() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["files", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FileItem[];
    },
    enabled: !!user,
  });

  const uploadFile = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not authenticated");

      // Generate a unique ID without crypto.randomUUID for browser compatibility
      const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      const storagePath = `${user.id}/${fileId}-${file.name}`;

      // Simulate progress updates
      setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
      
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const current = prev[file.name] || 0;
          if (current >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, [file.name]: current + 10 };
        });
      }, 100);

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("user-files")
        .upload(storagePath, file);

      clearInterval(progressInterval);
      setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));

      if (uploadError) throw uploadError;

      // Create file record
      const { data, error } = await supabase
        .from("files")
        .insert({
          user_id: user.id,
          name: file.name,
          storage_path: storagePath,
          size_bytes: file.size,
          mime_type: file.type || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Clean up progress after a delay
      setTimeout(() => {
        setUploadProgress((prev) => {
          const { [file.name]: _, ...rest } = prev;
          return rest;
        });
      }, 1000);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("File uploaded successfully");
    },
    onError: (error) => {
      toast.error("Failed to upload file: " + error.message);
    },
  });

  const deleteFile = useMutation({
    mutationFn: async (file: FileItem) => {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from("user-files")
        .remove([file.storage_path]);

      if (storageError) throw storageError;

      // Delete record
      const { error } = await supabase.from("files").delete().eq("id", file.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast.success("File deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete file: " + error.message);
    },
  });

  const getDownloadUrl = async (storagePath: string): Promise<string | null> => {
    const { data } = await supabase.storage
      .from("user-files")
      .createSignedUrl(storagePath, 3600); // 1 hour expiry
    return data?.signedUrl || null;
  };

  return { files, isLoading, uploadFile, deleteFile, getDownloadUrl, uploadProgress };
}
