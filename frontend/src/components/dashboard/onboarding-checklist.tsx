import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CheckCircle, Circle, FileText, Settings, Upload } from "lucide-react";
import Link from "next/link";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  href: string;
  icon: React.ReactNode;
}

interface OnboardingChecklistProps {
  userProgress?: {
    hasUploadedVideo: boolean;
    hasGeneratedCertificate: boolean;
    hasCompletedProfile: boolean;
  };
}

export function OnboardingChecklist({ userProgress }: OnboardingChecklistProps) {
  const steps: OnboardingStep[] = [
    {
      id: "upload",
      title: "Upload Your First Video",
      description: "Try our AI-powered analysis with any video file",
      completed: userProgress?.hasUploadedVideo || false,
      href: "/analyze",
      icon: <Upload className="h-4 w-4" />
    },
    {
      id: "certificate",
      title: "Generate a Certificate",
      description: "Create legal proof of ownership for your content",
      completed: userProgress?.hasGeneratedCertificate || false,
      href: "/analyze",
      icon: <FileText className="h-4 w-4" />
    },
    {
      id: "profile",
      title: "Complete Your Profile",
      description: "Add your information for certificate generation",
      completed: userProgress?.hasCompletedProfile || false,
      href: "/settings/profile",
      icon: <Settings className="h-4 w-4" />
    }
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Get Started with Copyright Shield</CardTitle>
            <CardDescription>
              Complete these steps to start protecting your content
            </CardDescription>
          </div>
          <Badge variant={completedSteps === steps.length ? "default" : "secondary"}>
            {completedSteps}/{steps.length} Complete
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-4 p-3 border rounded-lg">
            <div className="flex-shrink-0">
              {step.completed ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {step.icon}
                <h4 className="font-medium">{step.title}</h4>
                {step.completed && (
                  <Badge variant="secondary" className="text-xs">Done</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
            
            {!step.completed && (
              <Button size="sm" asChild>
                <Link href={step.href}>
                  Start
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
