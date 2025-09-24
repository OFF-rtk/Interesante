"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    ChevronDown,
    Download,
    FileText,
    Image,
    Link2,
    Mail,
    Share2
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CertificateDownloadProps {
  certificateId: string;
  videoTitle: string;
  onDownloadPDF?: () => void;
  onDownloadImage?: () => void;
  onShare?: (method: "link" | "email") => void;
  disabled?: boolean;
}

export function CertificateDownload({
  certificateId,
  videoTitle,
  onDownloadPDF,
  onDownloadImage,
  onShare,
  disabled = false
}: CertificateDownloadProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async (format: "pdf" | "image") => {
    setIsLoading(true);
    try {
      if (format === "pdf") {
        await onDownloadPDF?.();
        toast.success("Certificate PDF downloaded");
      } else {
        await onDownloadImage?.();
        toast.success("Certificate image downloaded");
      }
    } catch (error) {
      toast.error("Failed to download certificate");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = (method: "link" | "email") => {
    try {
      onShare?.(method);
      if (method === "link") {
        toast.success("Certificate link copied to clipboard");
      } else {
        toast.success("Email composer opened");
      }
    } catch (error) {
      toast.error("Failed to share certificate");
    }
  };

  return (
    <div className="flex gap-2">
      {/* Primary Download Button */}
      <Button
        onClick={() => handleDownload("pdf")}
        disabled={disabled || isLoading}
        className="flex-1 sm:flex-none"
      >
        <Download className="h-4 w-4 mr-2" />
        Download PDF
      </Button>

      {/* Download Options Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled || isLoading}
            className="px-3"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* Download Options */}
          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
            Download Options
          </div>
          
          <DropdownMenuItem onClick={() => handleDownload("pdf")}>
            <FileText className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>Download as PDF</span>
              <span className="text-xs text-muted-foreground">
                Legal document format
              </span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleDownload("image")}>
            <Image className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>Download as Image</span>
              <span className="text-xs text-muted-foreground">
                PNG format for sharing
              </span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          {/* Share Options */}
          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
            Share Certificate
          </div>
          
          <DropdownMenuItem onClick={() => handleShare("link")}>
            <Link2 className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>Copy Link</span>
              <span className="text-xs text-muted-foreground">
                Share verification link
              </span>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleShare("email")}>
            <Mail className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>Send via Email</span>
              <span className="text-xs text-muted-foreground">
                Open email composer
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Alternative compact version for table rows
export function CertificateDownloadCompact({
  certificateId,
  videoTitle,
  onDownloadPDF,
  onDownloadImage,
  onShare,
  disabled = false
}: CertificateDownloadProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: "pdf" | "image" | "link" | "email") => {
    setIsLoading(true);
    try {
      switch (action) {
        case "pdf":
          await onDownloadPDF?.();
          toast.success("PDF downloaded");
          break;
        case "image":
          await onDownloadImage?.();
          toast.success("Image downloaded");
          break;
        case "link":
          onShare?.("link");
          toast.success("Link copied");
          break;
        case "email":
          onShare?.("email");
          toast.success("Email opened");
          break;
      }
    } catch (error) {
      toast.error("Action failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled || isLoading}
        >
          <Download className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleAction("pdf")}>
          <FileText className="mr-2 h-4 w-4" />
          Download PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction("image")}>
          <Image className="mr-2 h-4 w-4" />
          Download Image
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleAction("link")}>
          <Link2 className="mr-2 h-4 w-4" />
          Copy Link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction("email")}>
          <Mail className="mr-2 h-4 w-4" />
          Email
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
