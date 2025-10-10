import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Euro } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  display_order: number;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageEnabled, setPageEnabled] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkPageStatus();
    fetchProducts();
  }, []);

  const checkPageStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'products_page_enabled')
        .maybeSingle();

      if (error) throw error;
      setPageEnabled(data?.setting_value === 'true');
    } catch (error) {
      console.error('Error checking page status:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      </Layout>
    );
  }

  if (!pageEnabled) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Page non disponible</h1>
            <p className="text-muted-foreground">Cette page est actuellement désactivée.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="min-h-screen py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
              Nos Produits
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Découvrez notre sélection de produits et services
            </p>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucun produit disponible pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-brand-primary/50">
                  <CardContent className="p-0">
                    {product.image_url && (
                      <div className="relative h-48 overflow-hidden bg-muted">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
                      {product.description && (
                        <p className="text-muted-foreground mb-4 line-clamp-3">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <Badge className="bg-gradient-button text-white text-lg px-4 py-2">
                          <Euro className="h-4 w-4 mr-1" />
                          {(product.price / 100).toFixed(2)} €
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};

export default Products;
