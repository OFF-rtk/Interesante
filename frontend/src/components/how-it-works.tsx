// components/how-it-works.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  IconFingerprint, 
  IconSearch, 
  IconFileText, 
  IconShield,
  IconArrowDown,
  IconArrowRight,
  IconPlayerPlay,
  IconHeart,
  IconMessageCircle
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"

const steps = [
  {
    step: "01",
    icon: IconFingerprint,
    title: "Fingerprinting Your Content",
    subtitle: 'The "DNA" Sample',
    description: "When you submit a video, our system doesn't store the video itself. Instead, our Scout Agent analyzes it and creates a unique digital \"fingerprint\" (a perceptual hash). This fingerprint is like the video's unique DNA—it can be used to identify copies, even if they've been slightly edited or compressed.",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600"
  },
  {
    step: "02", 
    icon: IconSearch,
    title: "The AI Scout",
    subtitle: "The 24/7 Detective",
    description: "Once your content is fingerprinted, the Scout Agent gets to work. It continuously scans public platforms like YouTube, TikTok, and Instagram, creating fingerprints for new videos it finds. It then compares these fingerprints to your own. If it finds a match that exceeds a high confidence score, it flags it as a potential infringement.",
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600"
  },
  {
    step: "03",
    icon: IconFileText,
    title: "The Takedown Assistant", 
    subtitle: `The "Clerk" Agent`,
    description: "When an infringement is found, it appears in your dashboard. If you decide to take action, our Clerk Agent assists you. It takes the public information about the infringing content and your original work and automatically drafts a professional DMCA takedown notice. All you have to do is review it and send it to the platform's designated copyright agent.",
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
    iconColor: "text-green-600"
  }
]

export function HowItWorks() {

    const router = useRouter()

  const handleFeedbackClick = () => {
    // Scroll to feedback section on same page
    router.push('/feedback')
  }

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="text-center space-y-6 mb-16">
        <div className="space-y-4">
          <Badge variant="outline" className="text-sm font-medium">
            <IconShield className="w-3 h-3 mr-1" />
            AI-Powered Protection
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Stop Content Theft 
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Before It Starts</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Our AI agents work 24/7 to monitor the internet, detect unauthorized use of your content, and help you take action automatically.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" className="gap-2">
            Get Started Free
            <IconArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="lg" className="gap-2">
            <IconPlayerPlay className="w-4 h-4" />
            Watch Demo
          </Button>
        </div>
      </div>

      {/* How It Works Steps */}
      <div className="space-y-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Two AI agents working together to protect your creative work
          </p>
        </div>

        <div className="space-y-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-8">
                  <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Step Number & Icon */}
                    <div className="flex-shrink-0">
                        <div className="relative">
                            <div className={`w-16 h-16 rounded-xl ${step.bgColor} flex items-center justify-center mb-4`}>
                                <step.icon className={`w-8 h-8 ${step.iconColor}`} />
                            </div>
                            <Badge 
                                variant="secondary" 
                                className="absolute -top-2 -right-2 font-mono text-xs"
                            >
                                {step.step}
                            </Badge>
                        </div>
                    </div>


                    {/* Content */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                        <p className={`text-sm font-medium bg-gradient-to-r ${step.color} bg-clip-text text-transparent`}>
                          {step.subtitle}
                        </p>
                      </div>
                      <p className="text-muted-foreground leading-relaxed text-lg">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Connector Arrow */}
              {index < steps.length - 1 && (
                <div className="flex justify-center my-8">
                  <div className="flex flex-col items-center">
                    <div className="w-px h-6 bg-gradient-to-b from-border to-transparent"></div>
                    <IconArrowDown className="w-5 h-5 text-muted-foreground/50" />
                    <div className="w-px h-6 bg-gradient-to-b from-transparent to-border"></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

        <div className="flex items-center justify-center my-20">
        <div className="flex items-center space-x-3">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-border"></div>
            <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
            </div>
            <div className="w-12 h-px bg-gradient-to-r from-border to-transparent"></div>
        </div>
        </div>


      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row gap-8 items-center text-center lg:text-left">
            {/* Icon Section */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-16 h-16 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                  <IconMessageCircle className="w-8 h-8 text-orange-600" />
                </div>
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 font-mono text-xs bg-orange-200 text-orange-800"
                >
                  ♥
                </Badge>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-bold mb-2">Help Us Build Something You'll Love</h3>
                <p className="text-sm font-medium bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  Your Voice Shapes Our Future
                </p>
              </div>
              <p className="text-muted-foreground leading-relaxed text-lg">
                We're building Copyright Shield based on real creator needs. Share your thoughts, concerns, and wishlist items to help us create the perfect content protection tool for you.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 lg:justify-start justify-center">
                <Button onClick={handleFeedbackClick} className="gap-2">
                  <IconMessageCircle className="w-4 h-4" />
                  Share Your Feedback
                </Button>
                <Button variant="outline" className="gap-2">
                  <IconHeart className="w-4 h-4" />
                  Join Our Community
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Takes 2 minutes • Directly influences our roadmap • Early access guaranteed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cool Divider */}
        <div className="flex items-center justify-center my-20">
        <div className="flex items-center space-x-3">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-border"></div>
            <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
            </div>
            <div className="w-12 h-px bg-gradient-to-r from-border to-transparent"></div>
        </div>
        </div>


        {/* Bottom CTA - Hero Style */}
        <div className="text-center mt-16 space-y-6">
            <div className="space-y-4">
                <h3 className="text-3xl md:text-4xl font-bold tracking-tight">
                Protect Your Creative Work 
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Today</span>
                </h3>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Join our early users and help us build the future of content protection.
                </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" className="gap-2">
                <IconShield className="w-4 h-4" />
                Start Protecting Now
                </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
                Try with 1 free video • No credit card required
            </p>
        </div>
    </div>
  )
}
