import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Target, Users, Lightbulb, Heart, Award, Code, Database, Zap, Lock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About - Protecting Creators Worldwide",
  description: "Learn about Copyright Shield's mission to protect creators and their content using cutting-edge AI technology.",
};

const values = [
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Protection First",
    description: "We believe every creator deserves protection. Our technology ensures your content analysis is secure and reliable."
  },
  {
    icon: <Target className="w-8 h-8" />,
    title: "Innovation",
    description: "Advanced computer vision and hashing algorithms drive our content analysis, constantly improving accuracy."
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Community", 
    description: "Building a community of protected creators who can focus on what they do best - creating amazing content."
  },
  {
    icon: <Heart className="w-8 h-8" />,
    title: "Trust",
    description: "Transparent processes, secure handling, and reliable results you can depend on for your content protection needs."
  }
];

// Beautiful Divider Component (reused from pricing page)
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

export default function AboutPage() {
  return (
    <div className="pb-16">
      {/* Hero Section */}
      <section className="container pt-8 pb-16 text-center relative">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-purple-50/20 dark:from-emerald-900/10 dark:to-purple-900/5 rounded-3xl blur-3xl" />
        
        <div className="relative z-10">
          <Badge variant="outline" className="mb-6 border-emerald-200 dark:border-emerald-800">
            <Heart className="w-3 h-3 mr-1 text-emerald-600" />
            Our Story
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-purple-600 bg-clip-text text-transparent">
              Protecting Creators
            </span>
            <br />
            <span className="text-foreground">Worldwide</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We believe every creator deserves protection. Copyright Shield was born from the need to make content analysis accessible and reliable for creators everywhere.
          </p>
        </div>
      </section>

      {/* Beautiful Divider */}
      <SectionDivider />

      {/* Mission Section */}
      <section className="container pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">
              <span className="bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
                Our Mission
              </span>
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              To make advanced content analysis technology accessible and affordable for creators of all sizes. We're building tools that help you understand and protect your digital content.
            </p>
            <p className="text-lg text-muted-foreground">
              Every video analyzed, every certificate generated, and every similarity detected brings us closer to a future where creators have powerful tools to understand their content landscape.
            </p>
          </div>
          
          <div className="relative">
            <div className="bg-gradient-to-br from-emerald-50/80 via-teal-50/60 to-purple-50/40 dark:from-emerald-900/30 dark:via-teal-900/20 dark:to-purple-900/10 rounded-xl p-8 border border-emerald-200/50 dark:border-emerald-800/30">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">2TB+</div>
                  <div className="text-sm text-muted-foreground">Content Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">1K+</div>
                  <div className="text-sm text-muted-foreground">Videos Analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-emerald-600 bg-clip-text text-transparent">500+</div>
                  <div className="text-sm text-muted-foreground">Certificates Generated</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">24/7</div>
                  <div className="text-sm text-muted-foreground">System Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Values Section */}
      <section className="container pb-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            <span className="bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
              Our Values
            </span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            The principles that guide everything we do
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <Card key={index} className="text-center border-border/50 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300 hover:shadow-lg">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-100 to-purple-100 dark:from-emerald-900/30 dark:to-purple-900/30 rounded-xl">
                    <div className="text-emerald-600 dark:text-emerald-400">
                      {value.icon}
                    </div>
                  </div>
                </div>
                <CardTitle className="text-lg">{value.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="leading-relaxed">{value.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>


      {/* Technology Section */}
      <section className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="bg-gradient-to-br from-emerald-50/80 via-teal-50/60 to-purple-50/40 dark:from-emerald-900/30 dark:via-teal-900/20 dark:to-purple-900/10 rounded-xl p-8 border border-emerald-200/50 dark:border-emerald-800/30">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-lg">
                    <Code className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-semibold">Computer Vision Algorithms</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded-lg">
                    <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="font-semibold">Perceptual Hashing</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 rounded-lg">
                    <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-semibold">Cryptographic Security</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30 rounded-lg">
                    <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="font-semibold">Scalable Infrastructure</span>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-3xl font-bold mb-6">
              <span className="bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
                Built with Cutting-Edge Technology
              </span>
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Our platform combines advanced computer vision algorithms, perceptual hashing techniques, and secure cryptographic systems to provide reliable content analysis.
            </p>
            <p className="text-lg text-muted-foreground">
              Every component is designed for reliability and accuracy - from our hash generation algorithms that analyze content to our secure certificate systems that protect your analysis results.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
