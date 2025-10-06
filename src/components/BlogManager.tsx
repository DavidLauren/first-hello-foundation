import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Plus, X, Upload, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  image_url: string | null;
  published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const BlogManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    image_url: "",
    published: false,
  });
  const [uploading, setUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("blog_posts").insert([
        {
          ...data,
          author_id: (await supabase.auth.getUser()).data.user?.id,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts-admin"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast({ title: "Article créé avec succès" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: typeof formData;
    }) => {
      const { error } = await supabase
        .from("blog_posts")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts-admin"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast({ title: "Article mis à jour" });
      resetForm();
    },
    onError: () => {
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts-admin"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast({ title: "Article supprimé" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ title: "", excerpt: "", content: "", image_url: "", published: false });
    setIsEditing(false);
    setEditingPost(null);
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      excerpt: post.excerpt || "",
      content: post.content,
      image_url: post.image_url || "",
      published: post.published,
    });
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `blog/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("admin-media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("admin-media")
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast({ title: "Image uploadée avec succès" });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({ title: "Erreur lors de l'upload", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !posts) return;

    const oldIndex = posts.findIndex((p) => p.id === active.id);
    const newIndex = posts.findIndex((p) => p.id === over.id);

    const newPosts = arrayMove(posts, oldIndex, newIndex);

    // Mise à jour optimiste
    queryClient.setQueryData(["blog-posts-admin"], newPosts);

    // Mise à jour de l'ordre dans la base de données
    try {
      const updates = newPosts.map((post, index) => ({
        id: post.id,
        display_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from("blog_posts")
          .update({ display_order: update.display_order })
          .eq("id", update.id);
      }

      queryClient.invalidateQueries({ queryKey: ["blog-posts-admin"] });
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast({ title: "Ordre mis à jour" });
    } catch (error) {
      console.error("Error updating order:", error);
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["blog-posts-admin"] });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Gestion du Blog
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nouvel article
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="excerpt">Extrait (optionnel)</Label>
              <Textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) =>
                  setFormData({ ...formData, excerpt: e.target.value })
                }
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="image">Image (optionnel)</Label>
              <div className="space-y-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {formData.image_url && (
                  <div className="relative w-32 h-32">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover rounded border"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2"
                      onClick={() => setFormData({ ...formData, image_url: "" })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="content">Contenu</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={10}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={formData.published}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, published: checked })
                }
              />
              <Label htmlFor="published">Publier immédiatement</Label>
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                {editingPost ? "Mettre à jour" : "Créer"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
            </div>
          </form>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-4">
              {isLoading ? (
                <p className="text-muted-foreground">Chargement...</p>
              ) : posts && posts.length > 0 ? (
                <SortableContext
                  items={posts.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {posts.map((post) => (
                    <SortableBlogPost
                      key={post.id}
                      post={post}
                      onEdit={() => handleEdit(post)}
                      onDelete={() => deleteMutation.mutate(post.id)}
                    />
                  ))}
                </SortableContext>
              ) : (
                <p className="text-muted-foreground">Aucun article pour le moment</p>
              )}
            </div>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
};

interface SortableBlogPostProps {
  post: BlogPost;
  onEdit: () => void;
  onDelete: () => void;
}

const SortableBlogPost = ({ post, onEdit, onDelete }: SortableBlogPostProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <button
            className="cursor-move mt-1 text-muted-foreground hover:text-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>
          
          {post.image_url && (
            <img
              src={post.image_url}
              alt={post.title}
              className="w-20 h-20 object-cover rounded"
            />
          )}

          <div className="flex-1">
            <h3 className="font-semibold text-lg">{post.title}</h3>
            {post.excerpt && (
              <p className="text-sm text-muted-foreground mt-1">
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
              <span
                className={
                  post.published
                    ? "text-green-600 font-medium"
                    : "text-orange-600 font-medium"
                }
              >
                {post.published ? "Publié" : "Brouillon"}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BlogManager;
