import { Mail, Clock, Facebook, Instagram, Linkedin, Youtube } from "lucide-react";

const FooterSection = () => {
  return (
    <footer className="bg-gradient-to-r from-primary via-brand-primary to-primary text-primary-foreground section-spacing-sm relative overflow-hidden">
      {/* Éléments décoratifs */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-brand-accent/10 rounded-full blur-3xl animate-bounce-gentle"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold mb-4">CrazyPixels</h3>
            <p className="text-primary-foreground/80">
              Votre partenaire pour une retouche photo professionnelle assistée par IA.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <div className="space-y-2 text-primary-foreground/80">
              <p>Retouche automatique</p>
              <p>Support client</p>
              <p>Qualité professionnelle</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <div className="space-y-2 text-primary-foreground/80">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>contact@crazypixels.fr</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Réponse sous 4h</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Suivez-nous</h3>
            <div className="flex gap-4 mb-4">
              <Facebook className="h-5 w-5 hover:text-brand-accent cursor-pointer transition-colors" />
              <Instagram className="h-5 w-5 hover:text-brand-accent cursor-pointer transition-colors" />
              <Linkedin className="h-5 w-5 hover:text-brand-accent cursor-pointer transition-colors" />
              <Youtube className="h-5 w-5 hover:text-brand-accent cursor-pointer transition-colors" />
            </div>
            <p className="text-sm text-primary-foreground/80">
              Restez informé de nos dernières innovations IA
            </p>
          </div>
        </div>
        
        <div className="border-t border-primary-foreground/20 pt-8 text-center text-sm text-primary-foreground/80">
          <p className="mb-2">
            <a href="/mentions-legales" className="hover:text-brand-accent cursor-pointer">Mentions légales</a> • 
            <a href="/politique-confidentialite" className="hover:text-brand-accent cursor-pointer"> Politique de confidentialité</a> • 
            <a href="/cgv" className="hover:text-brand-accent cursor-pointer"> CGV</a>
          </p>
          <p>&copy; 2025 CrazyPixels. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;