import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, LogIn, Play, Shield, Zap } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="container px-4 py-24 mx-auto">
      <div className="text-center space-y-8">
        <Badge variant="outline" className="px-3 py-1">
          <Zap className="w-3 h-3 mr-1" />
          AI-Powered Protection
        </Badge>
        
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-purple-600 bg-clip-text text-transparent">
              Protect Your Content
            </span>
            <br />
            <span className="text-foreground">with </span>
            <span className="bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-600 bg-clip-text text-transparent">
              AI Precision
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Generate certificates, detect similarities, and shield your content 
            with enterprise-grade AI technology in under 2 seconds.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-0">
            <Link href="/login">
              <LogIn className="w-4 h-4 mr-2" />
              Start Protecting Free
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="border-purple-200 hover:border-purple-300 hover:bg-purple-50/50 dark:border-purple-800 dark:hover:bg-purple-900/20">
            <Link href="#features">
              <Play className="w-4 h-4 mr-2" />
              See How It Works
            </Link>
          </Button>
        </div>

        <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></div>
            <span>Free Forever Plan</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full"></div>
            <span>No Credit Card Required</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-violet-500 rounded-full"></div>
            <span>Legal Certificates</span>
          </div>
        </div>
      </div>
    </section>
  );
}
