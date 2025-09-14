import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PolitiqueConfidentialite = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl text-center">Politique de Confidentialité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">1. Collecte des Données Personnelles</h2>
              <p className="text-muted-foreground mb-4">
                Le site <strong>www.crazypixels.fr</strong> recueille les informations fournies par les utilisateurs dans les formulaires de contact ou de commande. Ces données incluent :
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Nom, prénom</li>
                <li>Adresse e-mail</li>
                <li>Numéro de téléphone</li>
                <li>Adresse postale (le cas échéant)</li>
                <li>Informations relatives à la société du client (nom, numéro de TVA, etc.)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">2. Utilisation des Données</h2>
              <p className="text-muted-foreground mb-4">
                Les données collectées sont utilisées pour les finalités suivantes :
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Traitement des commandes</li>
                <li>Gestion de la relation client</li>
                <li>Réponse aux demandes de contact</li>
                <li>Envoi d'informations commerciales (avec votre consentement)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">3. Hébergement et Stockage</h2>
              <p className="text-muted-foreground">
                Les données sont hébergées par Hostinger. Elles sont stockées en Europe et sécurisées pour empêcher tout accès non autorisé.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">4. Partage des Données</h2>
              <p className="text-muted-foreground">
                Vos données ne sont pas vendues, louées ou cédées à des tiers. Elles peuvent être communiquées aux sous-traitants de Crazypixels (par exemple, un prestataire de services informatiques) uniquement pour la réalisation des prestations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">5. Vos Droits (RGPD)</h2>
              <p className="text-muted-foreground mb-4">
                Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Droit d'accès :</strong> demander une copie des données que nous détenons à votre sujet.</li>
                <li><strong>Droit de rectification :</strong> demander la correction de données inexactes.</li>
                <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données personnelles.</li>
                <li><strong>Droit à la limitation du traitement :</strong> demander de limiter l'utilisation de vos données.</li>
                <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré et portable.</li>
                <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données pour des motifs légitimes.</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                Vous pouvez exercer ces droits en nous contactant par e-mail à l'adresse suivante : <a href="mailto:contact@crazypixels.fr" className="text-primary hover:underline">contact@crazypixels.fr</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">6. Sécurité</h2>
              <p className="text-muted-foreground">
                Nous mettons en œuvre des mesures de sécurité pour protéger vos données contre la perte, la divulgation ou la modification non autorisée.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">7. Cookies</h2>
              <p className="text-muted-foreground">
                Pour en savoir plus sur l'utilisation des cookies, veuillez consulter notre <strong>Politique de Cookies</strong>.
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

export default PolitiqueConfidentialite;