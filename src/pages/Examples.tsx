import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { ArrowLeft, Eye, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useExamples, Example } from "@/hooks/useExamples";
import { useState } from "react";

const ExamplesPage = () => {
  const { examples, loading, getCategories } = useExamples();
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  
  const categories = getCategories();
  
  const filteredExamples = selectedCategory === "Tous" 
    ? examples 
    : examples.filter(example => example.category === selectedCategory);
  
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        {/* Header de la page */}
        <div className="bg-gradient-hero relative overflow-hidden">
          <div className="absolute inset-0 bg-black/30"></div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">
            <div className="flex items-center gap-4 mb-6">
              <Button asChild variant="outline" size="sm" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Link>
              </Button>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Galerie d'<span className="text-brand-accent">Exemples</span>
            </h1>
            <p className="text-xl text-white/90 max-w-2xl">
              Découvrez la puissance de notre IA à travers des exemples concrets de retouches photo professionnelles
            </p>
          </div>
        </div>

        {/* Filtres par catégorie */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === selectedCategory ? "default" : "outline"}
                className={category === selectedCategory 
                  ? "bg-gradient-button text-white" 
                  : "border-brand-primary/20 text-brand-primary hover:bg-brand-primary/10"
                }
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Grille d'exemples */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredExamples.map((example) => (
              <Dialog key={example.id}>
                <DialogTrigger asChild>
                  <Card className="overflow-hidden hover:shadow-elegant transition-all duration-300 group cursor-pointer">
                    <CardContent className="p-0">
                      {/* Comparaison Avant/Après */}
                      <div className="relative h-64 bg-gray-100 overflow-hidden">
                        <div className="absolute inset-0 flex">
                           <div className="w-1/2 relative">
                             <img 
                               src={example.beforeImage} 
                               alt="Avant" 
                               className="w-full h-full object-cover"
                               onError={(e) => {
                                 e.currentTarget.style.display = 'none';
                                 e.currentTarget.nextElementSibling?.classList.add('hidden');
                               }}
                             />
                             <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                               AVANT
                             </div>
                           </div>
                           <div className="w-1/2 relative">
                             <img 
                               src={example.afterImage} 
                               alt="Après" 
                               className="w-full h-full object-cover"
                               onError={(e) => {
                                 e.currentTarget.style.display = 'none';
                                 e.currentTarget.nextElementSibling?.classList.add('hidden');
                               }}
                             />
                             <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                               APRÈS
                             </div>
                           </div>
                        </div>
                        <div className="absolute inset-y-0 left-1/2 w-1 bg-white shadow-lg transform -translate-x-1/2"></div>
                      </div>

                      {/* Informations */}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full font-medium">
                            {example.category}
                          </span>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="h-4 w-4 text-brand-primary" />
                          </div>
                        </div>
                        <h3 className="font-semibold text-lg mb-2 text-gray-900">
                          {example.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {example.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                
                <DialogContent className="max-w-6xl w-full h-[90vh] p-0">
                  <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
                    {/* Header avec titre et bouton fermer */}
                    <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-white text-xl font-bold mb-1">{example.title}</h2>
                          <span className="text-white/80 text-sm bg-white/20 px-3 py-1 rounded-full">
                            {example.category}
                          </span>
                        </div>
                        <DialogClose asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-white hover:bg-white/20 p-2"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </DialogClose>
                      </div>
                    </div>

                    {/* Comparaison d'images en grand */}
                    <div className="flex h-full">
                       <div className="w-1/2 relative">
                         <img 
                           src={example.beforeImage} 
                           alt="Image avant retouche" 
                           className="w-full h-full object-contain"
                           onError={(e) => {
                             e.currentTarget.src = '/placeholder.svg';
                           }}
                         />
                         <div className="absolute bottom-4 left-4 bg-red-500 text-white px-4 py-2 rounded font-semibold">
                           AVANT
                         </div>
                       </div>
                       <div className="w-1/2 relative">
                         <img 
                           src={example.afterImage} 
                           alt="Image après retouche" 
                           className="w-full h-full object-contain"
                           onError={(e) => {
                             e.currentTarget.src = '/placeholder.svg';
                           }}
                         />
                         <div className="absolute bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded font-semibold">
                           APRÈS
                         </div>
                       </div>
                    </div>
                    <div className="absolute inset-y-0 left-1/2 w-1 bg-white/80 shadow-2xl transform -translate-x-1/2"></div>
                    
                    {/* Description en bas */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                      <p className="text-white/90 text-center max-w-2xl mx-auto">
                        {example.description}
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16 py-12 bg-gradient-to-r from-brand-primary/5 to-brand-accent/5 rounded-2xl">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              Prêt à transformer vos photos ?
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Rejoignez des milliers de clients satisfaits et découvrez la magie de notre IA
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild
                size="lg" 
                className="bg-gradient-button hover:scale-105 transform transition-all duration-300 shadow-glow px-8 py-4"
              >
                <Link to="/auth">
                  🚀 Commencer maintenant
                </Link>
              </Button>
              <Button 
                asChild
                variant="outline" 
                size="lg"
                className="border-brand-primary/20 text-brand-primary hover:bg-brand-primary/10 px-8 py-4"
              >
                <Link to="/">
                  ← Retour à l'accueil
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ExamplesPage;