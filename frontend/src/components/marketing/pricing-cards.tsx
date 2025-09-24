import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Sparkles, Star } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    description: "Perfect for individual creators",
    features: [
      "2 video uploads per month",
      "Basic similarity detection", 
      "Standard certificates",
      "Community support",
    ],
    cta: "Get Started",
    href: "/dashboard",
    popular: false,
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month", 
    description: "Great for content creators",
    features: [
      "15 video uploads per month",
      "Advanced AI detection",
      "Legal-grade certificates", 
      "Priority support",
      "API access",
      "Bulk processing",
    ],
    cta: "Start Free Trial",
    href: "/dashboard",
    popular: true,
    icon: <Crown className="w-5 h-5" />,
  },
  {
    name: "Enterprise", 
    price: "Custom",
    period: "contact us",
    description: "For large organizations",
    features: [
      "Unlimited video uploads",
      "White-label solution",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee", 
      "On-premise deployment",
    ],
    cta: "Contact Sales",
    href: "/contact",
    popular: false,
    icon: <Star className="w-5 h-5" />,
  },
];

export function PricingCards() {
  return (
    <section className="container px-4 py-16 mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Choose Your Protection Level
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          From individual creators to enterprise teams, we have a plan that scales with your needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan, index) => (
          <Card 
            key={index} 
            className={`
              relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1
              ${plan.popular 
                ? 'border-emerald-200 shadow-lg ring-2 ring-emerald-200/50 dark:border-emerald-800 dark:ring-emerald-800/50' 
                : 'border-border hover:border-muted-foreground/20 hover:shadow-lg'
              }
            `}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <Badge className="bg-gradient-to-r from-emerald-500 to-purple-600 text-white px-4 py-1.5 shadow-lg">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-6">
              <div className="flex items-center justify-center mb-3">
                <div className={`
                  p-2 rounded-full 
                  ${plan.popular 
                    ? 'bg-gradient-to-r from-emerald-100 to-purple-100 text-emerald-700 dark:from-emerald-900/30 dark:to-purple-900/30 dark:text-emerald-300' 
                    : index === 0 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                  }
                `}>
                  {plan.icon}
                </div>
              </div>
              
              <CardTitle className="text-2xl">
                {plan.name}
              </CardTitle>
              
              <div className="mt-4">
                <span className={`
                  text-4xl font-bold
                  ${plan.popular 
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-purple-600 bg-clip-text text-transparent' 
                    : ''
                  }
                `}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-muted-foreground ml-2">/{plan.period}</span>
                )}
              </div>
              
              <CardDescription className="mt-2">
                {plan.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Button 
                className={`
                  w-full mb-6 transition-all duration-300
                  ${plan.popular 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 shadow-lg hover:shadow-xl' 
                    : index === 0
                      ? 'border-blue-200 hover:border-blue-300 hover:bg-blue-50/50 dark:border-blue-800 dark:hover:bg-blue-900/20'
                      : 'border-orange-200 hover:border-orange-300 hover:bg-orange-50/50 dark:border-orange-800 dark:hover:bg-orange-900/20'
                  }
                `}
                variant={plan.popular ? "default" : "outline"}
                asChild
              >
                <Link href={plan.href}>
                  {plan.cta}
                </Link>
              </Button>
              
              <ul className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3">
                    <div className={`
                      w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                      ${plan.popular 
                        ? 'bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30' 
                        : 'bg-green-100 dark:bg-green-900/30'
                      }
                    `}>
                      <Check className={`
                        w-3 h-3 
                        ${plan.popular 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-green-600 dark:text-green-400'
                        }
                      `} />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
