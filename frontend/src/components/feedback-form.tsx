// components/feedback-form.tsx
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { 
  IconSend, 
  IconHeart, 
  IconMessageCircle,
  IconMail,
  IconSparkles
} from "@tabler/icons-react"
import emailjs from '@emailjs/browser'

export function FeedbackForm() {
  const [feedback, setFeedback] = useState("")
  const [email, setEmail] = useState("")
  const [interest, setInterest] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
        emailjs.send(
            'service_rbmk3gh',
            'template_m8z2v4x',
            {
                interest_level: interest,
                user_email: email || 'Not Provided',
                feedback: feedback,
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
            },
            'Z8VN58zrhHBtiQrS2'
        ) 
        setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to send feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Thank You State
  if (isSubmitted) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <Badge variant="outline" className="text-sm font-medium">
            <IconSparkles className="w-3 h-3 mr-1" />
            Feedback Received
          </Badge>
          <h2 className="text-3xl font-bold">Thank You!</h2>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Your feedback is incredibly valuable as we build Copyright Shield. We'll keep you updated on our progress!
          </p>
        </div>

        <Card className="max-w-lg mx-auto">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <IconHeart className="h-6 w-6 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">What happens next?</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• We'll review your feedback carefully</p>
                <p>• You'll get early access when we launch</p>
                <p>• We might reach out for a quick chat</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main Feedback Form
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-6">
        <div className="space-y-4">
            <Badge variant="outline" className="text-sm font-medium">
                <IconMessageCircle className="w-3 h-3 mr-1" />
                Help Us Build Better
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                We'd Love Your 
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Feedback</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Your input will shape the future of Copyright Shield. Tell us what you think and what you need most.
            </p>
        </div>
      </div>

      {/* Feedback Form */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconMessageCircle className="w-5 h-5" />
            Quick Feedback Survey
          </CardTitle>
          <CardDescription>
            Help us understand how we can build something you'll actually use
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Interest Level */}
            <div className="space-y-3">
              <Label className="text-base font-medium">
                How interested are you in this concept?
              </Label>
              <RadioGroup value={interest} onValueChange={setInterest} required>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="very-interested" id="very" />
                    <Label htmlFor="very" className="cursor-pointer flex-1">
                      <span className="font-medium">Very interested</span>
                      <span className="block text-sm text-muted-foreground">I need this now and would pay for it!</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="somewhat-interested" id="somewhat" />
                    <Label htmlFor="somewhat" className="cursor-pointer flex-1">
                      <span className="font-medium">Somewhat interested</span>
                      <span className="block text-sm text-muted-foreground">Could be useful, but not urgent</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="not-interested" id="not" />
                    <Label htmlFor="not" className="cursor-pointer flex-1">
                      <span className="font-medium">Not really interested</span>
                      <span className="block text-sm text-muted-foreground">This doesn't solve a problem for me</span>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium flex items-center gap-2">
                <IconMail className="w-4 h-4" />
                Email (optional)
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                We'll send you updates when we launch (no spam, promise!)
              </p>
            </div>

            {/* Feedback Text */}
            <div className="space-y-2">
              <Label htmlFor="feedback" className="text-base font-medium">
                What would make this more valuable for you?
              </Label>
              <Textarea
                id="feedback"
                placeholder="Tell us what's missing, what concerns you have, or what would make this perfect for your needs..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[120px]"
                required
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-11" 
              disabled={isSubmitting || !interest || !feedback.trim()}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending Feedback...
                </>
              ) : (
                <>
                  <IconSend className="w-4 h-4 mr-2" />
                  Send Feedback
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Takes 2 minutes • Helps us build something you'll love
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
