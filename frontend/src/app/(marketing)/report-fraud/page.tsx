"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, CheckCircle, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const fraudReportSchema = z.object({
  reportType: z.enum(["fraudulent_certificate", "stolen_content", "impersonation", "other"]),
  certificateId: z.string().optional(),
  suspectedContentUrl: z.string().url("Must be a valid URL").optional(),
  originalContentUrl: z.string().url("Must be a valid URL").optional(),
  description: z.string().min(50, "Please provide at least 50 characters of description"),
  contactEmail: z.string().email("Valid email required").optional(),
  evidenceFiles: z.any().optional()
});

type FraudReportForm = z.infer<typeof fraudReportSchema>;

export default function ReportFraudPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FraudReportForm>({
    resolver: zodResolver(fraudReportSchema)
  });

  const reportType = watch("reportType");

  const onSubmit = async (data: FraudReportForm) => {
    setIsSubmitting(true);
    try {
      // Submit to fraud detection API
      const response = await fetch("/api/fraud/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        throw new Error("Submission failed");
      }
    } catch (error) {
      console.error("Fraud report submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="container py-24">
        <Card className="max-w-2xl mx-auto text-center">
          <CardContent className="p-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">Report Submitted</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for helping protect the creator community. We'll investigate this report 
              and take appropriate action if fraud is confirmed.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Reports are reviewed within 24-48 hours</p>
              <p>• Confirmed fraud results in certificate revocation</p>
              <p>• Serious cases may be referred to authorities</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-24 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <h1 className="text-4xl font-bold">Report Copyright Fraud</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Help us maintain trust in the Copyright Shield ecosystem by reporting suspected 
          fraudulent certificates or content theft.
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="max-w-2xl mx-auto">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Anonymous Reporting:</strong> You can submit this report anonymously. 
          However, providing contact information helps us follow up if needed.
        </AlertDescription>
      </Alert>

      {/* Form */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Fraud Report Details</CardTitle>
          <CardDescription>
            Provide as much detail as possible to help our investigation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Report Type */}
            <div className="space-y-2">
              <Label htmlFor="reportType">Type of Fraud *</Label>
              <Select onValueChange={(value) => setValue("reportType", value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fraud type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fraudulent_certificate">Fraudulent Certificate</SelectItem>
                  <SelectItem value="stolen_content">Stolen Content</SelectItem>
                  <SelectItem value="impersonation">Creator Impersonation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.reportType && (
                <p className="text-sm text-red-500">{errors.reportType.message}</p>
              )}
            </div>

            {/* Certificate ID (conditional) */}
            {reportType === "fraudulent_certificate" && (
              <div className="space-y-2">
                <Label htmlFor="certificateId">Certificate ID</Label>
                <Input
                  {...register("certificateId")}
                  placeholder="CS-1234567890-abc123"
                  className="font-mono"
                />
                <p className="text-sm text-muted-foreground">
                  The certificate ID you believe is fraudulent
                </p>
              </div>
            )}

            {/* URLs */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="suspectedContentUrl">Suspected Fraudulent Content URL</Label>
                <Input
                  {...register("suspectedContentUrl")}
                  placeholder="https://example.com/suspected-content"
                  type="url"
                />
                {errors.suspectedContentUrl && (
                  <p className="text-sm text-red-500">{errors.suspectedContentUrl.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="originalContentUrl">Original Content URL (if known)</Label>
                <Input
                  {...register("originalContentUrl")}
                  placeholder="https://example.com/original-content"
                  type="url"
                />
                {errors.originalContentUrl && (
                  <p className="text-sm text-red-500">{errors.originalContentUrl.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description *</Label>
              <Textarea
                {...register("description")}
                placeholder="Please describe the suspected fraud in detail. Include dates, evidence, and any relevant information..."
                rows={5}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Contact Email */}
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email (Optional)</Label>
              <Input
                {...register("contactEmail")}
                placeholder="your@email.com"
                type="email"
              />
              <p className="text-sm text-muted-foreground">
                Provide if you want updates on the investigation
              </p>
              {errors.contactEmail && (
                <p className="text-sm text-red-500">{errors.contactEmail.message}</p>
              )}
            </div>

            {/* Evidence Upload */}
            <div className="space-y-2">
              <Label htmlFor="evidence">Evidence Files (Optional)</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drop screenshots or evidence files here (Max 10MB)
                </p>
              </div>
            </div>

            {/* Submit */}
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Submitting Report..." : "Submit Fraud Report"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg">What Happens Next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">1</span>
            </div>
            <div>
              <h4 className="font-medium">Initial Review</h4>
              <p className="text-sm text-muted-foreground">
                Our team reviews your report within 24-48 hours
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">2</span>
            </div>
            <div>
              <h4 className="font-medium">Investigation</h4>
              <p className="text-sm text-muted-foreground">
                We analyze the content and certificate using AI detection
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">3</span>
            </div>
            <div>
              <h4 className="font-medium">Action</h4>
              <p className="text-sm text-muted-foreground">
                Confirmed fraud results in certificate revocation and account action
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
