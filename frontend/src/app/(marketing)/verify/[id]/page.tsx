"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertTriangle, Shield, Search, Copy, ExternalLink } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface CertificateVerification {
  valid: boolean;
  certificate?: {
    id: string;
    createdAt: string;
    filename: string;
    status: string;
    certificateType: string;
  };
  error?: string;
}

export default function VerifyCertificatePage() {
  const params = useParams();
  const [verification, setVerification] = useState<CertificateVerification | null>(null);
  const [loading, setLoading] = useState(false);
  const [customId, setCustomId] = useState("");

  const verifyCertificate = async (certificateId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/certificates/verify/${certificateId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });
      
      const result = await response.json();
      setVerification(result);
    } catch (error) {
      setVerification({
        valid: false,
        error: "Failed to verify certificate. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id && typeof params.id === "string") {
      verifyCertificate(params.id);
    }
  }, [params.id]);

  const handleCustomVerification = () => {
    if (customId.trim()) {
      verifyCertificate(customId.trim());
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container py-24 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-primary/10 rounded-full">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl font-bold">Certificate Verification</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Verify the authenticity of Copyright Shield certificates
        </p>
      </div>

      {/* Manual Verification */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Verify Certificate
          </CardTitle>
          <CardDescription>
            Enter a certificate ID to verify its authenticity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="CS-1234567890-abc123"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              className="font-mono"
            />
            <Button onClick={handleCustomVerification} disabled={loading || !customId.trim()}>
              {loading ? "Verifying..." : "Verify"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Verification Result */}
      {verification && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {verification.valid ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  Certificate Valid
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-500" />
                  Certificate Invalid
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {verification.valid && verification.certificate ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Certificate ID</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-muted p-1 rounded">{verification.certificate.id}</code>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(verification.certificate!.id)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Issue Date</label>
                    <p className="mt-1">{new Date(verification.certificate.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Content</label>
                    <p className="mt-1">{verification.certificate.filename}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge variant={verification.certificate.status === "ACTIVE" ? "default" : "destructive"}>
                        {verification.certificate.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    This certificate is valid and was issued by Copyright Shield. 
                    It provides technical evidence of content analysis performed on the specified date.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    View Full Certificate
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/report-fraud">
                      <AlertTriangle className="h-3 w-3 mr-2" />
                      Report Fraud
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {verification.error || "This certificate could not be verified. It may be invalid, revoked, or fraudulent."}
                  </AlertDescription>
                </Alert>

                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Possible reasons:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Certificate ID is incorrect or doesn't exist</li>
                    <li>Certificate has been revoked due to fraud</li>
                    <li>Certificate has expired</li>
                    <li>System error - try again later</li>
                  </ul>
                </div>

                <Button variant="outline" asChild>
                  <Link href="/report-fraud">
                    Report Suspicious Certificate
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Information */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg">About Certificate Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Certificate verification confirms that a Copyright Shield certificate is genuine 
            and has not been revoked. Valid certificates indicate:
          </p>
          
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>The certificate was issued by our AI analysis system</li>
            <li>Content analysis was performed on the specified date</li>
            <li>Technical evidence is cryptographically signed</li>
            <li>The certificate has not been revoked for fraud</li>
          </ul>

          <p>
            <strong>Important:</strong> A valid certificate provides technical evidence only 
            and does not constitute legal advice or guarantee ownership rights.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
