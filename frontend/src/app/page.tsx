// This is the ONLY page.tsx in the root - serves the landing page at "/"
import { ErrorBoundary } from "@/components/common/error-boundary";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { CTASection } from "@/components/marketing/cta-section";
import { FeaturesGrid } from "@/components/marketing/features-grid";
import { HeroSection } from "@/components/marketing/hero-section";
import { PricingCards } from "@/components/marketing/pricing-cards";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI-Powered Content Protection",
  description: "Protect your videos with advanced AI similarity detection. Generate legal certificates in under 10 seconds. 99.9% accuracy guaranteed.",
};

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

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Top gradient circles */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-400/10 via-blue-300/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -top-20 right-10 w-72 h-72 bg-gradient-to-bl from-purple-400/8 via-purple-300/4 to-transparent rounded-full blur-3xl"></div>
        
        {/* Middle accent shapes */}
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-gradient-to-tl from-green-400/6 via-emerald-300/3 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-2/3 -left-20 w-64 h-64 bg-gradient-to-tr from-orange-400/8 via-yellow-300/4 to-transparent rounded-full blur-3xl"></div>
        
        {/* Bottom gradient elements */}
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 bg-gradient-to-tl from-pink-400/6 via-rose-300/3 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-16 w-72 h-72 bg-gradient-to-tl from-indigo-400/8 via-violet-300/4 to-transparent rounded-full blur-3xl"></div>
        
        {/* Small floating elements */}
        <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-gradient-to-br from-cyan-400/10 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute top-3/4 right-1/3 w-24 h-24 bg-gradient-to-bl from-teal-400/12 to-transparent rounded-full blur-2xl"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <MarketingHeader />
        <ErrorBoundary>
          <main className="flex-1">
            <HeroSection />
            
            {/* Beautiful Divider - Perfect Visual Break */}
            <SectionDivider />
            
            <FeaturesGrid />
            <PricingCards />
            <CTASection />
          </main>
        </ErrorBoundary>
        <MarketingFooter />
      </div>
    </div>
  );
}
