import { PricingCards } from "@/components/marketing/pricing-cards";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, HelpCircle, Star, X } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - Affordable Content Protection Plans",
  description: "Choose from our flexible pricing plans. Start free, upgrade as you grow. Enterprise solutions available.",
};

const faqs = [
  {
    question: "What video formats are supported?",
    answer: "We support major video formats including MP4, MOV, AVI, and MKV. Our system processes videos through keyframe extraction and hash generation algorithms."
  },
  {
    question: "How does the similarity detection work?",
    answer: "Our AI uses computer vision algorithms to extract features from video content and compare them using perceptual hashing techniques like pHash and DCT-based analysis."
  },
  {
    question: "Are the certificates legally recognized?",
    answer: "Our certificates provide cryptographic proof of content analysis with timestamps. While they serve as technical evidence, legal validity may vary by jurisdiction."
  },
  {
    question: "How long does analysis take?",
    answer: "Processing time depends on video length and system load. Most videos are processed within a few minutes through our batch processing system."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, all paid plans can be canceled at any time. You'll retain access to your current plan features until the end of your billing period."
  },
  {
    question: "Do you offer API access?",
    answer: "Yes, our Pro and Enterprise plans include API access for integrating our content analysis capabilities into your own applications."
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

export default function PricingPage() {
  return (
    <div className="pb-16">
      {/* Hero Section */}
      <section className="container pt-8 pb-16 text-center relative">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-transparent to-purple-50/20 dark:from-emerald-900/10 dark:to-purple-900/5 rounded-3xl blur-3xl" />
        
        <div className="relative z-10">
          <Badge variant="outline" className="mb-6 border-emerald-200 dark:border-emerald-800">
            <Star className="w-3 h-3 mr-1 text-emerald-600" />
            Transparent Pricing
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-purple-600 bg-clip-text text-transparent">
              Simple Pricing
            </span>
            <br />
            <span className="text-foreground">for Everyone</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free and grow with confidence. No hidden fees, no surprises - just straightforward pricing that scales with your needs.
          </p>
        </div>
      </section>

      {/* Beautiful Divider */}
      <SectionDivider />

      {/* Pricing Cards */}
      <section className="pb-8">
        <PricingCards />
      </section>


      {/* Comparison Table */}
      <section className="container pb-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            <span className="bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
              Feature Comparison
            </span>
          </h2>
          <p className="text-muted-foreground">
            See what's included in each plan
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-full border border-border rounded-xl overflow-hidden">
            <table className="w-full border-collapse bg-card">
              <thead>
                <tr className="border-b bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-purple-50/20 dark:from-emerald-900/20 dark:via-teal-900/10 dark:to-purple-900/5">
                  <th className="text-left p-4 font-semibold">Features</th>
                  <th className="text-center p-4 font-semibold">Starter</th>
                  <th className="text-center p-4 font-semibold bg-gradient-to-r from-emerald-500/5 to-purple-500/5">Pro</th>
                  <th className="text-center p-4 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-medium">Monthly uploads</td>
                  <td className="text-center p-4">2</td>
                  <td className="text-center p-4 bg-gradient-to-r from-emerald-500/5 to-purple-500/5">15</td>
                  <td className="text-center p-4">100</td>
                </tr>
                <tr className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-medium">Video analysis</td>
                  <td className="text-center p-4"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  <td className="text-center p-4 bg-gradient-to-r from-emerald-500/5 to-purple-500/5"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                </tr>
                <tr className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-medium">Digital certificates</td>
                  <td className="text-center p-4"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  <td className="text-center p-4 bg-gradient-to-r from-emerald-500/5 to-purple-500/5"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                </tr>
                <tr className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-medium">Priority processing</td>
                  <td className="text-center p-4"><X className="w-4 h-4 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4 bg-gradient-to-r from-emerald-500/5 to-purple-500/5"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                </tr>
                <tr className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-medium">API access</td>
                  <td className="text-center p-4"><X className="w-4 h-4 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4 bg-gradient-to-r from-emerald-500/5 to-purple-500/5"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                </tr>
                <tr className="hover:bg-muted/50 transition-colors">
                  <td className="p-4 font-medium">Custom integrations</td>
                  <td className="text-center p-4"><X className="w-4 h-4 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4 bg-gradient-to-r from-emerald-500/5 to-purple-500/5"><X className="w-4 h-4 text-muted-foreground mx-auto" /></td>
                  <td className="text-center p-4"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>


      {/* FAQ Section */}
      <section className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            <span className="bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
              Frequently Asked Questions
            </span>
          </h2>
          <p className="text-muted-foreground">
            Got questions? We've got answers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {faqs.map((faq, index) => (
            <Card key={index} className="border-border/50 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors duration-300 hover:shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-start gap-3">
                  <div className="p-1.5 bg-gradient-to-br from-emerald-100 to-purple-100 dark:from-emerald-900/30 dark:to-purple-900/30 rounded-lg">
                    <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="leading-tight">{faq.question}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
