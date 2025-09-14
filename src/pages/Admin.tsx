import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Save, X, Image, Grid, List, Gift, Euro, Users, Package, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MediaManager from "@/components/MediaManager";
import PromoCodeManager from "@/components/PromoCodeManager";
import PriceManager from "@/components/PriceManager";
import ClientManager from "@/components/ClientManager";
import AdminDeferredBillingSummary from "@/components/AdminDeferredBillingSummary";
import DeferredInvoicesViewer from "@/components/DeferredInvoicesViewer";
import ImmediateInvoicesViewer from "@/components/ImmediateInvoicesViewer";
import CompanyInfoManager from "@/components/CompanyInfoManager";
import ReferralManager from "@/components/ReferralManager";
import OrderManager from "@/components/OrderManager";
import HomepageImagesManager from "@/components/HomepageImagesManager";
import TrashManager from "@/components/TrashManager";
import { MediaFile } from "@/hooks/useAdminMedia";
import { useExamples, Example } from "@/hooks/useExamples";
import { SortableExamplesGrid } from "@/components/SortableExamplesGrid";

const AdminPage = () => {
  const { user } = useAuth();
  const { isAdmin, loading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { examples, loading: examplesLoading, saveExample, deleteExample, reorderExamples } = useExamples();
  const [editingExample, setEditingExample] = useState<Example | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'examples' | 'media' | 'promo' | 'pricing' | 'clients' | 'billing' | 'info-entreprise' | 'referral' | 'homepage' | 'trash'>('orders');
  const [billingSubTab, setBillingSubTab] = useState<'overview' | 'invoices' | 'info'>('overview');

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions d'administrateur",
        variant: "destructive",
      });
    }
  }, [isAdmin, loading, navigate, toast]);

  const handleSave = (example: Example) => {
    saveExample(example);
    
    if (isCreating) {
      setIsCreating(false);
      toast({
        title: "Exemple créé",
        description: "Le nouvel exemple a été ajouté avec succès",
      });
    } else {
      toast({
        title: "Exemple modifié",
        description: "L'exemple a été mis à jour avec succès",
      });
    }
    setEditingExample(null);
  };

  const handleDelete = (id: string) => {
    deleteExample(id);
    toast({
      title: "Exemple supprimé",
      description: "L'exemple a été supprimé avec succès",
    });
  };

  const handleCreate = () => {
    const newExample: Example = {
      id: "",
      title: "",
      description: "",
      category: "",
      beforeImage: "",
      afterImage: "",
      order: 0
    };
    setEditingExample(newExample);
    setIsCreating(true);
  };

  if (loading || examplesLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🛠️ Panneau d'Administration
            </h1>
            <p className="text-gray-600">
              Gérez les exemples et médias affichés sur votre site
            </p>
          </div>

          {/* Onglets */}
          <div className="mb-8">
            <div className="flex gap-4 border-b">
              <button
                className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'orders' 
                    ? 'text-brand-primary border-b-2 border-brand-primary' 
                    : 'text-gray-600 hover:text-brand-primary'
                }`}
                onClick={() => setActiveTab('orders')}
              >
                <Package className="h-4 w-4" />
                Commandes
              </button>
              <button
                className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'examples' 
                    ? 'text-brand-primary border-b-2 border-brand-primary' 
                    : 'text-gray-600 hover:text-brand-primary'
                }`}
                onClick={() => setActiveTab('examples')}
              >
                <Grid className="h-4 w-4" />
                Exemples ({examples.length})
              </button>
              <button
                className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'media' 
                    ? 'text-brand-primary border-b-2 border-brand-primary' 
                    : 'text-gray-600 hover:text-brand-primary'
                }`}
                onClick={() => setActiveTab('media')}
              >
                <Image className="h-4 w-4" />
                Médias
              </button>
              <button
                className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'promo' 
                    ? 'text-brand-primary border-b-2 border-brand-primary' 
                    : 'text-gray-600 hover:text-brand-primary'
                }`}
                onClick={() => setActiveTab('promo')}
              >
                <Gift className="h-4 w-4" />
                Codes Promo
              </button>
              <button
                className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'pricing' 
                    ? 'text-brand-primary border-b-2 border-brand-primary' 
                    : 'text-gray-600 hover:text-brand-primary'
                }`}
                onClick={() => setActiveTab('pricing')}
              >
                <Euro className="h-4 w-4" />
                Prix
              </button>
              <button
                className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'clients' 
                    ? 'text-brand-primary border-b-2 border-brand-primary' 
                    : 'text-gray-600 hover:text-brand-primary'
                }`}
                onClick={() => setActiveTab('clients')}
              >
                <Users className="h-4 w-4" />
                Clients
              </button>
              <button
                className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'billing' 
                    ? 'text-brand-primary border-b-2 border-brand-primary' 
                    : 'text-gray-600 hover:text-brand-primary'
                }`}
                onClick={() => setActiveTab('billing')}
              >
                <Euro className="h-4 w-4" />
                Facturation
              </button>
              <button
                className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'info-entreprise' 
                    ? 'text-brand-primary border-b-2 border-brand-primary' 
                    : 'text-gray-600 hover:text-brand-primary'
                }`}
                onClick={() => setActiveTab('info-entreprise')}
              >
                <Users className="h-4 w-4" />
                Info Entreprise
              </button>
              <button
                className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'referral' 
                    ? 'text-brand-primary border-b-2 border-brand-primary' 
                    : 'text-gray-600 hover:text-brand-primary'
                }`}
                onClick={() => setActiveTab('referral')}
              >
                <Gift className="h-4 w-4" />
                Parrainage
              </button>
              <button
                className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'homepage' 
                    ? 'text-brand-primary border-b-2 border-brand-primary' 
                    : 'text-gray-600 hover:text-brand-primary'
                }`}
                onClick={() => setActiveTab('homepage')}
              >
                <Image className="h-4 w-4" />
                Page d'accueil
              </button>
              <button
                className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'trash' 
                    ? 'text-brand-primary border-b-2 border-brand-primary' 
                    : 'text-gray-600 hover:text-brand-primary'
                }`}
                onClick={() => setActiveTab('trash')}
              >
                <Archive className="h-4 w-4" />
                Corbeille
              </button>
            </div>
          </div>

          {/* Contenu des onglets */}
          {activeTab === 'orders' ? (
            <OrderManager />
          ) : activeTab === 'examples' ? (
            <>
              <div className="mb-6">
                <Button 
                  onClick={handleCreate}
                  className="bg-gradient-button hover:scale-105 transform transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un exemple
                </Button>
              </div>

              <SortableExamplesGrid
                examples={examples}
                onEdit={setEditingExample}
                onDelete={handleDelete}
                onReorder={reorderExamples}
              />
            </>
          ) : activeTab === 'media' ? (
            <MediaManager />
          ) : activeTab === 'promo' ? (
            <PromoCodeManager />
          ) : activeTab === 'pricing' ? (
            <PriceManager />
          ) : activeTab === 'clients' ? (
            <ClientManager />
          ) : activeTab === 'info-entreprise' ? (
            <CompanyInfoManager />
          ) : activeTab === 'referral' ? (
            <ReferralManager />
          ) : activeTab === 'homepage' ? (
            <HomepageImagesManager />
          ) : activeTab === 'trash' ? (
            <TrashManager />
          ) : (
            <div className="space-y-8">
              <AdminDeferredBillingSummary />
              <ImmediateInvoicesViewer />
              <DeferredInvoicesViewer />
            </div>
          )}
        </div>

        {/* Modal d'édition */}
        {editingExample && (
          <ExampleEditModal
            example={editingExample}
            isCreating={isCreating}
            onSave={handleSave}
            onCancel={() => {
              setEditingExample(null);
              setIsCreating(false);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

interface ExampleCardProps {
  example: Example;
  onEdit: () => void;
  onDelete: () => void;
}

const ExampleCard = ({ example, onEdit, onDelete }: ExampleCardProps) => (
  <Card className="hover:shadow-elegant transition-all duration-300">
    <CardHeader>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-lg">{example.title}</CardTitle>
          <span className="text-sm bg-brand-primary/10 text-brand-primary px-2 py-1 rounded-full">
            {example.category}
          </span>
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
    </CardHeader>
    <CardContent>
      <p className="text-gray-600 mb-4">{example.description}</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Image Avant</Label>
          <div className="h-20 bg-gray-100 rounded border overflow-hidden">
            {example.beforeImage ? (
              <img 
                src={example.beforeImage} 
                alt="Image avant" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<div class="h-full flex items-center justify-center text-xs text-gray-500">Image introuvable</div>';
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-500">
                Aucune image
              </div>
            )}
          </div>
        </div>
        <div>
          <Label className="text-xs">Image Après</Label>
          <div className="h-20 bg-gray-100 rounded border overflow-hidden">
            {example.afterImage ? (
              <img 
                src={example.afterImage} 
                alt="Image après" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<div class="h-full flex items-center justify-center text-xs text-gray-500">Image introuvable</div>';
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-500">
                Aucune image
              </div>
            )}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

interface ExampleEditModalProps {
  example: Example;
  isCreating: boolean;
  onSave: (example: Example) => void;
  onCancel: () => void;
}

const ExampleEditModal = ({ example, isCreating, onSave, onCancel }: ExampleEditModalProps) => {
  const [formData, setFormData] = useState(example);
  const [showMediaPicker, setShowMediaPicker] = useState<'before' | 'after' | null>(null);

  const handleMediaSelect = (file: MediaFile, type: 'before' | 'after') => {
    if (type === 'before') {
      setFormData({...formData, beforeImage: file.url});
    } else {
      setFormData({...formData, afterImage: file.url});
    }
    setShowMediaPicker(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {isCreating ? "Créer un exemple" : "Modifier l'exemple"}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="beforeImage">Image Avant</Label>
                <div className="flex gap-2">
                  <Input
                    id="beforeImage"
                    type="url"
                    value={formData.beforeImage}
                    onChange={(e) => setFormData({...formData, beforeImage: e.target.value})}
                    placeholder="https://exemple.com/avant.jpg"
                  />
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setShowMediaPicker('before')}
                  >
                    📁 Choisir
                  </Button>
                </div>
                {formData.beforeImage && (
                  <div className="mt-2">
                    <img src={formData.beforeImage} alt="Aperçu avant" className="w-20 h-20 object-cover rounded border" />
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="afterImage">Image Après</Label>
                <div className="flex gap-2">
                  <Input
                    id="afterImage"
                    type="url"
                    value={formData.afterImage}
                    onChange={(e) => setFormData({...formData, afterImage: e.target.value})}
                    placeholder="https://exemple.com/apres.jpg"
                  />
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setShowMediaPicker('after')}
                  >
                    📁 Choisir
                  </Button>
                </div>
                {formData.afterImage && (
                  <div className="mt-2">
                    <img src={formData.afterImage} alt="Aperçu après" className="w-20 h-20 object-cover rounded border" />
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit"
                  className="bg-gradient-button hover:scale-105 transform transition-all duration-300"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isCreating ? "Créer" : "Sauvegarder"}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Modal de sélection de média */}
      {showMediaPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  Choisir une image {showMediaPicker === 'before' ? 'avant' : 'après'}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowMediaPicker(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <MediaManager 
                onSelectFile={(file) => handleMediaSelect(file, showMediaPicker)}
                selectedFile={showMediaPicker === 'before' ? formData.beforeImage : formData.afterImage}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default AdminPage;