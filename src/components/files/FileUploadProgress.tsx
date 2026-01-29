import { Progress } from "@/components/ui/progress";
import { FileText, CheckCircle } from "lucide-react";

interface FileUploadProgressProps {
  fileName: string;
  progress: number;
}

export function FileUploadProgress({ fileName, progress }: FileUploadProgressProps) {
  const isComplete = progress >= 100;

  return (
    <div className="flex items-center gap-3 p-3 border border-border rounded-lg bg-card">
      <div className="w-10 h-10 rounded-lg bg-module-file/10 flex items-center justify-center flex-shrink-0">
        {isComplete ? (
          <CheckCircle className="w-5 h-5 text-module-task" />
        ) : (
          <FileText className="w-5 h-5 text-module-file" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileName}</p>
        <div className="flex items-center gap-2 mt-1">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground w-8">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
