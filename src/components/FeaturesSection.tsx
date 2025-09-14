import { Card, CardContent } from "@/components/ui/card";
import { Bot, Zap, Award } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Bot,
      title: "Intelligence Artificielle",
      description: "Algorithmes de pointe pour une retouche automatique et précise"
    },
    {
      icon: Zap,
      title: "Rapidité",
      description: "Résultats en quelques minutes grâce à notre technologie optimisée"
    },
    {
      icon: Award,
      title: "Qualité Pro",
      description: "Résultats de qualité professionnelle pour tous vos projets"
    }
  ];

  return (
    <section className="section-spacing bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
            Pourquoi choisir CrazyPixels ?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Une technologie de pointe au service de votre créativité
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="card-premium text-center p-8 hover-lift group animate-fade-in-up" style={{animationDelay: `${index * 0.2}s`}}>
              <CardContent className="pt-6">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-hero rounded-full flex items-center justify-center shadow-glow group-hover:animate-bounce-gentle">
                  <feature.icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:text-gradient transition-all duration-300">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;