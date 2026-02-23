"use client";

import { useState, useRef } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ImageUploadProps {
  value?: string;
  onChange?: (file: File | null) => void;
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
  fallbackInitials?: string;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled,
  className,
  fallbackInitials,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onChange?.(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onChange?.(null);
    onRemove?.();
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative group">
        <Avatar className="h-24 w-24 ring-2 ring-offset-2 ring-border overflow-hidden">
          <AvatarImage src={preview || ""} alt="Preview" className="object-cover w-full" />
          <AvatarFallback className="bg-secondary text-secondary-foreground text-2xl font-bold">
            {fallbackInitials || <Camera className="h-8 w-8 text-muted-foreground" />}
          </AvatarFallback>
        </Avatar>

        {!disabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
            onClick={() => fileInputRef.current?.click()}>
            <Camera className="h-6 w-6 text-white" />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          {preview ? "Change Image" : "Upload Image"}
        </Button>
        {preview && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            disabled={disabled}
            onClick={handleRemove}
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled}
      />
    </div>
  );
}
