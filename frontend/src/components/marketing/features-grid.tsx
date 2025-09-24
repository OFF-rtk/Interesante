import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Search, Shield, Upload } from "lucide-react";

const features = [
  {
    icon: <Upload className="w-8 h-8 text-blue-500" />,
    title: "Video Upload & Analysis",
    description: "Upload video files for AI-powered content analysis and hash generation",
    badge: "Core"
  },
  {
    icon: <Search className="w-8 h-8 text-green-500" />,
    title: "Similarity Detection",
    description: "Compare videos using advanced computer vision and feature extraction algorithms",
    badge: "AI"
  },
  {
    icon: <FileText className="w-8 h-8 text-purple-500" />,
    title: "Digital Certificates",
    description: "Generate timestamped certificates with cryptographic signatures for content verification",
    badge: "Proof"
  },
  {
    icon: <Shield className="w-8 h-8 text-red-500" />,
    title: "Fraud Reporting",
    description: "Report suspected copyright violations with public verification system",
    badge: "Trust"
  }
];

export function FeaturesGrid() {
  return (
    <section className="container px-4 py-16 mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Core Features
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Essential tools for content analysis and verification, built with modern AI technology.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="text-center hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-center mb-4">
                {feature.icon}
              </div>
              <div className="flex items-center justify-center gap-2">
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {feature.badge}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
