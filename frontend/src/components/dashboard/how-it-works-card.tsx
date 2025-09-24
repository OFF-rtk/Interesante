import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Zap, Shield, Award, ArrowRight } from "lucide-react";
import Link from "next/link";

export function HowItWorksCard() {
  const steps = [
    {
      number: "1",
      icon: <Upload className="h-5 w-5" />,
      title: "Upload",
      description: "Drop your video file"
    },
    {
      number: "2", 
      icon: <Zap className="h-5 w-5" />,
      title: "Analyze",
      description: "AI processes your content"
    },
    {
      number: "3",
      icon: <Shield className="h-5 w-5" />,
      title: "Protect",
      description: "Get digital certificate"
    }
  ];

  return (
    <Card className="relative overflow-hidden border-border/50 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300 hover:shadow-lg">
      {/* Beautiful gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-purple-50/20 dark:from-emerald-900/20 dark:via-teal-900/10 dark:to-purple-900/5" />
      
      <div className="relative z-10">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-emerald-100 to-purple-100 dark:from-emerald-900/40 dark:to-purple-900/40 rounded-xl">
              <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            <span className="bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
              How Copyright Shield Works
            </span>
          </CardTitle>
          <CardDescription className="text-base">
            Three simple steps to analyze and protect your content
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, index) => (
              <div key={step.number} className="text-center relative">
                <div className="relative mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto shadow-lg">
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="hidden md:block absolute top-1/2 -translate-y-1/2 -right-8 h-5 w-5 text-muted-foreground/60" />
                  )}
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="p-1.5 bg-gradient-to-br from-emerald-100 to-purple-100 dark:from-emerald-900/30 dark:to-purple-900/30 rounded-lg">
                    <div className="text-emerald-600 dark:text-emerald-400">
                      {step.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-base">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-border/50 pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="font-semibold">Ready to get started?</p>
                <p className="text-sm text-muted-foreground">Upload your first video now</p>
              </div>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-emerald-500 to-purple-600 hover:from-emerald-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                asChild
              >
                <Link href="/analyze">
                  Start Analysis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
