import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Blog = () => {
  return (
    <Layout>
      <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
            Blog
          </h1>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-elegant transition-all duration-300">
              <CardHeader>
                <CardTitle>Article à venir</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Les articles de blog seront bientôt disponibles.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Blog;
