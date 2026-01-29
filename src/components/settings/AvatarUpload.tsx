import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  userName: string;
  onAvatarUpdate: (url: string) => void;
}

export function AvatarUpload({ currentAvatarUrl, userName, onAvatarUpdate }: AvatarUploadProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState([1]);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [displayUrl, setDisplayUrl] = useState<string | null>(currentAvatarUrl);

  // Update display URL when prop changes or when we update it
  useEffect(() => {
    if (currentAvatarUrl) {
      // Add cache-busting query param
      const url = new URL(currentAvatarUrl);
      url.searchParams.set('t', Date.now().toString());
      setDisplayUrl(url.toString());
    } else {
      setDisplayUrl(null);
    }
  }, [currentAvatarUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setZoom([1]);
      setOffset({ x: 0, y: 0 });
      setIsOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const cropAndUpload = useCallback(async () => {
    if (!selectedImage || !canvasRef.current || !user) return;

    setIsUploading(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      const size = 256; // Final avatar size
      canvas.width = size;
      canvas.height = size;

      ctx.clearRect(0, 0, size, size);
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      const scale = zoom[0];
      const imgSize = Math.min(img.width, img.height) * scale;
      const sx = (img.width - imgSize / scale) / 2 - offset.x / scale;
      const sy = (img.height - imgSize / scale) / 2 - offset.y / scale;

      ctx.drawImage(img, sx, sy, imgSize / scale, imgSize / scale, 0, 0, size, size);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error("Failed to process image");
          setIsUploading(false);
          return;
        }

        const timestamp = Date.now();
        const fileName = `${user.id}/avatar-${timestamp}.png`;

        // Delete old avatars first (optional cleanup)
        try {
          const { data: existingFiles } = await supabase.storage
            .from("user-files")
            .list(user.id, { search: "avatar-" });
          
          if (existingFiles && existingFiles.length > 0) {
            const filesToDelete = existingFiles.map(f => `${user.id}/${f.name}`);
            await supabase.storage.from("user-files").remove(filesToDelete);
          }
        } catch (error) {
          console.log("Cleanup error (non-critical):", error);
        }

        const { error: uploadError } = await supabase.storage
          .from("user-files")
          .upload(fileName, blob, { upsert: true, contentType: "image/png" });

        if (uploadError) {
          toast.error("Failed to upload avatar: " + uploadError.message);
          setIsUploading(false);
          return;
        }

        // Get signed URL for private bucket
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("user-files")
          .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiry

        if (signedUrlError || !signedUrlData?.signedUrl) {
          toast.error("Failed to get avatar URL");
          setIsUploading(false);
          return;
        }

        const avatarUrl = signedUrlData.signedUrl;

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_url: avatarUrl })
          .eq("user_id", user.id);

        if (updateError) {
          toast.error("Failed to update profile");
        } else {
          // Update display immediately
          setDisplayUrl(avatarUrl);
          onAvatarUpdate(avatarUrl);
          toast.success("Avatar updated successfully");
        }

        setIsUploading(false);
        setIsOpen(false);
        setSelectedImage(null);
      }, "image/png");
    };
    img.src = selectedImage;
  }, [selectedImage, zoom, offset, user, onAvatarUpdate]);

  const initials = userName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <>
      <div className="relative group">
        <Avatar className="w-20 h-20">
          <AvatarImage src={displayUrl || undefined} key={displayUrl} />
          <AvatarFallback className="text-xl bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Camera className="w-6 h-6 text-foreground" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crop Avatar</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Preview area */}
            <div
              className="relative w-64 h-64 mx-auto overflow-hidden rounded-full border-2 border-dashed border-border cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="absolute w-full h-full object-cover pointer-events-none"
                  style={{
                    transform: `scale(${zoom[0]}) translate(${offset.x / zoom[0]}px, ${offset.y / zoom[0]}px)`,
                  }}
                  draggable={false}
                />
              )}
            </div>

            {/* Zoom slider */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Zoom</label>
              <Slider
                value={zoom}
                onValueChange={setZoom}
                min={1}
                max={3}
                step={0.1}
              />
            </div>

            {/* Hidden canvas for cropping */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={cropAndUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Save Avatar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
