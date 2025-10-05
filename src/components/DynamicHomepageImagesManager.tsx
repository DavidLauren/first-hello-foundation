import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useHomepageImagePairs, HomepageImagePair } from "@/hooks/useHomepageImagePairs";
import { useState, useRef } from "react";
import { Plus, Upload, Save, Edit, Trash2, X, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DynamicHomepageImagesManager = () => {
  const { imagePairs, loading, uploading, uploadImage, addImagePair, updateImagePair, deleteImagePair, reorderImagePairs } = useHomepageImagePairs();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    before_image_url: '',
    after_image_url: ''
  });
  const beforeFileRef = useRef<HTMLInputElement>(null);
  const afterFileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = imagePairs.findIndex((item) => item.id === active.id);
      const newIndex = imagePairs.findIndex((item) => item.id === over.id);

      const newOrder = arrayMove(imagePairs, oldIndex, newIndex);
      reorderImagePairs(newOrder);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      before_image_url: '',
      after_image_url: ''
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleEdit = (pair: HomepageImagePair) => {
    setFormData({
      title: pair.title,
      description: pair.description,
      before_image_url: pair.before_image_url,
      after_image_url: pair.after_image_url
    });
    setEditingId(pair.id);
  };

  const handleFileUpload = async (file: File, type: 'before' | 'after') => {
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

    const url = await uploadImage(file, type);
    if (url) {
      setFormData(prev => ({
        ...prev,
        [type === 'before' ? 'before_image_url' : 'after_image_url']: url
      }));
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.before_image_url || !formData.after_image_url) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (editingId) {
      await updateImagePair(editingId, formData);
    } else {
      await addImagePair({
        ...formData,
        display_order: imagePairs.length + 1,
        is_active: true
      });
    }
    resetForm();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestion des images avant/après</CardTitle>
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des images avant/après</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ajoutez autant de paires d'images avant/après que vous souhaitez pour la page d'accueil
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Button 
              id="add-dynamic-pair-button"
              onClick={() => setIsCreating(true)}
              disabled={isCreating || editingId !== null}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Ajouter une paire d'images
            </Button>
          </div>

          {/* Formulaire de création/édition */}
          {(isCreating || editingId) && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    {editingId ? "Modifier la paire d'images" : "Nouvelle paire d'images"}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Titre de l'exemple"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Description de l'exemple"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Image AVANT */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-destructive">Image AVANT *</Label>
                    <Input
                      value={formData.before_image_url}
                      onChange={(e) => setFormData({...formData, before_image_url: e.target.value})}
                      placeholder="URL de l'image avant"
                    />
                    <Button 
                      onClick={() => beforeFileRef.current?.click()}
                      disabled={uploading}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload image avant
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
                    {formData.before_image_url && (
                      <img 
                        src={formData.before_image_url} 
                        alt="Aperçu avant" 
                        className="w-full h-32 object-cover rounded border"
                      />
                    )}
                  </div>

                  {/* Image APRÈS */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-brand-accent">Image APRÈS *</Label>
                    <Input
                      value={formData.after_image_url}
                      onChange={(e) => setFormData({...formData, after_image_url: e.target.value})}
                      placeholder="URL de l'image après"
                    />
                    <Button 
                      onClick={() => afterFileRef.current?.click()}
                      disabled={uploading}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload image après
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
                    {formData.after_image_url && (
                      <img 
                        src={formData.after_image_url} 
                        alt="Aperçu après" 
                        className="w-full h-32 object-cover rounded border"
                      />
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={uploading}>
                    <Save className="h-4 w-4 mr-2" />
                    {editingId ? "Mettre à jour" : "Ajouter"}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Liste des paires d'images */}
          {imagePairs.length > 0 ? (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={imagePairs.map(p => p.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {imagePairs.map((pair) => (
                    <SortableImagePairCard
                      key={pair.id}
                      pair={pair}
                      onEdit={() => handleEdit(pair)}
                      onDelete={() => deleteImagePair(pair.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucune paire d'images définie. Ajoutez-en une pour commencer.
            </div>
          )}

          {uploading && (
            <div className="text-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Upload en cours...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface SortableImagePairCardProps {
  pair: HomepageImagePair;
  onEdit: () => void;
  onDelete: () => void;
}

const SortableImagePairCard = ({ pair, onEdit, onDelete }: SortableImagePairCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: pair.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div
            className="flex items-center cursor-move"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold">{pair.title}</h3>
                {pair.description && (
                  <p className="text-sm text-muted-foreground">{pair.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={onEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-destructive">AVANT</Label>
                <img 
                  src={pair.before_image_url} 
                  alt="Image avant" 
                  className="w-full h-24 object-cover rounded border"
                />
              </div>
              <div>
                <Label className="text-xs text-brand-accent">APRÈS</Label>
                <img 
                  src={pair.after_image_url} 
                  alt="Image après" 
                  className="w-full h-24 object-cover rounded border"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DynamicHomepageImagesManager;