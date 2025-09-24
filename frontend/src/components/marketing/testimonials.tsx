import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
  {
    content: "Copyright Shield has revolutionized how I protect my content. The AI detection is incredibly accurate and the certificates are court-ready.",
    author: "Sarah Chen",
    role: "Content Creator",
    avatar: "SC",
    rating: 5,
  },
  {
    content: "As a filmmaker, protecting my work is crucial. The 2-second processing time is mind-blowing, and the legal certificates give me peace of mind.",
    author: "Marcus Rodriguez",
    role: "Independent Filmmaker", 
    avatar: "MR",
    rating: 5,
  },
  {
    content: "The enterprise features are exactly what we needed. White-label solution and API access made integration seamless.",
    author: "Jennifer Kim",
    role: "CTO, MediaTech Inc",
    avatar: "JK",
    rating: 5,
  },
  {
    content: "99.9% accuracy isn't just marketing - it's real. Copyright Shield caught similarities I would have missed manually.",
    author: "David Thompson",
    role: "Digital Artist",
    avatar: "DT",
    rating: 5,
  },
  {
    content: "The blockchain verification adds an extra layer of security. My clients trust the certificates completely.",
    author: "Lisa Wong",
    role: "Legal Advisor",
    avatar: "LW",
    rating: 5,
  },
  {
    content: "From upload to certificate in under 10 seconds. This tool has saved me countless hours of manual verification.",
    author: "Alex Johnson",
    role: "Video Producer",
    avatar: "AJ",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="container px-4 py-16 mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Trusted by Creators Worldwide
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Join thousands of creators who trust Copyright Shield to protect their content.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <Card key={index} className="h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              <blockquote className="text-sm leading-relaxed mb-6">
                "{testimonial.content}"
              </blockquote>
              
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" />
                  <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{testimonial.author}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
