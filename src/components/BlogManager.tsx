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
import { Trash2, Edit, Plus, X } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  published: boolean;
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
    published: false,
  });

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
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
    setFormData({ title: "", excerpt: "", content: "", published: false });
    setIsEditing(false);
    setEditingPost(null);
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      excerpt: post.excerpt || "",
      content: post.content,
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
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-muted-foreground">Chargement...</p>
            ) : posts && posts.length > 0 ? (
              posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{post.title}</h3>
                        {post.excerpt && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
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
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(post)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground">Aucun article pour le moment</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BlogManager;
