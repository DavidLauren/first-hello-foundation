import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MentionsLegales = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl text-center">Mentions Légales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">1. Éditeur du site</h2>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Nom de l'entreprise :</strong> tabloo micro-entreprise</p>
                <p><strong>Numéro d'immatriculation :</strong> RCS 504 611 807</p>
                <p><strong>Numéro de TVA intracommunautaire :</strong> FR83504611807</p>
                <p><strong>Siège social :</strong> 58 rue du théâtre, 75015 Paris</p>
                <p><strong>Directeur de la publication :</strong> David Laurent et Laurence Coste</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">2. Hébergeur du site</h2>
              <div className="space-y-2 text-muted-foreground">
                <p><strong>Nom de l'hébergeur :</strong> HOSTINGER INTERNATIONAL LTD</p>
                <p><strong>Adresse :</strong> 61 Lordou Vironos Street, 6023 Larnaca, Chypre</p>
                <p><strong>Contact :</strong> <a href="https://www.hostinger.fr/contact" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://www.hostinger.fr/contact</a></p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">3. Propriété intellectuelle</h2>
              <p className="text-muted-foreground">
                L'ensemble des éléments du site www.crazypixels.fr (textes, images, vidéos, etc.) est la propriété exclusive de la société tabloo micro-entreprise. Toute reproduction, représentation, modification, publication ou adaptation, même partielle, de ces éléments est interdite sans autorisation écrite préalable.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">4. Données personnelles</h2>
              <p className="text-muted-foreground">
                Le site www.crazypixels.fr s'engage à protéger les données personnelles de ses utilisateurs. Pour en savoir plus sur la collecte et le traitement de vos données, veuillez consulter la Politique de Confidentialité du site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">5. Cookies</h2>
              <p className="text-muted-foreground">
                La navigation sur le site peut entraîner l'installation de cookies. Ces fichiers permettent de mémoriser des informations relatives à la navigation. L'utilisateur a la possibilité de les désactiver via les paramètres de son navigateur. Pour plus de détails, veuillez consulter notre Politique de Cookies.
              </p>
            </section>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default MentionsLegales;