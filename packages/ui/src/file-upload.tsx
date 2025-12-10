"use client";

import * as React from "react";
import { Button } from "./button";
import { cn } from "./index";
import { Progress } from "./progress";

interface FileUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  accept?: string;
  maxSize?: number; // in bytes
  multiple?: boolean;
  disabled?: boolean;
  uploading?: boolean;
  progress?: number;
  onFileSelect?: (files: File[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  value?: string | null;
  onClear?: () => void;
  placeholder?: string;
  variant?: "default" | "compact" | "dropzone";
}

export function FileUpload({
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = false,
  disabled = false,
  uploading = false,
  progress = 0,
  onFileSelect,
  onUpload,
  value,
  onClear,
  placeholder = "Drop files here or click to upload",
  variant = "default",
  className,
  ...props
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (value) {
      setPreview(value);
    }
  }, [value]);

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`;
    }
    if (accept) {
      const acceptedTypes = accept.split(",").map((t) => t.trim());
      const fileType = file.type;
      const fileExtension = `.${file.name.split(".").pop()}`;

      const isAccepted = acceptedTypes.some((type) => {
        if (type.startsWith(".")) {
          return fileExtension.toLowerCase() === type.toLowerCase();
        }
        if (type.endsWith("/*")) {
          return fileType.startsWith(type.replace("/*", "/"));
        }
        return fileType === type;
      });

      if (!isAccepted) {
        return `File type not accepted. Accepted types: ${accept}`;
      }
    }
    return null;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    const fileArray = Array.from(files);

    // Validate files
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Create preview for images
    if (fileArray[0] && fileArray[0].type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(fileArray[0]);
    }

    onFileSelect?.(fileArray);

    if (onUpload) {
      await onUpload(fileArray);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleClear = () => {
    setPreview(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onClear?.();
  };

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)} {...props}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled || uploading}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Uploading..." : "Choose File"}
        </Button>
        {preview && (
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
            Clear
          </Button>
        )}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)} {...props}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={cn(
          "relative flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "cursor-not-allowed opacity-50",
          preview && "border-solid",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled || uploading}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        {preview ? (
          <div className="relative">
            {accept?.includes("image") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Preview"
                className="max-h-40 rounded-md object-contain"
              />
            ) : (
              <div className="flex items-center gap-2 rounded-md bg-muted p-4">
                <span className="text-sm">File selected</span>
              </div>
            )}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -right-2 -top-2"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            >
              ×
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{placeholder}</p>
            {maxSize && (
              <p className="mt-1 text-xs text-muted-foreground">
                Max size: {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            )}
          </div>
        )}
      </div>

      {uploading && <Progress value={progress} className="h-2" />}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
