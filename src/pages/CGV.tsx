import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CGV = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl text-center">Conditions Générales de Vente (CGV)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">1. Objet et Champ d'application</h2>
              <p className="text-muted-foreground">
                Les présentes Conditions Générales de Vente (CGV) s'appliquent à toutes les prestations de services photographiques, audiovisuelles et de formation proposées par Crazypixels, entreprise immatriculée sous le numéro SIRET [Numéro SIRET], ci-après désignée "le Prestataire", à ses clients professionnels (ci-après désigné "le Client").
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">2. Commandes</h2>
              <p className="text-muted-foreground">
                Les commandes sont validées par l'acceptation d'un devis ou par un bon de commande signé par le Client. La commande est considérée comme ferme et définitive dès réception par le Prestataire du document signé.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">3. Prix et Modalités de Paiement</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>Les prix des prestations sont indiqués en Euros et hors taxes (HT).</p>
                <p>Les factures sont envoyées par email au Client.</p>
                <p>Les paiements sont à effectuer selon les modalités convenues sur le devis (acompte, solde, délais de règlement). Tout retard de paiement entraînera l'application de pénalités de retard.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">4. Exécution des Prestations</h2>
              <p className="text-muted-foreground">
                Le Prestataire s'engage à exécuter les prestations avec professionnalisme et à respecter les délais de livraison convenus. Les livrables numériques (fichiers photo/vidéo) sont envoyés par email ou via un lien de téléchargement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">5. Annulation</h2>
              <p className="text-muted-foreground">
                Toute annulation d'une commande par le Client entraîne le remboursement intégral des sommes déjà versées, sans frais de pénalité, quel que soit le motif ou le délai. L'annulation doit être notifiée par écrit au Prestataire.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">6. Propriété Intellectuelle</h2>
              <p className="text-muted-foreground">
                Le Prestataire reste titulaire des droits d'auteur sur les photographies et vidéos réalisées. Le Client reçoit une licence d'utilisation non exclusive des œuvres pour les usages définis dans le devis. Toute utilisation non prévue au contrat (par exemple, utilisation commerciale sans accord) est soumise à l'achat de droits supplémentaires.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">7. Responsabilité</h2>
              <div className="space-y-3 text-muted-foreground">
                <p><strong>Absence de responsabilité matérielle :</strong> Le Prestataire ne pourra en aucun cas être tenu responsable des dommages matériels qui pourraient survenir lors de l'exécution des prestations.</p>
                <p>Le Prestataire décline toute responsabilité en cas de force majeure ou d'événement indépendant de sa volonté.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">8. Données Personnelles</h2>
              <p className="text-muted-foreground">
                Les données personnelles collectées lors des commandes sont traitées conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés. Elles sont utilisées uniquement pour la gestion de la relation commerciale et la réalisation des prestations. Le Client dispose d'un droit d'accès, de rectification et d'opposition.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">9. Litiges</h2>
              <p className="text-muted-foreground">
                Tout litige relatif à l'interprétation et à l'exécution des présentes CGV sera soumis au droit français. En cas de désaccord persistant, les tribunaux compétents seront ceux du ressort de [Ville où le tribunal compétent se situe].
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

export default CGV;