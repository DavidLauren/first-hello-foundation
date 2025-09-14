import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminMedia, MediaFile } from '@/hooks/useAdminMedia';
import { Upload, Trash2, Copy, Image, FileText, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MediaManagerProps {
  onSelectFile?: (file: MediaFile) => void;
  selectedFile?: string;
}

const MediaManager = ({ onSelectFile, selectedFile }: MediaManagerProps) => {
  const { mediaFiles, uploading, loading, uploadFile, deleteFile, formatFileSize } = useAdminMedia();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (const file of Array.from(files)) {
        await uploadFile(file);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    for (const file of Array.from(files)) {
      await uploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copiée",
      description: "L'URL de l'image a été copiée dans le presse-papier",
    });
  };

  const isImage = (type: string) => type.startsWith('image/');

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
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
          <Image className="h-5 w-5" />
          Gestionnaire de Médias
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Zone d'upload */}
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragOver 
              ? 'border-brand-primary bg-brand-primary/5' 
              : 'border-gray-300 hover:border-brand-primary/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleFileSelect}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 mx-auto mb-4 border-b-2 border-brand-primary"></div>
              <p className="text-gray-600">Upload en cours...</p>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Glisser-déposer vos fichiers ici</h3>
              <p className="text-gray-600 mb-4">Ou cliquez pour sélectionner des fichiers</p>
              <Button className="bg-gradient-button">
                Choisir des fichiers
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Formats acceptés: Images (JPG, PNG, WEBP), Vidéos • Max: 50MB
              </p>
            </>
          )}
        </div>

        {/* Galerie de fichiers */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center justify-between">
            <span>Fichiers uploadés ({mediaFiles.length})</span>
            {mediaFiles.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Actualiser
              </Button>
            )}
          </h4>
          
          {mediaFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucun fichier uploadé</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto">
              {mediaFiles.map((file) => (
                <div
                  key={file.id}
                  className={`relative group border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                    selectedFile === file.url ? 'ring-2 ring-brand-primary' : ''
                  }`}
                  onClick={() => onSelectFile?.(file)}
                >
                  {/* Aperçu du fichier */}
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {isImage(file.type) ? (
                      <img 
                        src={file.url} 
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="h-8 w-8 text-gray-400" />
                    )}
                  </div>

                  {/* Overlay avec actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(file.url, '_blank');
                      }}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(file.url);
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFile(file.name);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Informations du fichier */}
                  <div className="p-2 bg-white">
                    <p className="text-xs font-medium truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MediaManager;