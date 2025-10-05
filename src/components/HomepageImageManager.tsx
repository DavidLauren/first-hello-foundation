import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Save, Image as ImageIcon } from "lucide-react";
import { useHomepageImages } from "@/hooks/useHomepageImages";

const HomepageImageManager = () => {
  const { images, loading, uploading, uploadImage, updateImage } = useHomepageImages();
  const [tempUrls, setTempUrls] = useState({ before: '', after: '' });

  const handleFileUpload = async (file: File, type: 'before' | 'after') => {
    const url = await uploadImage(file, type);
    if (url) {
      await updateImage(type, url);
    }
  };

  const handleUrlUpdate = async (type: 'before' | 'after') => {
    const url = tempUrls[type];
    if (url.trim()) {
      await updateImage(type, url.trim());
      setTempUrls(prev => ({ ...prev, [type]: '' }));
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file, type);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Images de la page d'accueil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image AVANT */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold">Image "AVANT"</Label>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-brand-primary transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'before')}
                  className="hidden"
                  id="before-upload"
                  disabled={uploading}
                />
                <label htmlFor="before-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {uploading ? 'Upload en cours...' : 'Cliquez pour uploader une nouvelle image'}
                  </p>
                </label>
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Ou entrez une URL..."
                  value={tempUrls.before}
                  onChange={(e) => setTempUrls(prev => ({ ...prev, before: e.target.value }))}
                />
                <Button 
                  size="sm" 
                  onClick={() => handleUrlUpdate('before')}
                  disabled={!tempUrls.before.trim() || uploading}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Aperçu actuel:</p>
              <div className="border rounded-lg overflow-hidden">
                <img 
                  src={images.before} 
                  alt="Image avant actuelle" 
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Image APRÈS */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold">Image "APRÈS"</Label>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-brand-primary transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'after')}
                  className="hidden"
                  id="after-upload"
                  disabled={uploading}
                />
                <label htmlFor="after-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {uploading ? 'Upload en cours...' : 'Cliquez pour uploader une nouvelle image'}
                  </p>
                </label>
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Ou entrez une URL..."
                  value={tempUrls.after}
                  onChange={(e) => setTempUrls(prev => ({ ...prev, after: e.target.value }))}
                />
                <Button 
                  size="sm" 
                  onClick={() => handleUrlUpdate('after')}
                  disabled={!tempUrls.after.trim() || uploading}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Aperçu actuel:</p>
              <div className="border rounded-lg overflow-hidden">
                <img 
                  src={images.after} 
                  alt="Image après actuelle" 
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 <strong>Conseil:</strong> Pour de meilleurs résultats sur mobile, utilisez des images au format 16:9 ou carré avec une résolution d'au moins 800x600px.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default HomepageImageManager;