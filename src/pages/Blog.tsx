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
  created_at: string;
}

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
              {posts.map((post) => (
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
                    <div className="prose prose-lg max-w-none">
                      <p className="whitespace-pre-wrap">{post.content}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
