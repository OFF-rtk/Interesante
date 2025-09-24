import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Shield, Sparkles } from "lucide-react";
import Link from "next/link";

interface WelcomeBannerProps {
  userName?: string;
  isFirstTime?: boolean;
}

export function WelcomeBanner({ userName = "there", isFirstTime = true }: WelcomeBannerProps) {
  if (!isFirstTime) {
    return (
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Welcome back, {userName}!</h2>
                <p className="text-sm text-muted-foreground">
                  Ready to protect more content today?
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/analyze">
                <ArrowRight className="mr-2 h-4 w-4" />
                Upload Video
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Welcome to Copyright Shield!</h2>
              <p className="text-muted-foreground mb-4">
                Protect your content with AI-powered analysis in under 10 seconds
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button asChild>
                  <Link href="/analyze">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Upload Your First Video
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/features">
                    Learn How It Works
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
