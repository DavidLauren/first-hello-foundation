import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, RefreshCw, RotateCcw, Download, Eye, FileText, Package, AlertTriangle, CheckSquare, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface TrashedItem {
  id: string;
  type: 'order' | 'media' | 'file';
  name: string;
  original_name?: string;
  deleted_at: string;
  deleted_by?: string;
  size?: number;
  path?: string;
  user_email?: string;
  order_number?: string;
  total_amount?: number;
  metadata?: any;
}

const TrashManager = () => {
  const [trashedItems, setTrashedItems] = useState<TrashedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'orders' | 'media' | 'files'>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const loadTrashedItems = async () => {
    setLoading(true);
    try {
      const items: TrashedItem[] = [];

      // Charger les factures archivées comme éléments de la corbeille
      const { data: archivedInvoices } = await supabase
        .from('deferred_invoices')
        .select('*')
        .not('archived_at', 'is', null);

      if (archivedInvoices) {
        for (const invoice of archivedInvoices) {
          // Récupérer le profil utilisateur
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, contact_name')
            .eq('id', invoice.user_id)
            .single();

          items.push({
            id: invoice.id,
            type: 'order',
            name: invoice.invoice_number,
            deleted_at: invoice.archived_at,
            user_email: profile?.email || 'Email inconnu',
            order_number: invoice.invoice_number,
            total_amount: invoice.total_amount / 100
          });
        }
      }

      // Trier par date de suppression (plus récent en premier)
      items.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());

      setTrashedItems(items);
    } catch (error) {
      console.error('Error loading trashed items:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les éléments de la corbeille",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrashedItems();
  }, []);

  const getFilteredItems = () => {
    if (selectedCategory === 'all') return trashedItems;
    return trashedItems.filter(item => {
      switch (selectedCategory) {
        case 'orders': return item.type === 'order';
        case 'media': return item.type === 'media';
        case 'files': return item.type === 'file';
        default: return true;
      }
    });
  };

  const handleRestore = async (item: TrashedItem) => {
    try {
      if (item.type === 'order') {
        // Restaurer une facture (enlever l'archive)
        const { error } = await supabase
          .from('deferred_invoices')
          .update({ archived_at: null })
          .eq('id', item.id);

        if (error) throw error;

        toast({
          title: "Facture restaurée",
          description: `La facture ${item.name} a été restaurée`,
        });
      }

      loadTrashedItems();
    } catch (error) {
      console.error('Error restoring item:', error);
      toast({
        title: "Erreur",
        description: "Impossible de restaurer cet élément",
        variant: "destructive",
      });
    }
  };

  const handlePermanentDelete = async (item: TrashedItem) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement "${item.name}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      if (item.type === 'order') {
        // Supprimer définitivement la facture
        const { error } = await supabase
          .from('deferred_invoices')
          .delete()
          .eq('id', item.id);

        if (error) throw error;

        toast({
          title: "Suppression définitive",
          description: `${item.name} a été supprimé définitivement`,
        });
      }

      loadTrashedItems();
    } catch (error) {
      console.error('Error permanently deleting item:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer définitivement cet élément",
        variant: "destructive",
      });
    }
  };

  const handleSelectAll = () => {
    const filteredItems = getFilteredItems();
    if (selectedItems.size === filteredItems.length) {
      // Tout désélectionner
      setSelectedItems(new Set());
    } else {
      // Tout sélectionner
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement les ${selectedItems.size} éléments sélectionnés ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const selectedItemsList = Array.from(selectedItems);
      
      // Supprimer les factures sélectionnées
      await supabase
        .from('deferred_invoices')
        .delete()
        .in('id', selectedItemsList);

      toast({
        title: "Suppression réussie",
        description: `${selectedItems.size} éléments ont été supprimés définitivement`,
      });

      setSelectedItems(new Set());
      loadTrashedItems();
    } catch (error) {
      console.error('Error deleting selected items:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les éléments sélectionnés",
        variant: "destructive",
      });
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm("Êtes-vous sûr de vouloir vider entièrement la corbeille ? Cette action est irréversible.")) {
      return;
    }

    try {
      // Supprimer toutes les factures archivées
      await supabase
        .from('deferred_invoices')
        .delete()
        .not('archived_at', 'is', null);

      toast({
        title: "Corbeille vidée",
        description: "Tous les éléments de la corbeille ont été supprimés définitivement",
      });

      setSelectedItems(new Set());
      loadTrashedItems();
    } catch (error) {
      console.error('Error emptying trash:', error);
      toast({
        title: "Erreur",
        description: "Impossible de vider la corbeille",
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order': return <Package className="h-4 w-4" />;
      case 'media': return <FileText className="h-4 w-4" />;
      case 'file': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'order': return 'Commande';
      case 'media': return 'Média';
      case 'file': return 'Fichier';
      default: return type;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'order': return 'bg-blue-100 text-blue-800';
      case 'media': return 'bg-green-100 text-green-800';
      case 'file': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredItems = getFilteredItems();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Corbeille
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="bg-gray-200 h-6 rounded"></div>
            <div className="bg-gray-200 h-6 rounded"></div>
            <div className="bg-gray-200 h-6 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Corbeille ({filteredItems.length} éléments)
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              Tout
            </Button>
            <Button
              variant={selectedCategory === 'orders' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('orders')}
            >
              Commandes
            </Button>
            <Button
              variant={selectedCategory === 'media' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('media')}
            >
              Médias
            </Button>
            <Button
              variant={selectedCategory === 'files' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('files')}
            >
              Fichiers
            </Button>
            {trashedItems.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEmptyTrash}
              >
                Vider la corbeille
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadTrashedItems}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>
              {selectedCategory === 'all' 
                ? "La corbeille est vide" 
                : `Aucun ${selectedCategory.slice(0, -1)} dans la corbeille`
              }
            </p>
            <p className="text-sm mt-2">
              Les éléments supprimés apparaîtront ici et pourront être restaurés
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Attention</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Les éléments dans la corbeille peuvent être restaurés ou supprimés définitivement. 
                La suppression définitive est irréversible.
              </p>
            </div>

            {/* Actions de sélection multiple */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">
                  {selectedItems.size === filteredItems.length && filteredItems.length > 0
                    ? `Tout désélectionner (${filteredItems.length})`
                    : `Tout sélectionner (${filteredItems.length})`
                  }
                </span>
                {selectedItems.size > 0 && (
                  <span className="text-sm text-gray-600">
                    {selectedItems.size} élément{selectedItems.size > 1 ? 's' : ''} sélectionné{selectedItems.size > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {selectedItems.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer sélectionnés ({selectedItems.size})
                </Button>
              )}
            </div>

            {filteredItems.map((item) => (
              <div key={`${item.type}-${item.id}`} className="border rounded-lg p-4 bg-red-50 border-red-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={() => handleSelectItem(item.id)}
                    />
                    <div className="p-2 bg-red-100 rounded-lg">
                      {getTypeIcon(item.type)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        {item.name}
                        <Badge className={getTypeBadgeColor(item.type)}>
                          {getTypeLabel(item.type)}
                        </Badge>
                      </h4>
                      {item.user_email && (
                        <p className="text-sm text-gray-600">
                          Client : {item.user_email}
                        </p>
                      )}
                      {item.total_amount && (
                        <p className="text-sm text-gray-600">
                          Montant : {item.total_amount.toFixed(2)}€
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    Supprimé le {new Date(item.deleted_at).toLocaleDateString('fr-FR')} 
                    à {new Date(item.deleted_at).toLocaleTimeString('fr-FR')}
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRestore(item)}
                    className="text-green-600 border-green-300 hover:bg-green-50"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Restaurer
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handlePermanentDelete(item)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer définitivement
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrashManager;