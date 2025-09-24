"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Download, Eye, Share2, FileText, Calendar } from "lucide-react";

interface Certificate {
  id: string;
  videoTitle: string;
  creationDate: string;
  status: "valid" | "pending" | "revoked";
  similarityScore: number;
  downloadCount: number;
}

interface CertificateListProps {
  certificates?: Certificate[];
  onView?: (id: string) => void;
  onDownload?: (id: string) => void;
  onShare?: (id: string) => void;
}

export function CertificateList({
  certificates = [],
  onView,
  onDownload,
  onShare
}: CertificateListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "valid" | "pending" | "revoked">("all");

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.videoTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || cert.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: Certificate["status"]) => {
    switch (status) {
      case "valid":
        return <Badge className="bg-green-500 hover:bg-green-600">Valid</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "revoked":
        return <Badge variant="destructive">Revoked</Badge>;
    }
  };

  const getSimilarityBadge = (score: number) => {
    if (score < 20) return <Badge variant="default">Original</Badge>;
    if (score < 50) return <Badge variant="secondary">Low Similarity</Badge>;
    if (score < 80) return <Badge variant="outline">Medium Similarity</Badge>;
    return <Badge variant="destructive">High Similarity</Badge>;
  };

  if (certificates.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Certificates Yet</h3>
          <p className="text-muted-foreground mb-6">
            Upload your first video to generate a certificate and see it here.
          </p>
          <Button>Upload Video</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Certificates ({filteredCertificates.length})
          </CardTitle>
        </div>
        
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search certificates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Status: {filterStatus === "all" ? "All" : filterStatus}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                All Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("valid")}>
                Valid
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("pending")}>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("revoked")}>
                Revoked
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Video Title</TableHead>
                <TableHead>Certificate ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Similarity</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCertificates.map((certificate) => (
                <TableRow key={certificate.id}>
                  <TableCell className="font-medium">
                    {certificate.videoTitle}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      #{certificate.id}
                    </code>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(certificate.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{certificate.similarityScore}%</span>
                      {getSimilarityBadge(certificate.similarityScore)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{certificate.creationDate}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{certificate.downloadCount}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView?.(certificate.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Certificate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDownload?.(certificate.id)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onShare?.(certificate.id)}>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share Certificate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
