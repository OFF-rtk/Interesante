import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Share2, Eye, Award, Calendar, Shield, Hash } from "lucide-react";

interface CertificateData {
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
}

interface CertificatePreviewProps {
  certificate: CertificateData;
  onDownload?: () => void;
  onShare?: () => void;
  onViewFull?: () => void;
}

export function CertificatePreview({
  certificate,
  onDownload,
  onShare,
  onViewFull
}: CertificatePreviewProps) {
  const getStatusBadge = (status: CertificateData["status"]) => {
    switch (status) {
      case "valid":
        return <Badge className="bg-green-500 hover:bg-green-600">Valid</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "revoked":
        return <Badge variant="destructive">Revoked</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Award className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl">Copyright Certificate</CardTitle>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="font-mono text-sm">#{certificate.id}</span>
          {getStatusBadge(certificate.status)}
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Video Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Content Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Video Title</label>
              <p className="font-medium">{certificate.videoTitle}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Similarity Score</label>
              <div className="flex items-center gap-2">
                <p className="font-medium">{certificate.similarityScore}%</p>
                <Badge variant={certificate.similarityScore < 20 ? "default" : "secondary"}>
                  {certificate.similarityScore < 20 ? "Original" : "Similar Found"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Owner Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Owner Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Owner Name</label>
              <p className="font-medium">{certificate.ownerName}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email Address</label>
              <p className="font-medium">{certificate.ownerEmail}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Certificate Details */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Certificate Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Creation Date
              </label>
              <p className="font-medium">{certificate.creationDate}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Analysis Date
              </label>
              <p className="font-medium">{certificate.analysisDate}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Hash className="h-3 w-3" />
              Video Hash (SHA-256)
            </label>
            <p className="font-mono text-xs bg-muted p-2 rounded break-all">
              {certificate.videoHash}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Certificate Hash
            </label>
            <p className="font-mono text-xs bg-muted p-2 rounded break-all">
              {certificate.certificateHash}
            </p>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Certificate Actions</h3>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={onDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            
            <Button onClick={onShare} variant="outline" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share Certificate
            </Button>
            
            <Button onClick={onViewFull} variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Full View
            </Button>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Legal Notice:</strong> This certificate serves as digital proof of content analysis 
            performed on the specified date. It provides evidence of originality assessment and can be 
            used for legal purposes. The certificate is cryptographically signed and tamper-proof.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
