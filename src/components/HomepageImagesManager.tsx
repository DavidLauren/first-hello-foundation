import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHomepageImages } from "@/hooks/useHomepageImages";
import { useState, useRef, useEffect } from "react";
import { Upload, Save, RotateCcw, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import beforeExample from "@/assets/before-example.jpg";
import afterExample from "@/assets/after-example.jpg";
import DynamicHomepageImagesManager from "@/components/DynamicHomepageImagesManager";

const HomepageImagesManager = () => {
  const { images, loading, uploading: hookUploading, uploadImage, updateImage, clearPair, pair1Enabled, pair2Enabled } = useHomepageImages();
  const [beforeUrl, setBeforeUrl] = useState('');
  const [afterUrl, setAfterUrl] = useState('');
  const [before2Url, setBefore2Url] = useState('');
  const [after2Url, setAfter2Url] = useState('');
  const [updating, setUpdating] = useState(false);
  const beforeFileRef = useRef<HTMLInputElement>(null);
  const afterFileRef = useRef<HTMLInputElement>(null);
  const before2FileRef = useRef<HTMLInputElement>(null);
  const after2FileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Initialiser les URLs quand les images sont chargées
  useEffect(() => {
    if (!loading) {
      setBeforeUrl(images.before);
      setAfterUrl(images.after);
      setBefore2Url(images.before2);
      setAfter2Url(images.after2);
    }
  }, [loading, images]);

  const handleFileUpload = async (file: File, type: 'before' | 'after' | 'before2' | 'after2') => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier image",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "Le fichier ne doit pas dépasser 5MB",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    const url = await uploadImage(file, type);
    if (url) {
      await updateImage(type, url);
      if (type === 'before') {
        setBeforeUrl(url);
      } else if (type === 'after') {
        setAfterUrl(url);
      } else if (type === 'before2') {
        setBefore2Url(url);
      } else {
        setAfter2Url(url);
      }
    }
    setUpdating(false);
  };

  const handleSaveUrl = async (type: 'before' | 'after' | 'before2' | 'after2') => {
    const url = type === 'before' ? beforeUrl : type === 'after' ? afterUrl : type === 'before2' ? before2Url : after2Url;
    if (url.trim()) {
      setUpdating(true);
      await updateImage(type, url.trim());
      setUpdating(false);
    }
  };

  const resetToDefault = async (type: 'before' | 'after' | 'before2' | 'after2') => {
    const defaultUrl = type === 'before' || type === 'before2' ? beforeExample : afterExample;
    setUpdating(true);
    await updateImage(type, defaultUrl);
    if (type === 'before') {
      setBeforeUrl(defaultUrl);
    } else if (type === 'after') {
      setAfterUrl(defaultUrl);
    } else if (type === 'before2') {
      setBefore2Url(defaultUrl);
    } else {
      setAfter2Url(defaultUrl);
    }
    setUpdating(false);
  };

  const handleDeletePair = async (pairNumber: 1 | 2) => {
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer la paire ${pairNumber} ? Cette action effacera les deux images (avant et après) de cette paire sur la page d'accueil.`
    );
    
    if (confirmed) {
      setUpdating(true);
      await clearPair(pairNumber);
      if (pairNumber === 1) {
        setBeforeUrl('');
        setAfterUrl('');
      } else {
        setBefore2Url('');
        setAfter2Url('');
      }
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Images de la page d'accueil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Images fixes historiques</CardTitle>
            <p className="text-sm text-muted-foreground">
              Gérez toutes les images "avant" et "après" de la page d'accueil
            </p>
          </div>
          <Button 
            onClick={() => {
              const dynamicSection = document.querySelector('#dynamic-images-section');
              if (dynamicSection) {
                dynamicSection.scrollIntoView({ behavior: 'smooth' });
                // Déclencher le clic sur le bouton d'ajout après le scroll
                setTimeout(() => {
                  const addButton = document.querySelector('#add-dynamic-pair-button') as HTMLButtonElement;
                  if (addButton) addButton.click();
                }, 300);
              }
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Ajouter une paire
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Première paire d'images côte à côte */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Paire 1</h3>
            <Button
              onClick={() => handleDeletePair(1)}
              disabled={updating || !pair1Enabled}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer la paire 1
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image AVANT */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-destructive">Image AVANT</Label>
            
            <div className="flex items-center justify-center border-2 border-dashed border-border rounded-lg p-4">
              {images.before ? (
                <img 
                  src={images.before} 
                  alt="Image avant actuelle" 
                  className="max-h-48 rounded-lg shadow-lg"
                  onError={(e) => {
                    console.error('Erreur chargement image avant:', images.before);
                    e.currentTarget.src = beforeExample;
                  }}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune image définie
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="before-url">URL de l'image avant</Label>
              <div className="flex gap-2">
                <Input
                  id="before-url"
                  value={beforeUrl}
                  onChange={(e) => setBeforeUrl(e.target.value)}
                  placeholder="https://exemple.com/avant.jpg"
                />
                <Button 
                  onClick={() => handleSaveUrl('before')}
                  disabled={updating}
                  size="sm"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={() => resetToDefault('before')}
                  disabled={updating}
                  variant="outline"
                  size="sm"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                onClick={() => beforeFileRef.current?.click()}
                disabled={hookUploading || updating}
                variant="outline"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload nouveau fichier
              </Button>
              <input
                ref={beforeFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'before');
                }}
              />
            </div>
          </div>

          {/* Image APRÈS */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold text-brand-accent">Image APRÈS</Label>
            
            <div className="flex items-center justify-center border-2 border-dashed border-border rounded-lg p-4">
              {images.after ? (
                <img 
                  src={images.after} 
                  alt="Image après actuelle" 
                  className="max-h-48 rounded-lg shadow-lg"
                  onError={(e) => {
                    console.error('Erreur chargement image après:', images.after);
                    e.currentTarget.src = afterExample;
                  }}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune image définie
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="after-url">URL de l'image après</Label>
              <div className="flex gap-2">
                <Input
                  id="after-url"
                  value={afterUrl}
                  onChange={(e) => setAfterUrl(e.target.value)}
                  placeholder="https://exemple.com/apres.jpg"
                />
                <Button 
                  onClick={() => handleSaveUrl('after')}
                  disabled={updating}
                  size="sm"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={() => resetToDefault('after')}
                  disabled={updating}
                  variant="outline"
                  size="sm"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                onClick={() => afterFileRef.current?.click()}
                disabled={hookUploading || updating}
                variant="outline"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload nouveau fichier
              </Button>
              <input
                ref={afterFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'after');
                }}
              />
            </div>
          </div>
          </div>
        </div>

        {/* Deuxième paire d'images côte à côte */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Paire 2</h3>
            <Button
              onClick={() => handleDeletePair(2)}
              disabled={updating || !pair2Enabled}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer la paire 2
            </Button>
          </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Image AVANT 2 */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold text-destructive">Image AVANT 2</Label>
                <div className="flex items-center justify-center border-2 border-dashed border-border rounded-lg p-4">
                  {images.before2 ? (
                    <img
                      src={images.before2}
                      alt="Image avant 2 actuelle"
                      className="max-h-48 rounded-lg shadow-lg"
                      onError={(e) => {
                        console.error('Erreur chargement image avant 2:', images.before2);
                        e.currentTarget.src = beforeExample;
                      }}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">Aucune image définie</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="before2-url">URL de l'image avant 2</Label>
                  <div className="flex gap-2">
                    <Input id="before2-url" value={before2Url} onChange={(e) => setBefore2Url(e.target.value)} placeholder="https://exemple.com/avant2.jpg" />
                    <Button onClick={() => handleSaveUrl('before2')} disabled={updating} size="sm"><Save className="h-4 w-4" /></Button>
                    <Button onClick={() => resetToDefault('before2')} disabled={updating} variant="outline" size="sm"><RotateCcw className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => before2FileRef.current?.click()} disabled={hookUploading || updating} variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" /> Upload nouveau fichier
                  </Button>
              <input ref={before2FileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, 'before2'); }} />
              </div>
            </div>

            {/* Image APRÈS 2 */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold text-brand-accent">Image APRÈS 2</Label>
                <div className="flex items-center justify-center border-2 border-dashed border-border rounded-lg p-4">
                  {images.after2 ? (
                    <img
                      src={images.after2}
                      alt="Image après 2 actuelle"
                      className="max-h-48 rounded-lg shadow-lg"
                      onError={(e) => {
                        console.error('Erreur chargement image après 2:', images.after2);
                        e.currentTarget.src = afterExample;
                      }}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">Aucune image définie</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="after2-url">URL de l'image après 2</Label>
                  <div className="flex gap-2">
                    <Input id="after2-url" value={after2Url} onChange={(e) => setAfter2Url(e.target.value)} placeholder="https://exemple.com/apres2.jpg" />
                    <Button onClick={() => handleSaveUrl('after2')} disabled={updating} size="sm"><Save className="h-4 w-4" /></Button>
                    <Button onClick={() => resetToDefault('after2')} disabled={updating} variant="outline" size="sm"><RotateCcw className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => after2FileRef.current?.click()} disabled={hookUploading || updating} variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" /> Upload nouveau fichier
                  </Button>
              <input ref={after2FileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file, 'after2'); }} />
            </div>
          </div>
          </div>
        </div>

        {/* Intégration des images dynamiques dans le même format */}
        <div id="dynamic-images-section" className="border-t pt-6">
          <DynamicHomepageImagesManager />
        </div>
        
        {(hookUploading || updating) && (
          <div className="text-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">
              {hookUploading ? 'Upload en cours...' : 'Mise à jour...'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HomepageImagesManager;