"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Download, 
  Share2, 
  Copy, 
  ExternalLink,
  Award,
  Shield,
  Hash,
  Calendar,
  User,
  FileVideo,
  CheckCircle,
  Printer
} from "lucide-react";
import { toast } from "sonner";

interface CertificateViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: {
    id: string;
    videoTitle: string;
    ownerName: string;
    ownerEmail: string;
    creationDate: string;
    analysisDate: string;
    similarityScore: number;
    videoHash: string;
    certificateHash: string;
    status: "valid" | "pending" | "revoked";
    videoDetails: {
      duration: string;
      fileSize: string;
      resolution: string;
      format: string;
    };
    analysisDetails: {
      processedFrames: number;
      audioAnalyzed: boolean;
      metadataExtracted: boolean;
      blockchainVerified: boolean;
    };
  };
  onDownload?: () => void;
  onShare?: () => void;
}

export function CertificateViewer({
  open,
  onOpenChange,
  certificate,
  onDownload,
  onShare
}: CertificateViewerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "technical" | "legal">("overview");

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getStatusBadge = (status: "valid" | "pending" | "revoked") => {
    switch (status) {
      case "valid":
        return <Badge className="bg-green-500 hover:bg-green-600">✓ Valid</Badge>;
      case "pending":
        return <Badge variant="secondary">⏳ Pending</Badge>;
      case "revoked":
        return <Badge variant="destructive">✗ Revoked</Badge>;
    }
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "technical", label: "Technical Details" },
    { id: "legal", label: "Legal Information" }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-primary" />
              <div>
                <DialogTitle className="text-2xl">Copyright Certificate</DialogTitle>
                <DialogDescription className="flex items-center gap-2 mt-1">
                  <span className="font-mono">#{certificate.id}</span>
                  {getStatusBadge(certificate.status)}
                </DialogDescription>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button size="sm" onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex border-b px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Video Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileVideo className="h-5 w-5" />
                  Video Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Title</label>
                    <p className="font-medium mt-1">{certificate.videoTitle}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Duration</label>
                    <p className="font-medium mt-1">{certificate.videoDetails.duration}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">File Size</label>
                    <p className="font-medium mt-1">{certificate.videoDetails.fileSize}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Resolution</label>
                    <p className="font-medium mt-1">{certificate.videoDetails.resolution}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Owner Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Owner Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="font-medium mt-1">{certificate.ownerName}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="font-medium mt-1">{certificate.ownerEmail}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Analysis Results */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Analysis Results
                </h3>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-medium">Similarity Score</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">
                        {certificate.similarityScore}%
                      </span>
                      <Badge variant={certificate.similarityScore < 20 ? "default" : "secondary"}>
                        {certificate.similarityScore < 20 ? "Original" : "Similar Found"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 border rounded">
                      <p className="text-2xl font-bold">{certificate.analysisDetails.processedFrames}</p>
                      <p className="text-sm text-muted-foreground">Frames Analyzed</p>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <p className="text-2xl font-bold">
                        {certificate.analysisDetails.audioAnalyzed ? "✓" : "✗"}
                      </p>
                      <p className="text-sm text-muted-foreground">Audio Analysis</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "technical" && (
            <div className="space-y-6">
              {/* Video Hash */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Video Hash (SHA-256)
                </h3>
                <div className="flex items-center gap-2 p-3 bg-muted font-mono text-sm rounded">
                  <span className="flex-1 break-all">{certificate.videoHash}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(certificate.videoHash, "Video hash")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Certificate Hash */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Certificate Hash
                </h3>
                <div className="flex items-center gap-2 p-3 bg-muted font-mono text-sm rounded">
                  <span className="flex-1 break-all">{certificate.certificateHash}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(certificate.certificateHash, "Certificate hash")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Technical Details */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Technical Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className={`h-4 w-4 ${certificate.analysisDetails.metadataExtracted ? 'text-green-500' : 'text-red-500'}`} />
                      <span className="font-medium">Metadata Extraction</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {certificate.analysisDetails.metadataExtracted ? 'Successfully extracted' : 'Failed to extract'}
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className={`h-4 w-4 ${certificate.analysisDetails.blockchainVerified ? 'text-green-500' : 'text-red-500'}`} />
                      <span className="font-medium">Blockchain Verification</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {certificate.analysisDetails.blockchainVerified ? 'Verified on blockchain' : 'Pending verification'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timestamps
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Creation Date</label>
                    <p className="font-medium mt-1">{certificate.creationDate}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Analysis Date</label>
                    <p className="font-medium mt-1">{certificate.analysisDate}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "legal" && (
            <div className="space-y-6">
              <div className="p-6 border rounded-lg bg-muted/50">
                <h3 className="text-lg font-semibold mb-4">Legal Certificate Statement</h3>
                <div className="space-y-4 text-sm">
                  <p>
                    <strong>Certificate of Digital Content Analysis</strong>
                  </p>
                  
                  <p>
                    This certificate serves as legal documentation that the digital video content 
                    titled "<em>{certificate.videoTitle}</em>" was analyzed using advanced AI-powered 
                    similarity detection algorithms on {certificate.analysisDate}.
                  </p>
                  
                  <p>
                    <strong>Analysis Results:</strong> The content achieved a similarity score of {certificate.similarityScore}%, 
                    indicating {certificate.similarityScore < 20 ? 'high originality' : 'potential similarities detected'} 
                    when compared against our comprehensive database of protected content.
                  </p>
                  
                  <p>
                    <strong>Owner Declaration:</strong> {certificate.ownerName} ({certificate.ownerEmail}) 
                    declares ownership of this content as of {certificate.creationDate}.
                  </p>
                  
                  <p>
                    <strong>Technical Verification:</strong> This certificate is cryptographically 
                    signed with hash {certificate.certificateHash.substring(0, 16)}... and is tamper-proof.
                  </p>
                  
                  <p>
                    <strong>Legal Standing:</strong> This certificate can be used as evidence in 
                    legal proceedings to establish content ownership, creation date, and originality assessment.
                  </p>
                </div>
                
                <div className="mt-6 p-4 border-l-4 border-primary bg-primary/5">
                  <p className="text-xs text-muted-foreground">
                    <strong>Disclaimer:</strong> This certificate represents an automated analysis 
                    of digital content and should be considered alongside other evidence in legal matters. 
                    Copyright Shield provides this service as a technological tool for content verification.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print Certificate
                </Button>
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Verify Online
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
