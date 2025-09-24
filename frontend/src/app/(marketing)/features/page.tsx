import { FeaturesGrid } from "@/components/marketing/features-grid";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Shield, Search, FileText, Lock, Award, Code, Database } from "lucide-react";
import type { Metadata } from "next";
import { HowItWorksCard } from "@/components/dashboard/how-it-works-card";

export const metadata: Metadata = {
  title: "Features - Advanced AI Content Protection",
  description: "Discover powerful features including AI-powered similarity detection, digital certificates, secure processing, and developer-friendly tools.",
};

const detailedFeatures = [
  {
    icon: <Code className="w-8 h-8" />,
    title: "Advanced Video Analysis",
    description: "Our computer vision algorithms extract keyframes and generate perceptual hashes for comprehensive content analysis.",
    features: [
      "Keyframe extraction",
      "Perceptual hashing (pHash)", 
      "DCT-based analysis",
      "Batch processing support"
    ]
  },
  {
    icon: <Search className="w-8 h-8" />,
    title: "Similarity Detection",
    description: "Compare video content using state-of-the-art algorithms to identify potential matches and similarities.",
    features: [
      "Visual content comparison",
      "Hash-based matching",
      "Metadata analysis",
      "Configurable thresholds"
    ]
  },
  {
    icon: <FileText className="w-8 h-8" />,
    title: "Digital Certificates",
    description: "Generate cryptographically signed certificates that provide proof of your content analysis results.",
    features: [
      "Timestamped verification",
      "Cryptographic signatures",
      "PDF export format",
      "Shareable proof documents"
    ]
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Secure Processing",
    description: "Your content is processed securely with encryption and privacy-focused architecture.",
    features: [
      "Encrypted data transmission",
      "Secure file handling",
      "Privacy-first design",
      "GDPR compliant processing"
    ]
  }
];

// Beautiful Divider Component
function SectionDivider() {
  return (
    <div className="container flex items-center justify-center py-12">
      <div className="flex items-center w-full max-w-md">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-200/60 to-transparent dark:via-emerald-800/60"></div>
        <div className="px-4">
          <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-purple-500 rounded-full"></div>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-200/60 to-transparent dark:via-purple-800/60"></div>
      </div>
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <div className="pb-16">
      {/* Hero Section */}
      <section className="container pt-8 pb-16 text-center relative">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-purple-50/20 dark:from-emerald-900/10 dark:to-purple-900/5 rounded-3xl blur-3xl" />
        
        <div className="relative z-10">
          <Badge variant="outline" className="mb-6 border-emerald-200 dark:border-emerald-800">
            <Award className="w-3 h-3 mr-1 text-emerald-600" />
            Advanced Features
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-purple-600 bg-clip-text text-transparent">
              Everything You Need
            </span>
            <br />
            <span className="text-foreground">to Analyze Content</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive AI-powered content analysis with secure processing, digital certificates, and developer-friendly tools.
          </p>
        </div>
      </section>

      {/* Beautiful Divider - Perfect Visual Break */}
      <SectionDivider />

      {/* Features Grid */}
      <section className="pb-24">
        <FeaturesGrid />
      </section>

      {/* Detailed Features */}
      <section className="container pb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
              Detailed Feature Breakdown
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Deep dive into the technology and capabilities that power our content analysis platform.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {detailedFeatures.map((feature, index) => (
            <Card key={index} className="h-full border-border/50 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-100 to-purple-100 dark:from-emerald-900/30 dark:to-purple-900/30 rounded-xl">
                    <div className="text-emerald-600 dark:text-emerald-400">
                      {feature.icon}
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </div>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {feature.features.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-purple-500 rounded-full flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container">
        <HowItWorksCard />
      </section>
    </div>
  );
}
