"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ModeToggle } from "@/components/theme-toggle";
import { Shield, Menu, LogIn, UserPlus, AlertTriangle, Search } from "lucide-react";

const navigation = [
  { name: "Features", href: "/features" },
  { name: "Pricing", href: "/pricing" },
  { name: "About", href: "/about" },
  { name: "Verify Certificate", href: "/verify", icon: Search },
  { name: "Report Fraud", href: "/report-fraud", icon: AlertTriangle },
];

export function MarketingHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full">
      {/* Beautiful translucent background with gradient border */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        {/* Subtle gradient border at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        {/* Optional: Very subtle top highlight */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container flex h-16 items-center justify-between">
        {/* REFINED BEAUTIFUL LOGO */}
        <Link href="/" className="flex items-center space-x-3 group">
          {/* Simplified but beautiful shield icon */}
          <div className="relative">
            {/* Subtle outer glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 to-purple-600/15 rounded-lg blur-md group-hover:blur-lg group-hover:from-emerald-500/25 group-hover:to-purple-600/25 transition-all duration-300" />
            
            {/* Shield container with gradient background */}
            <div className="relative p-2.5 bg-gradient-to-br from-emerald-100/80 via-teal-50/60 to-purple-100/40 dark:from-emerald-900/40 dark:via-teal-900/30 dark:to-purple-900/20 rounded-lg border border-emerald-200/60 dark:border-emerald-800/50 group-hover:border-emerald-300/70 dark:group-hover:border-emerald-700/60 transition-all duration-300">
              {/* Shield icon with gradient color */}
              <Shield className="h-6 w-6 text-emerald-600 group-hover:text-emerald-500 dark:text-emerald-400 dark:group-hover:text-emerald-300 transition-colors duration-300 drop-shadow-sm" />
            </div>
          </div>
          
          {/* BEAUTIFUL TEXT LOGO */}
          <div className="flex flex-col">
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 via-emerald-800 to-purple-900 dark:from-slate-100 dark:via-emerald-200 dark:to-purple-200 bg-clip-text text-transparent leading-tight group-hover:from-emerald-700 group-hover:via-teal-700 group-hover:to-purple-700 dark:group-hover:from-emerald-100 dark:group-hover:via-teal-100 dark:group-hover:to-purple-100 transition-all duration-300">
              Copyright Shield
            </span>
            {/* Subtle tagline */}
            <span className="text-xs text-muted-foreground/70 font-medium tracking-wide opacity-0 group-hover:opacity-100 transition-all duration-300 -mt-0.5">
              AI-Powered Protection
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="px-3 py-2 text-sm font-medium transition-all duration-200 hover:text-primary hover:bg-primary/5 rounded-lg flex items-center gap-1.5 group"
            >
              {item.icon && (
                <item.icon className="h-3 w-3 transition-transform group-hover:scale-110" />
              )}
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-3">
          <ModeToggle />
          <Button 
            variant="ghost" 
            size="sm" 
            className="hover:bg-gradient-to-r hover:from-primary/5 hover:to-purple/5 hover:text-primary transition-all duration-200"
            asChild
          >
            <Link href="/login">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Link>
          </Button>
          <Button 
            size="sm" 
            className="bg-gradient-to-r from-emerald-500 via-teal-500 to-purple-600 hover:from-emerald-600 hover:via-teal-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 text-white border-0"
            asChild
          >
            <Link href="/login">
              <UserPlus className="h-4 w-4 mr-2" />
              Get Started
            </Link>
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center space-x-2">
          <ModeToggle />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="hover:bg-gradient-to-r hover:from-primary/5 hover:to-purple/5 transition-all duration-200"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="bg-background/95 backdrop-blur-xl border-l border-border/50"
            >
              <div className="flex flex-col space-y-4 mt-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="px-3 py-2 text-sm font-medium transition-all duration-200 hover:text-primary hover:bg-gradient-to-r hover:from-primary/5 hover:to-purple/5 rounded-lg flex items-center gap-2"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.name}
                  </Link>
                ))}
                
                <div className="border-t border-border/50 pt-4 space-y-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-start hover:bg-gradient-to-r hover:from-primary/5 hover:to-purple/5" 
                    asChild
                  >
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </Link>
                  </Button>
                  <Button 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-purple-600 hover:from-emerald-600 hover:via-teal-600 hover:to-purple-700 text-white border-0" 
                    asChild
                  >
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Get Started
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
