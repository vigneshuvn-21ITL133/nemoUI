import { useState } from "react";
import { FileText, Download, Trash2, Search, Grid, List, MoreVertical, File, Image, FileSpreadsheet, FileType, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useFiles, FileItem } from "@/hooks/useFiles";
import { FileDropzone } from "@/components/files/FileDropzone";
import { FileUploadProgress } from "@/components/files/FileUploadProgress";
import { formatFileSize } from "@/lib/imageCompression";
import { format } from "date-fns";

const getFileIcon = (mimeType: string | null) => {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return FileSpreadsheet;
  if (mimeType.includes("pdf")) return FileType;
  return File;
};

export default function Files() {
  const { files, isLoading, uploadFile, deleteFile, getDownloadUrl, uploadProgress } = useFiles();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFilesSelected = async (selectedFiles: File[]) => {
    for (const file of selectedFiles) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 20MB.`);
        continue;
      }
      await uploadFile.mutateAsync(file);
    }
    setIsUploadOpen(false);
  };

  const handleDelete = (file: FileItem) => {
    deleteFile.mutate(file);
  };

  const handleDownload = async (file: FileItem) => {
    const url = await getDownloadUrl(file.storage_path);
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloading ${file.name}...`);
    } else {
      toast.error("Failed to get download URL");
    }
  };

  const uploadingFiles = Object.entries(uploadProgress);

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
        title="Files"
        description="Manage and organize your files"
        icon={<FileText className="w-6 h-6 text-module-file" />}
        actions={
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <FileText className="w-4 h-4" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload File</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <FileDropzone onFilesSelected={handleFilesSelected} />
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map(([fileName, progress]) => (
            <FileUploadProgress key={fileName} fileName={fileName} progress={progress} />
          ))}
        </div>
      )}

      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center border border-border rounded-lg">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="rounded-r-none"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="rounded-l-none"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Drag and Drop Area */}
      <FileDropzone
        onFilesSelected={handleFilesSelected}
        className="border-border hover:border-primary/50"
      />

      {/* Files Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredFiles.map((file) => {
            const FileIcon = getFileIcon(file.mime_type);
            return (
              <Card key={file.id} className="group hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-module-file/10 flex items-center justify-center">
                      <FileIcon className="w-6 h-6 text-module-file" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDownload(file)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(file)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h3 className="font-medium text-sm truncate">{file.name}</h3>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(file.size_bytes)}</span>
                    <span>{format(new Date(file.created_at), "MMM d, yyyy")}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Size</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Uploaded</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => {
                  const FileIcon = getFileIcon(file.mime_type);
                  return (
                    <tr key={file.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <FileIcon className="w-5 h-5 text-module-file flex-shrink-0" />
                          <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{formatFileSize(file.size_bytes)}</td>
                      <td className="p-4 text-muted-foreground">{format(new Date(file.created_at), "MMM d, yyyy")}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(file)}>
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(file)} className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {filteredFiles.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No files found</h3>
          <p className="text-muted-foreground">Upload a file to get started</p>
        </div>
      )}
    </div>
  );
}
