import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileImage, Calendar, Eye, Package, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface UserOrder {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  instructions: string;
  created_at: string;
  delivered_at?: string;
  order_files: Array<{
    id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    is_original: boolean;
  }>;
  delivered_files: Array<{
    id: string;
    file_name: string;
    file_path: string;
    file_size: number;
  }>;
}

const UserOrdersViewer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<UserOrder | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);

  // Récupérer les commandes de l'utilisateur
  const { data: orders, isLoading } = useQuery({
    queryKey: ['user-orders'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_files(*),
          delivered_files(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserOrder[];
    },
    enabled: !!user
  });

  const getStatusBadge = (status: string, delivered_at?: string) => {
    if (delivered_at) {
      return <Badge className="bg-green-100 text-green-800">✅ Livré</Badge>;
    }
    
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">⏳ En attente de paiement</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">🎨 En cours de traitement</Badge>;
      case 'delivered':
        return <Badge className="bg-green-100 text-green-800">✅ Livré</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getImagePreviewUrl = (filePath: string, bucket: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const isImage = (fileName: string) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'];
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension && imageExtensions.includes(extension);
  };

  const downloadFinalFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('final-photos')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Téléchargement réussi",
        description: `${fileName} a été téléchargé`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
        variant: "destructive",
      });
    }
  };

  const downloadAllFiles = async (order: UserOrder) => {
    if (order.delivered_files.length === 0) return;
    
    for (const file of order.delivered_files) {
      await downloadFinalFile(file.file_path, file.file_name);
      // Petit délai entre les téléchargements
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const deleteOrder = async (order: UserOrder) => {
    // Demander confirmation
    const isDelivered = order.delivered_at || order.delivered_files.length > 0;
    const confirmMessage = isDelivered 
      ? `Êtes-vous sûr de vouloir supprimer la commande ${order.order_number} ?\n\nCette commande a été livrée. Cette action est irréversible et supprimera également tous les fichiers associés.`
      : `Êtes-vous sûr de vouloir supprimer la commande ${order.order_number} ?\n\nCette action est irréversible et supprimera également tous les fichiers associés.`;

    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) return;

    setDeletingOrder(order.id);

    try {
      // Supprimer les fichiers du storage d'abord (originaux)
      if (order.order_files.length > 0) {
        const filesToDelete = order.order_files.map(file => file.file_path);
        const { error: storageError } = await supabase.storage
          .from('photo-uploads')
          .remove(filesToDelete);

        if (storageError) {
          console.error('Error deleting files from storage:', storageError);
        }
      }

      // Supprimer les fichiers livrés du storage
      if (order.delivered_files.length > 0) {
        const deliveredFilesToDelete = order.delivered_files.map(file => file.file_path);
        const { error: deliveredStorageError } = await supabase.storage
          .from('final-photos')
          .remove(deliveredFilesToDelete);

        if (deliveredStorageError) {
          console.error('Error deleting delivered files from storage:', deliveredStorageError);
        }
      }

      // Supprimer la commande (les fichiers liés seront supprimés par CASCADE)
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', order.id);

      if (deleteError) {
        throw new Error("Impossible de supprimer la commande");
      }

      toast({
        title: "Commande supprimée",
        description: `La commande ${order.order_number} a été supprimée avec succès`,
      });

      // Refresh des données
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });

    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    } finally {
      setDeletingOrder(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement de vos commandes...</p>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Vous devez être connecté pour voir vos commandes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Mes Commandes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders?.map((order) => (
              <div key={order.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{order.order_number}</h3>
                      {getStatusBadge(order.status, order.delivered_at)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(order.created_at).toLocaleDateString('fr-FR')}
                      </span>
                      <span>{order.order_files.length} fichier(s) envoyé(s)</span>
                      {order.delivered_files.length > 0 && (
                        <span className="text-green-600 font-medium">
                          {order.delivered_files.length} photo(s) retouchée(s) disponible(s)
                        </span>
                      )}
                    </div>
                    {order.total_amount > 0 && (
                      <p className="text-sm font-medium">
                        Total payé : {(order.total_amount / 100).toFixed(2)}€
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {selectedOrder?.id === order.id ? 'Fermer' : 'Détails'}
                    </Button>
                    
                    {order.delivered_files.length > 0 && (
                      <Button
                        size="sm"
                        onClick={() => downloadAllFiles(order)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Télécharger tout
                      </Button>
                    )}

                    {/* Bouton de suppression - disponible pour toutes les commandes */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteOrder(order)}
                      disabled={deletingOrder === order.id}
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                    >
                      {deletingOrder === order.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="h-4 w-4 mr-1" />
                      )}
                      {deletingOrder === order.id ? "Suppression..." : "Supprimer"}
                    </Button>
                  </div>
                </div>

                {selectedOrder?.id === order.id && (
                  <div className="border-t pt-4 space-y-4">
                    {order.instructions && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Vos instructions :</h4>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                          {order.instructions}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Fichiers envoyés :</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {order.order_files.map((file) => (
                          <div key={file.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                            {isImage(file.file_name) ? (
                              <img 
                                src={getImagePreviewUrl(file.file_path, 'photo-uploads')} 
                                alt={file.file_name}
                                className="w-12 h-12 object-cover rounded border"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`flex items-center justify-center w-12 h-12 rounded border bg-muted ${isImage(file.file_name) ? 'hidden' : 'flex'}`}>
                              <FileImage className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{file.file_name}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.delivered_files.length > 0 ? (
                      <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-green-600">
                          <Download className="h-4 w-4" />
                          Photos retouchées disponibles :
                        </h4>
                        
                        {/* Message de confirmation de téléchargement */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                          <p className="text-sm text-green-700 font-medium">
                            ✅ Vous avez téléchargé ces photos
                          </p>
                          <p className="text-xs text-green-600 mt-1">
                            Vos photos retouchées sont prêtes et disponibles au téléchargement
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {order.delivered_files.map((file) => (
                            <div key={file.id} className="flex items-center gap-3 p-2 bg-green-50 rounded border border-green-200">
                              {isImage(file.file_name) ? (
                                <img 
                                  src={getImagePreviewUrl(file.file_path, 'final-photos')} 
                                  alt={file.file_name}
                                  className="w-12 h-12 object-cover rounded border"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    target.style.display = 'none';
                                    const fallback = target.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div className={`flex items-center justify-center w-12 h-12 rounded border bg-green-100 ${isImage(file.file_name) ? 'hidden' : 'flex'}`}>
                                <FileImage className="h-6 w-6 text-green-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{file.file_name}</p>
                                <p className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => downloadFinalFile(file.file_path, file.file_name)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-100"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        {order.delivered_at && (
                          <p className="text-xs text-green-600 mt-2">
                            Livré le {new Date(order.delivered_at).toLocaleDateString('fr-FR')} à {new Date(order.delivered_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    ) : order.status === 'completed' ? (
                      <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm">Vos photos sont en cours de traitement...</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        Les photos retouchées apparaîtront ici une fois le traitement terminé
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {orders?.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune commande trouvée</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Vos commandes apparaîtront ici après votre premier achat
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserOrdersViewer;