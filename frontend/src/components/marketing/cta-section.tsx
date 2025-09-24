import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, ArrowRight, LogIn, UserPlus, Sparkles, Zap, CheckCircle } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="container px-4 py-16 mx-auto">
      <Card className="relative overflow-hidden border-0 shadow-2xl">
        {/* Beautiful gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-emerald-50/50 to-purple-50/30 dark:from-slate-900 dark:via-emerald-900/20 dark:to-purple-900/10" />
        
        {/* Subtle decorative elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-emerald-200/20 to-purple-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-gradient-to-tr from-blue-200/20 to-teal-200/20 rounded-full blur-3xl" />
        
        <CardContent className="relative z-10 p-12 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Icon with gradient background */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-purple-600 rounded-full blur-lg opacity-30" />
                <div className="relative p-4 bg-gradient-to-r from-emerald-500 to-purple-600 rounded-full">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            
            {/* Main heading with gradient */}
            <h2 className="text-3xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-purple-600 bg-clip-text text-transparent">
                Ready to Protect
              </span>
              <br />
              <span className="text-foreground">Your Content?</span>
            </h2>
            
            {/* Description */}
            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
              Join creators worldwide who trust Copyright Shield. Start your protection journey 
              with our free plan and upgrade as you grow.
            </p>
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                asChild
              >
                <Link href="/login">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Start Free Today
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-emerald-800 dark:hover:bg-emerald-900/20 transition-all duration-300"
                asChild
              >
                <Link href="/login">
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign In
                </Link>
              </Button>
            </div>
            
            {/* Feature highlights with corrected info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 pt-8 border-t border-border/50">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="p-2 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Free Starter Plan</p>
                  <p className="text-xs text-muted-foreground">2 videos monthly</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="p-2 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Digital Certificates</p>
                  <p className="text-xs text-muted-foreground">Cryptographic proof</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="p-2 bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 rounded-full">
                  <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">AI-Powered Analysis</p>
                  <p className="text-xs text-muted-foreground">Advanced detection</p>
                </div>
              </div>
            </div>
            
            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-4">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <span>Instant Setup</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                <span>Cancel Anytime</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
