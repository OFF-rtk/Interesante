import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, Share2, Calendar, Shield, Hash } from "lucide-react";

interface CertificateCardProps {
  id: string;
  videoTitle: string;
  creationDate: string;
  status: "valid" | "pending" | "revoked";
  similarityScore: number;
  downloadCount: number;
  onView?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

export function CertificateCard({
  id,
  videoTitle,
  creationDate,
  status,
  similarityScore,
  downloadCount,
  onView,
  onDownload,
  onShare
}: CertificateCardProps) {
  const getStatusBadge = (status: "valid" | "pending" | "revoked") => {
    switch (status) {
      case "valid":
        return <Badge className="bg-green-500 hover:bg-green-600">Valid</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "revoked":
        return <Badge variant="destructive">Revoked</Badge>;
    }
  };

  const getSimilarityColor = (score: number) => {
    if (score < 20) return "text-green-600";
    if (score < 50) return "text-yellow-600";
    if (score < 80) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg truncate">{videoTitle}</CardTitle>
          </div>
          {getStatusBadge(status)}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Hash className="h-3 w-3" />
          <span className="font-mono">#{id}</span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Similarity Score</p>
            <p className={`text-lg font-bold ${getSimilarityColor(similarityScore)}`}>
              {similarityScore}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Downloads</p>
            <p className="text-lg font-bold">{downloadCount}</p>
          </div>
        </div>
        
        {/* Creation Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Created {creationDate}</span>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onView} className="flex-1">
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button size="sm" variant="outline" onClick={onDownload} className="flex-1">
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
          <Button size="sm" variant="outline" onClick={onShare}>
            <Share2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
