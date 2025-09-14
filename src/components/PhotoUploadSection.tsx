import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Image, CreditCard } from "lucide-react";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useToast } from "@/hooks/use-toast";
import { usePromoCodes } from "@/hooks/usePromoCodes";
import { useAuth } from "@/contexts/AuthContext";
import { usePricing } from "@/hooks/usePricing";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const PhotoUploadSection = () => {
  const { uploading, uploadedFiles, uploadFiles, removeFile, clearFiles } = useFileUpload();
  const [instructions, setInstructions] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { userFreePhotos, useFreePhotos, refetch } = usePromoCodes();
  const { pricePerPhoto } = usePricing();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFiles(e.target.files);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour envoyer vos photos",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (uploadedFiles.length === 0) {
      toast({
        title: "Aucune photo",
        description: "Veuillez ajouter au moins une photo",
        variant: "destructive",
      });
      return;
    }

    setProcessingPayment(true);

    try {
      const photoCount = uploadedFiles.length;
      
      // SÉCURITÉ: Tous les utilisateurs DOIVENT passer par le paiement côté serveur
      // L'edge function déterminera les prix et les photos gratuites
      
      // Créer la commande - laisser l'edge function gérer toute la logique
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
        body: {
          files: uploadedFiles.map(file => ({
            name: file.name,
            size: file.size,
            path: file.path
          })),
          instructions: instructions || null,
          totalPhotos: photoCount
          // L'edge function calculera tout côté serveur pour la sécurité
        }
      });

      if (paymentError) {
        throw paymentError;
      }

      // Si l'utilisateur est VIP ET que la commande a été créée directement
      if (paymentData?.success && paymentData?.message?.includes('VIP')) {
        toast({
          title: "Commande VIP créée",
          description: `${photoCount} photo(s) envoyée(s) - Traitement prioritaire activé`,
        });
        
        clearFiles();
        setInstructions("");
        return;
      }

      // Si toutes les photos sont gratuites (codes promo, etc.)
      if (paymentData?.success && paymentData?.message?.includes('gratuite')) {
        toast({
          title: "Photos envoyées gratuitement",
          description: `${photoCount} photo(s) envoyée(s) en utilisant vos photos gratuites`,
        });
        clearFiles();
        setInstructions("");
        return;
      }

      // Pour le paiement normal
      if (paymentData?.url) {        
        // Rediriger vers Stripe Checkout dans un nouvel onglet
        window.open(paymentData.url, '_blank');
        
        toast({
          title: "Redirection vers le paiement",
          description: `Paiement requis pour ${photoCount} photo(s)`,
        });
      } else {
        throw new Error("Aucune URL de paiement reçue");
      }

    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Erreur de paiement",
        description: "Une erreur est survenue lors de la création du paiement",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const calculateTotalCost = () => {
    const photoCount = uploadedFiles.length;
    
    // Si VIP, tout est gratuit
    if (profile?.is_vip) {
      return {
        totalPhotos: photoCount,
        freePhotos: photoCount,
        paidPhotos: 0,
        totalCost: 0
      };
    }
    
    const freePhotosToUse = Math.min(userFreePhotos, photoCount);
    const photosToPayFor = photoCount - freePhotosToUse;
    return {
      totalPhotos: photoCount,
      freePhotos: freePhotosToUse,
      paidPhotos: photosToPayFor,
      totalCost: photosToPayFor * pricePerPhoto
    };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Envoyer mes photos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Zone d'upload */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => document.getElementById("photo-upload")?.click()}
        >
          <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2">
            {uploading ? "Upload en cours..." : "Glissez vos photos ici"}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            ou cliquez pour sélectionner des fichiers
          </p>
          <p className="text-xs text-muted-foreground">
            Formats acceptés: JPG, PNG, WEBP (max 50MB par fichier)
          </p>
          <Input
            id="photo-upload"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </div>

        {/* Fichiers uploadés */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Photos ajoutées ({uploadedFiles.length})</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFiles}
                className="text-destructive hover:text-destructive"
              >
                Tout supprimer
              </Button>
            </div>
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Image className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file)}
                    className="text-destructive hover:text-destructive flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="space-y-2">
          <label htmlFor="instructions" className="text-sm font-medium">
            Instructions particulières (optionnel)
          </label>
          <Textarea
            id="instructions"
            placeholder="Décrivez vos souhaits de retouche..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
          />
        </div>

        {/* Résumé des coûts */}
        {uploadedFiles.length > 0 && (
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium">Résumé de la commande</h4>
            {(() => {
              const { totalPhotos, freePhotos, paidPhotos, totalCost } = calculateTotalCost();
              return (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Photos à traiter:</span>
                    <span>{totalPhotos}</span>
                  </div>
                  {profile?.is_vip ? (
                    <div className="flex justify-between text-purple-600 font-medium">
                      <span>Statut VIP - Traitement gratuit:</span>
                      <span>✨ INCLUS</span>
                    </div>
                  ) : freePhotos > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Photos gratuites disponibles:</span>
                      <span>-{freePhotos}</span>
                    </div>
                  )}
                  {paidPhotos > 0 && (
                    <div className="flex justify-between">
                      <span>Photos à facturer ({pricePerPhoto}€/photo):</span>
                      <span>{paidPhotos}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-lg border-t pt-2">
                    <span>Total:</span>
                    <span className={profile?.is_vip ? "text-purple-600" : ""}>
                      {totalCost === 0 ? (profile?.is_vip ? "VIP - GRATUIT" : "GRATUIT") : `${totalCost}€`}
                    </span>
                  </div>
                  {profile?.is_vip ? (
                    <p className="text-xs text-purple-600 font-medium">
                      ✨ Traitement prioritaire VIP activé
                    </p>
                  ) : userFreePhotos > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Vous avez {userFreePhotos} photo(s) gratuite(s) disponible(s)
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Bouton d'envoi */}
        <Button
          onClick={handleSubmit}
          disabled={uploading || uploadedFiles.length === 0 || processingPayment}
          className="w-full"
          size="lg"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          {processingPayment 
            ? "Traitement en cours..." 
            : uploading 
              ? "Upload en cours..." 
              : profile?.is_vip
                ? "✨ Envoyer (VIP)"
                : uploadedFiles.length > 0 && calculateTotalCost().totalCost === 0
                  ? "Envoyer gratuitement"
                  : "Procéder au paiement"
          }
        </Button>
      </CardContent>
    </Card>
  );
};

export default PhotoUploadSection;