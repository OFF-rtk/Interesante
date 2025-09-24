"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Upload, FileVideo, X, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFileSelect?: (file: File) => void;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  disabled?: boolean;
}

export function UploadZone({ 
  onFileSelect,
  maxSize = 500,
  acceptedTypes = [".mp4", ".mov", ".avi", ".mkv", ".wmv"],
  disabled = false
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setUploadStatus("error");
      return;
    }

    // Validate file type
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension || "")) {
      setUploadStatus("error");
      return;
    }

    setSelectedFile(file);
    setUploadStatus("idle");
    onFileSelect?.(file);
  };

  const simulateUpload = () => {
    setUploadStatus("uploading");
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadStatus("success");
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadStatus("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!selectedFile && (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-all",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">
            {isDragOver ? "Drop your video here" : "Upload your video"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop or click to select • Max {maxSize}MB
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            Supports: {acceptedTypes.join(", ")}
          </p>
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <FileVideo className="mr-2 h-4 w-4" />
            Select Video File
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(",")}
            onChange={handleFileInput}
            className="hidden"
            disabled={disabled}
          />
        </div>
      )}

      {/* File Selected */}
      {selectedFile && (
        <div className="border rounded-lg p-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileVideo className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {uploadStatus === "success" && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {uploadStatus === "error" && (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
              {uploadStatus !== "uploading" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSelection}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Upload Progress */}
          {uploadStatus === "uploading" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Upload Button */}
          {uploadStatus === "idle" && (
            <Button
              onClick={simulateUpload}
              className="w-full"
              disabled={disabled}
            >
              <Upload className="mr-2 h-4 w-4" />
              Start Analysis
            </Button>
          )}

          {/* Status Messages */}
          {uploadStatus === "success" && (
            <div className="text-center text-sm text-green-600">
              Upload complete! Analysis will begin shortly.
            </div>
          )}

          {uploadStatus === "error" && (
            <div className="text-center text-sm text-destructive">
              Upload failed. Please check file size and format.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
