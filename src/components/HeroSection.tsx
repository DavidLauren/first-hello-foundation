import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { usePricing } from "@/hooks/usePricing";
import { useEffect, useRef } from "react";

const HeroSection = () => {
  const { pricePerPhoto } = usePricing();
  const pixelBackgroundRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const background = pixelBackgroundRef.current;
    if (background) {
      const numPixels = 40;
      for (let i = 0; i < numPixels; i++) {
        const pixel = document.createElement('li');
        pixel.classList.add('pixel');
        const size = Math.random() * 10 + 5;
        pixel.style.width = `${size}px`;
        pixel.style.height = `${size}px`;
        pixel.style.left = `${Math.random() * 100}vw`;
        pixel.style.animationDuration = `${Math.random() * 15 + 10}s`;
        pixel.style.animationDelay = `${Math.random() * 10}s`;
        background.appendChild(pixel);
      }
    }
  }, []);
  return (
    <section className="relative min-h-[calc(95vh-40px)] sm:min-h-[calc(95vh-140px)] bg-gradient-hero flex items-center justify-center text-center px-3 sm:px-4 lg:px-6 overflow-hidden w-full">
      {/* Pixel Background */}
      <ul ref={pixelBackgroundRef} className="pixel-background absolute inset-0 pointer-events-none"></ul>
      {/* Overlay pour améliorer la lisibilité */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      {/* Éléments décoratifs flottants améliorés */}
      <div className="absolute top-20 left-4 sm:left-10 w-16 sm:w-20 h-16 sm:h-20 bg-white/10 rounded-full blur-xl animate-bounce-gentle"></div>
      <div className="absolute top-40 right-4 sm:right-20 w-24 sm:w-32 h-24 sm:h-32 bg-brand-accent/20 rounded-full blur-2xl animate-glow-pulse"></div>
      <div className="absolute bottom-20 left-1/4 w-12 sm:w-16 h-12 sm:h-16 bg-brand-secondary/20 rounded-full blur-xl animate-bounce-gentle delay-1000"></div>
      <div className="absolute top-1/3 left-1/3 w-20 h-20 bg-brand-primary/10 rounded-full blur-2xl animate-pulse delay-500"></div>
      
      <div className="relative z-10 max-w-5xl mx-auto text-white w-full animate-fade-in-up">
        {/* Titre principal avec effet de glow amélioré */}
        <h1 className="text-4xl sm:text-6xl lg:text-8xl font-bold mb-6 sm:mb-8">
          <span className="bg-gradient-to-r from-white via-brand-accent to-white bg-clip-text text-transparent">
            CrazyPixels
          </span>
        </h1>
        
        {/* Sous-titre accrocheur */}
        <p className="text-xl sm:text-2xl lg:text-4xl mb-4 sm:mb-6 font-semibold drop-shadow-lg">
          Retouche Photo <span className="text-brand-accent">IA</span> Professionnelle
        </p>
        
        {/* Description */}
        <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed px-2">
          Transformez vos images en chef-d'œuvres avec notre intelligence artificielle de pointe. 
          Ajout, Suppression d'objets, amélioration d'éclairage, photo trouble, augmentation de la définition (DPI) pour projet d'agrandissement poster, tableau et bien plus encore.
        </p>
        
        {/* Badge de promesse avec design moderne amélioré */}
        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-6 inline-block border border-white/20 shadow-elegant mb-8 sm:mb-10 mx-2 max-w-full hover-lift animate-scale-in">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-brand-accent rounded-full animate-pulse"></div>
              <span className="font-semibold text-sm sm:text-lg whitespace-nowrap">Qualité Pro</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-white/30"></div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-brand-secondary rounded-full animate-pulse delay-300"></div>
              <span className="font-semibold text-sm sm:text-lg whitespace-nowrap">Livraison 6H00</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-white/30"></div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-500"></div>
              <span className="font-semibold text-sm sm:text-lg whitespace-nowrap">{pricePerPhoto}€ TTC</span>
            </div>
          </div>
        </div>
        
        {/* CTA Button moderne amélioré */}
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6 justify-center items-stretch sm:items-center w-full max-w-lg sm:max-w-none mx-auto px-4 sm:px-2 animate-slide-in-left">
          <Button 
            asChild
            size="lg" 
            className="btn-premium px-6 sm:px-8 lg:px-10 py-4 sm:py-5 text-base sm:text-lg lg:text-xl font-semibold w-full sm:w-auto flex-1 sm:flex-none animate-glow-pulse"
          >
            <Link to="/account" className="text-center">
              Essayer avec votre photo
            </Link>
          </Button>
          <Button 
            asChild
            variant="outline" 
            size="lg"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg w-full sm:w-auto flex-1 sm:flex-none"
          >
            <Link to="/examples" className="text-center">
              Voir plus d'exemples
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;