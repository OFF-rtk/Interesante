import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Clock, FileText, Search, Shield, Zap } from "lucide-react";
import Link from "next/link";

interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  action: {
    text: string;
    href: string;
  };
}

export function FeatureHighlights() {
  const features: FeatureCard[] = [
    {
      icon: <Zap className="h-5 w-5 text-blue-500" />,
      title: "Lightning Fast Analysis",
      description: "AI-powered video analysis completed in under 10 seconds",
      badge: "< 10s",
      action: {
        text: "Try Analysis",
        href: "/analyze"
      }
    },
    {
      icon: <Shield className="h-5 w-5 text-green-500" />,
      title: "99.9% Accuracy Rate",
      description: "Advanced computer vision ensures precise similarity detection",
      badge: "99.9%",
      action: {
        text: "Learn More",
        href: "/features"
      }
    },
    {
      icon: <FileText className="h-5 w-5 text-purple-500" />,
      title: "Legal Certificates",
      description: "Generate court-ready ownership certificates instantly",
      badge: "Legal",
      action: {
        text: "Generate Certificate",
        href: "/analyze"
      }
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {features.map((feature, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {feature.icon}
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </div>
              {feature.badge && (
                <Badge variant="secondary">{feature.badge}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              {feature.description}
            </CardDescription>
            <Button size="sm" variant="outline" asChild className="w-full">
              <Link href={feature.action.href}>
                {feature.action.text}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
