import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, Eye, FileImage, Calendar, User, CheckCircle, RefreshCw, Trash2, Send } from "lucide-react";
import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  total_amount: number;
  status: string;
  instructions: string;
  created_at: string;
  delivered_at?: string;
  profiles: {
    contact_name: string;
    email: string;
  } | null;
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

const OrderManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [uploading, setUploading] = useState(false);
  const [stagingFiles, setStagingFiles] = useState<File[]>([]);
  const [stagingDocuments, setStagingDocuments] = useState<File[]>([]);
  const [delivering, setDelivering] = useState(false);

  // Récupérer toutes les commandes
  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      console.log("🔍 Fetching admin orders...");
      
      // Récupérer d'abord les commandes
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_files(*),
          delivered_files(*)
        `)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error("❌ Error fetching orders:", ordersError);
        throw ordersError;
      }

      // Puis récupérer les profils séparément et les combiner
      const enrichedOrders = [];
      for (const order of ordersData || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('contact_name, email')
          .eq('id', order.user_id)
          .single();
          
        enrichedOrders.push({
          ...order,
          profiles: profile
        });
      }

      console.log("✅ Fetched orders:", enrichedOrders?.length, "orders found");
      console.log("📋 Orders details:", enrichedOrders);
      return enrichedOrders;
    },
    staleTime: 0, // Toujours refetch
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  const getStatusBadge = (status: string, delivered_at?: string) => {
    if (delivered_at) {
      return <Badge className="bg-green-100 text-green-800">✅ Livré</Badge>;
    }
    
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">⏳ En attente</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">🎨 À traiter</Badge>;
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

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Format non supporté",
          description: `Le fichier ${file.name} n'est pas une image`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });
    
    setStagingFiles(prev => [...prev, ...validFiles]);
    
    toast({
      title: "Photos ajoutées",
      description: `${validFiles.length} photo(s) ajoutée(s) au package`,
    });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDocumentSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const validFiles = Array.from(files);
    setStagingDocuments(prev => [...prev, ...validFiles]);
    
    toast({
      title: "Documents ajoutés",
      description: `${validFiles.length} document(s) ajouté(s)`,
    });
    
    // Reset input
    if (documentInputRef.current) {
      documentInputRef.current.value = '';
    }
  };

  const removeStagingFile = (index: number) => {
    setStagingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeStagingDocument = (index: number) => {
    setStagingDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const clearStagingFiles = () => {
    setStagingFiles([]);
  };

  const clearStagingDocuments = () => {
    setStagingDocuments([]);
  };

  const handleDeliverPackage = async (orderId: string) => {
    if (stagingFiles.length === 0 && stagingDocuments.length === 0) {
      toast({
        title: "Aucun fichier",
        description: "Ajoutez des photos ou documents avant d'envoyer le package",
        variant: "destructive",
      });
      return;
    }

    console.log("📦 Delivering package of", stagingFiles.length, "photos and", stagingDocuments.length, "documents for order", orderId);
    setDelivering(true);
    
    try {
      const uploadedFiles = [];
      
      // Upload photos
      for (const file of stagingFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${orderId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('final-photos')
          .upload(fileName, file);

        if (error) {
          console.error('Upload error:', error);
          toast({
            title: "Erreur d'upload",
            description: `Impossible d'uploader ${file.name}`,
            variant: "destructive",
          });
          continue;
        }

        uploadedFiles.push({
          order_id: orderId,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          file_type: fileExt || 'unknown'
        });
      }

      // Upload documents
      for (const file of stagingDocuments) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${orderId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('final-photos')
          .upload(fileName, file);

        if (error) {
          console.error('Upload error:', error);
          toast({
            title: "Erreur d'upload",
            description: `Impossible d'uploader ${file.name}`,
            variant: "destructive",
          });
          continue;
        }

        uploadedFiles.push({
          order_id: orderId,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          file_type: fileExt || 'unknown'
        });
      }

      // Enregistrer en base de données
      if (uploadedFiles.length > 0) {
        const { error: dbError } = await supabase
          .from('delivered_files')
          .insert(uploadedFiles);

        if (dbError) {
          throw new Error("Impossible d'enregistrer les fichiers en base");
        }

        // Envoyer l'email de notification au client
        const order = orders?.find(o => o.id === orderId);
        if (order && order.profiles) {
          try {
            await supabase.functions.invoke('send-delivery-notification', {
              body: {
                orderNumber: order.order_number,
                clientEmail: order.profiles.email,
                clientName: order.profiles.contact_name,
                filesCount: uploadedFiles.length,
                instructions: order.instructions
              }
            });
          } catch (emailError) {
            console.error('Email notification error:', emailError);
          }
        }

        toast({
          title: "Package livré !",
          description: `${uploadedFiles.length} fichier(s) livré(s) avec succès. Le client a été notifié par email.`,
        });

        // Clear staging et refresh des données
        setStagingFiles([]);
        setStagingDocuments([]);
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        setSelectedOrder(null);
      }

    } catch (error) {
      console.error('Delivery error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la livraison",
        variant: "destructive",
      });
    } finally {
      setDelivering(false);
    }
  };

  const downloadOriginalFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('photo-uploads')
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
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le fichier",
        variant: "destructive",
      });
    }
  };

  const deleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la commande ${orderNumber} ? Cette action est irréversible.`)) {
      return;
    }

    try {
      console.log("🗑️ Starting admin deletion of order:", orderNumber, "ID:", orderId);
      
      // Utiliser la edge function pour supprimer complètement
      const { data, error } = await supabase.functions.invoke('delete-order-admin', {
        body: {
          orderId: orderId,
          orderNumber: orderNumber
        }
      });

      if (error) {
        console.error("❌ Edge function error:", error);
        throw new Error(error.message || "Erreur lors de la suppression");
      }

      if (!data?.success) {
        console.error("❌ Deletion failed:", data);
        throw new Error(data?.error || "Suppression échouée");
      }

      console.log("✅ Order deleted successfully via edge function");

      toast({
        title: "Commande supprimée",
        description: `La commande ${orderNumber} et tous ses fichiers ont été supprimés avec succès.`,
      });

      // Refresh forcé des données
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.refetchQueries({ queryKey: ['admin-orders'] });
      queryClient.removeQueries({ queryKey: ['admin-orders'] });
      setSelectedOrder(null);

    } catch (error) {
      console.error('❌ Delete order error:', error);
      toast({
        title: "Erreur",
        description: `Impossible de supprimer la commande: ${error.message || error}`,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des commandes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Gestion des Commandes
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log("🔄 Manual refresh triggered");
                queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Debug info */}
          <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
            <p><strong>🔍 Debug:</strong> {orders?.length || 0} commande(s) trouvée(s)</p>
            {!orders || orders.length === 0 && (
              <div className="mt-2">
                <p>❌ Aucune commande trouvée.</p>
                <p>Vérifiez que des clients ont bien passé des commandes.</p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {orders?.map((order) => {
              console.log("🎯 Rendering order:", order.order_number, "Status:", order.status, "Delivered:", !!order.delivered_at);
              
              return (
                <div key={order.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{order.order_number}</h3>
                        {getStatusBadge(order.status, order.delivered_at)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {order.profiles?.contact_name || 'Nom non disponible'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.created_at).toLocaleDateString('fr-FR')}
                        </span>
                        <span>{order.order_files.length} fichier(s)</span>
                      </div>
                      {/* Debug status */}
                      <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        Status: "{order.status}" | Livré: {order.delivered_at ? 'Oui' : 'Non'} | Files: {order.delivered_files?.length || 0}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {selectedOrder?.id === order.id ? 'Fermer' : 'Voir'}
                      </Button>
                      
                      {/* BOUTON AJOUTER PHOTOS */}
                      {!order.delivered_at && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              console.log("🚀 Add photos button clicked for order:", order.order_number);
                              setSelectedOrder(order);
                              fileInputRef.current?.click();
                            }}
                            disabled={uploading}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            📸 Photos
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              console.log("📄 Add documents button clicked for order:", order.order_number);
                              setSelectedOrder(order);
                              documentInputRef.current?.click();
                            }}
                            disabled={uploading}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            📄 Documents
                          </Button>
                        </>
                      )}
                      
                      {/* BOUTON SUPPRIMER */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteOrder(order.id, order.order_number)}
                        className="text-white"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>

                  {selectedOrder?.id === order.id && (
                    <div className="border-t pt-4 space-y-4">
                      {order.instructions && (
                        <div>
                          <h4 className="font-medium text-sm mb-2">Instructions :</h4>
                          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                            {order.instructions}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="font-medium text-sm mb-2">Fichiers originaux :</h4>
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
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => downloadOriginalFile(file.file_path, file.file_name)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section Photos en Staging */}
                      {stagingFiles.length > 0 && (
                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                              📦 Package en préparation ({stagingFiles.length} photo{stagingFiles.length > 1 ? 's' : ''})
                            </h4>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={clearStagingFiles}
                                disabled={delivering}
                              >
                                Vider
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDeliverPackage(order.id)}
                                disabled={delivering}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {delivering ? 'Envoi...' : '📧 Envoyer Package'}
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {stagingFiles.map((file, index) => (
                              <div key={index} className="relative p-2 bg-blue-50 rounded border">
                                {isImage(file.name) && (
                                  <img 
                                    src={URL.createObjectURL(file)} 
                                    alt={file.name}
                                    className="w-full h-24 object-cover rounded mb-2"
                                  />
                                )}
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeStagingFile(index)}
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                                  >
                                    ×
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Section Documents en Staging */}
                      {stagingDocuments.length > 0 && (
                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                              📄 Documents à envoyer ({stagingDocuments.length})
                            </h4>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={clearStagingDocuments}
                                disabled={delivering}
                              >
                                Vider
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleDeliverPackage(order.id)}
                                disabled={delivering}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {delivering ? 'Envoi...' : '📧 Envoyer Package'}
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {stagingDocuments.map((file, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 bg-purple-50 rounded border border-purple-200">
                                <FileImage className="h-8 w-8 text-purple-600" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium truncate">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeStagingDocument(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {order.delivered_files && order.delivered_files.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Fichiers livrés :
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {order.delivered_files.map((file) => (
                              <div key={file.id} className="flex items-center gap-3 p-2 bg-green-50 rounded">
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
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {(!orders || orders.length === 0) && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-lg">📭 Aucune commande trouvée</p>
                <p className="text-sm mt-2">Les commandes des clients apparaîtront ici</p>
                <div className="mt-4 space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      console.log("🔄 Manual refresh clicked");
                      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
                    }}
                  >
                    🔄 Actualiser
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelection}
        className="hidden"
      />
      
      {/* Input document caché */}
      <input
        ref={documentInputRef}
        type="file"
        multiple
        onChange={handleDocumentSelection}
        className="hidden"
      />
    </div>
  );
};

export default OrderManager;