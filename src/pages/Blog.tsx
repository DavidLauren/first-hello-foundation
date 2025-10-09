import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  image_url: string | null;
  before_image_url: string | null;
  after_image_url: string | null;
  video_url: string | null;
  created_at: string;
}

// Fonction pour convertir les URLs YouTube/Vimeo en format embed
const getEmbedUrl = (url: string): string | null => {
  // YouTube
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  // Vimeo
  const vimeoRegex = /vimeo\.com\/(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // Si c'est déjà une URL de vidéo uploadée ou autre format
  if (url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg')) {
    return url;
  }

  return null;
};

const Blog = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BlogPost[];
    },
  });

  return (
    <Layout>
      <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
            Blog
          </h1>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto"></div>
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="space-y-8">
              {posts.map((post) => {
                const embedUrl = post.video_url ? getEmbedUrl(post.video_url) : null;
                const isVideoFile = embedUrl?.includes('.mp4') || embedUrl?.includes('.webm') || embedUrl?.includes('.ogg');

                return (
                  <Card key={post.id} className="hover:shadow-elegant transition-all duration-300">
                    {post.image_url && (
                      <div className="w-full rounded-t-lg overflow-hidden">
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-full h-auto object-contain rounded-lg"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-2xl">{post.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString("fr-FR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </CardHeader>
                    <CardContent>
                      {post.excerpt && (
                        <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                      )}
                      
                      {/* Affichage vidéo */}
                      {embedUrl && (
                        <div className="my-6">
                          {isVideoFile ? (
                            <video
                              controls
                              className="w-full rounded-lg"
                              style={{ maxHeight: '500px' }}
                            >
                              <source src={embedUrl} type="video/mp4" />
                              Votre navigateur ne supporte pas la lecture de vidéos.
                            </video>
                          ) : (
                            <div className="aspect-video">
                              <iframe
                                src={embedUrl}
                                className="w-full h-full rounded-lg"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title="Vidéo"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Affichage avant/après si les deux images sont présentes */}
                      {post.before_image_url && post.after_image_url && (
                        <div className="my-6">
                          <h3 className="text-lg font-semibold mb-3">Exemple Avant/Après</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-2 font-medium">Avant</p>
                              <div className="rounded-lg overflow-hidden border">
                                <img
                                  src={post.before_image_url}
                                  alt="Avant"
                                  className="w-full h-auto object-contain"
                                />
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground mb-2 font-medium">Après</p>
                              <div className="rounded-lg overflow-hidden border">
                                <img
                                  src={post.after_image_url}
                                  alt="Après"
                                  className="w-full h-auto object-contain"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="prose prose-lg max-w-none">
                        <p className="whitespace-pre-wrap">{post.content}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="hover:shadow-elegant transition-all duration-300">
              <CardHeader>
                <CardTitle>Aucun article pour le moment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Les articles de blog seront bientôt disponibles.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Blog;