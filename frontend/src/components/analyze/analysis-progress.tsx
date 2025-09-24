"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { CheckCircle, Zap, Shield, Award, Clock } from "lucide-react";

interface AnalysisStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
}

interface AnalysisProgressProps {
  isActive?: boolean;
  onComplete?: () => void;
}

export function AnalysisProgress({ isActive = false, onComplete }: AnalysisProgressProps) {
  const [steps, setSteps] = useState<AnalysisStep[]>([
    {
      id: "upload",
      title: "File Upload",
      description: "Securely uploading your video file",
      status: "completed",
      progress: 100
    },
    {
      id: "extraction",
      title: "Feature Extraction",
      description: "AI analyzing visual and audio features",
      status: "pending",
      progress: 0
    },
    {
      id: "similarity",
      title: "Similarity Detection",
      description: "Checking against protected content database",
      status: "pending",
      progress: 0
    },
    {
      id: "certificate",
      title: "Certificate Generation",
      description: "Creating legal ownership certificate",
      status: "pending",
      progress: 0
    }
  ]);

  const [overallProgress, setOverallProgress] = useState(25);
  const [estimatedTime, setEstimatedTime] = useState(8);

  useEffect(() => {
    if (!isActive) return;

    const simulateProgress = () => {
      let currentStepIndex = 1; // Start from second step (first is completed)
      
      const progressInterval = setInterval(() => {
        setSteps(prevSteps => {
          const newSteps = [...prevSteps];
          const currentStep = newSteps[currentStepIndex];
          
          if (currentStep && currentStep.status !== "completed") {
            if (currentStep.status === "pending") {
              currentStep.status = "processing";
            }
            
            currentStep.progress += 20;
            
            if (currentStep.progress >= 100) {
              currentStep.status = "completed";
              currentStep.progress = 100;
              currentStepIndex++;
            }
            
            // Update overall progress
            const completedSteps = newSteps.filter(s => s.status === "completed").length;
            const totalSteps = newSteps.length;
            const newOverallProgress = (completedSteps / totalSteps) * 100;
            setOverallProgress(newOverallProgress);
            
            // Update estimated time
            const remaining = totalSteps - completedSteps;
            setEstimatedTime(remaining * 2);
            
            // Check if all steps are completed
            if (completedSteps === totalSteps) {
              clearInterval(progressInterval);
              onComplete?.();
            }
          }
          
          return newSteps;
        });
      }, 500);

      return () => clearInterval(progressInterval);
    };

    const cleanup = simulateProgress();
    return cleanup;
  }, [isActive, onComplete]);

  const getStepIcon = (step: AnalysisStep) => {
    switch (step.status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "processing":
        return <LoadingSpinner size="sm" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStepBadge = (step: AnalysisStep) => {
    switch (step.status) {
      case "completed":
        return <Badge variant="default">Complete</Badge>;
      case "processing":
        return <Badge variant="secondary">Processing</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  if (!isActive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Ready for Analysis
          </CardTitle>
          <CardDescription>
            Upload a video to start the AI-powered analysis process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-medium">Upload a video to begin</p>
            <p className="text-xs text-muted-foreground">
              Analysis takes less than 10 seconds
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <LoadingSpinner size="sm" />
            AI Analysis in Progress
          </span>
          <Badge variant="secondary">
            {Math.round(overallProgress)}% Complete
          </Badge>
        </CardTitle>
        <CardDescription>
          Estimated time remaining: {estimatedTime} seconds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="w-full" />
        </div>

        {/* Individual Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="flex-shrink-0">
                {getStepIcon(step)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-sm">{step.title}</h4>
                  {getStepBadge(step)}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {step.description}
                </p>
                
                {step.status === "processing" && (
                  <div className="space-y-1">
                    <Progress value={step.progress} className="w-full h-1" />
                    <p className="text-xs text-muted-foreground">
                      {step.progress}% complete
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Technical Info */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-sm mb-2">Technical Details</h4>
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">Processing:</span> Cloud AI
            </div>
            <div>
              <span className="font-medium">Security:</span> AES-256
            </div>
            <div>
              <span className="font-medium">Algorithm:</span> Neural Network
            </div>
            <div>
              <span className="font-medium">Accuracy:</span> 99.9%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
