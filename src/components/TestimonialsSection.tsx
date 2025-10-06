import { Card, CardContent } from "@/components/ui/card";
import { Star, StarHalf } from "lucide-react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Marie Dubois",
      role: "Photographe professionnelle",
      comment: "Service impeccable ! Les retouches sont d'une qualité exceptionnelle et le délai de livraison est toujours respecté.",
      rating: 5,
    },
    {
      name: "Thomas Martin",
      role: "Responsable marketing",
      comment: "Nous utilisons CrazyPixels pour toutes nos campagnes. Les résultats sont toujours à la hauteur de nos attentes.",
      rating: 5,
    },
    {
      name: "Sophie Laurent",
      role: "Créatrice de contenu",
      comment: "Un gain de temps considérable ! Je recommande vivement ce service à tous les créateurs de contenu.",
      rating: 4.5,
    },
  ];

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
            Clients Satisfaits
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Découvrez ce que nos clients pensent de nos services
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index}
              className="hover-scale transition-all duration-300 hover:shadow-elegant bg-card/50 backdrop-blur-sm border-primary/10"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(Math.floor(testimonial.rating))].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ))}
                  {testimonial.rating % 1 !== 0 && (
                    <StarHalf className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  )}
                </div>
                <p className="text-foreground mb-6 italic">
                  "{testimonial.comment}"
                </p>
                <div className="border-t border-border pt-4">
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 rounded-full">
            <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
            <span className="font-semibold text-lg">4.9/5</span>
            <span className="text-muted-foreground">sur 500+ avis</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
