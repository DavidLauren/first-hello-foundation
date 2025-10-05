import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wand2, Clock, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useHomepageImagePairs } from "@/hooks/useHomepageImagePairs";
import ImageViewer from "@/components/ImageViewer";
import beforeExample from "@/assets/before-example.jpg";
import afterExample from "@/assets/after-example.jpg";

const BeforeAfterSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { imagePairs, loading: loadingPairs } = useHomepageImagePairs();
  
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImageType, setViewerImageType] = useState<'before' | 'after'>('before');
  const [viewerImages, setViewerImages] = useState({ before: '', after: '', title: '', description: '' });

  const openViewer = (beforeImage: string, afterImage: string, title: string, description: string, type: 'before' | 'after') => {
    setViewerImages({ before: beforeImage, after: afterImage, title, description });
    setViewerImageType(type);
    setViewerOpen(true);
  };
  
  const handleTryPhoto = () => {
    if (user) {
      // Scroller vers la section upload
      const uploadSection = document.querySelector('#upload-section');
      if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate("/auth?tab=signup");
    }
  };
  
  const handleSeeExamples = () => {
    navigate("/examples");
  };
  return (
    <section className="section-spacing bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gradient">
            Découvrez la puissance de notre IA
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Suppression d'objets complexes en quelques minutes avec une précision chirurgicale
          </p>
        </div>

        <Card className="card-premium p-10 mb-10 animate-scale-in">
          {loadingPairs ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Images dynamiques de homepage_image_pairs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {imagePairs.map((pair, index) => (
                  <div key={pair.id} className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <h4 className={`font-bold mb-2 ${index < 2 ? 'text-3xl mb-6' : 'text-lg'} text-destructive`}>AVANT</h4>
                      <div className="flex justify-center">
                        <img 
                          src={pair.before_image_url} 
                          alt={`Photo originale - ${pair.title}`}
                          loading="lazy"
                          decoding="async"
                          sizes="(max-width: 1024px) 50vw, 25vw"
                          className={`max-w-full object-contain ${index < 2 ? 'rounded-xl shadow-elegant max-h-96' : 'rounded-lg shadow-lg max-h-80'} cursor-pointer border border-border/10 hover:scale-105 transition-transform duration-200`}
                          onClick={() => openViewer(pair.before_image_url, pair.after_image_url, pair.title || "", pair.description || "", 'before')}
                          onError={(e) => {
                            e.currentTarget.src = beforeExample;
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <h4 className={`font-bold mb-2 ${index < 2 ? 'text-3xl mb-6' : 'text-lg'} text-brand-accent`}>APRÈS</h4>
                      <div className="flex justify-center">
                        <img 
                          src={pair.after_image_url} 
                          alt={`Photo retouchée - ${pair.title}`}
                          loading="lazy"
                          decoding="async"
                          sizes="(max-width: 1024px) 50vw, 25vw"
                          className={`max-w-full object-contain ${index < 2 ? 'rounded-xl shadow-elegant max-h-96' : 'rounded-lg shadow-lg max-h-80'} cursor-pointer border border-brand-accent/10 hover:scale-105 transition-transform duration-200`}
                          onClick={() => openViewer(pair.before_image_url, pair.after_image_url, pair.title || "", pair.description || "", 'after')}
                          onError={(e) => {
                            e.currentTarget.src = afterExample;
                          }}
                        />
                      </div>
                    </div>
                    {(pair.title || pair.description) && (
                      <div className="col-span-2 text-center mt-2">
                        {pair.title && pair.title !== 'Paire fixe 1' && pair.title !== 'Paire fixe 2' && pair.title !== '0' && (
                          <p className="text-sm font-medium text-muted-foreground">{pair.title}</p>
                        )}
                        {pair.description && pair.description !== 'Ancienne paire fixe migrée' && pair.description !== '0' && (
                          <p className="text-xs text-muted-foreground mt-1">{pair.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-10 animate-fade-in">
            <div className="flex items-center gap-2 sm:gap-3 text-brand-primary font-bold text-sm sm:text-lg bg-brand-primary/5 px-3 sm:px-6 py-2 sm:py-3 rounded-full border border-brand-primary/20">
              <Wand2 className="h-4 w-4 sm:h-6 sm:w-6 flex-shrink-0" />
              <span className="whitespace-nowrap">Suppression intelligente</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-brand-primary font-bold text-sm sm:text-lg bg-brand-primary/5 px-3 sm:px-6 py-2 sm:py-3 rounded-full border border-brand-primary/20">
              <Clock className="h-4 w-4 sm:h-6 sm:w-6 flex-shrink-0" />
              <span className="whitespace-nowrap">3 minutes chrono</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-brand-primary font-bold text-sm sm:text-lg bg-brand-primary/5 px-3 sm:px-6 py-2 sm:py-3 rounded-full border border-brand-primary/20">
              <Award className="h-4 w-4 sm:h-6 sm:w-6 flex-shrink-0" />
              <span className="whitespace-nowrap">Qualité pro</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up">
            <Button 
              size="lg" 
              className="btn-premium text-brand-primary-foreground font-bold text-lg px-10 py-5"
              onClick={handleTryPhoto}
            >
              Essayez avec votre photo
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-brand-primary text-brand-primary hover:bg-brand-primary/10 hover-lift font-bold text-lg px-10 py-5"
              onClick={handleSeeExamples}
            >
              Voir plus d'exemples
            </Button>
          </div>
        </Card>

        <ImageViewer
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          beforeImage={viewerImages.before}
          afterImage={viewerImages.after}
          title={viewerImages.title}
          description={viewerImages.description}
          initialType={viewerImageType}
        />
      </div>
    </section>
  );
};

export default BeforeAfterSection;