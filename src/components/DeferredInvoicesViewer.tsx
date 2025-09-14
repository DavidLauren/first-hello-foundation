import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, RefreshCw, Eye, Download, Trash2, RotateCcw } from "lucide-react";
import InvoiceModal from "./InvoiceModal";

interface DeferredInvoice {
  id: string;
  invoice_number: string;
  user_id: string;
  total_amount: number;
  currency: string;
  status: string;
  due_date: string;
  created_at: string;
  issued_date: string;
  profiles: {
    contact_name: string;
    email: string;
  };
  invoice_items: {
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

const DeferredInvoicesViewer = () => {
  const [invoices, setInvoices] = useState<DeferredInvoice[]>([]);
  const [archivedInvoices, setArchivedInvoices] = useState<DeferredInvoice[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<DeferredInvoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const loadInvoices = async () => {
    setLoading(true);
    try {
      // Charger les factures actives (non archivées)
      const { data: activeData, error: activeError } = await supabase
        .from('deferred_invoices')
        .select(`
          id,
          invoice_number,
          user_id,
          total_amount,
          currency,
          status,
          due_date,
          created_at,
          issued_date,
          archived_at,
          invoice_items(description, quantity, unit_price, total_price)
        `)
        .is('archived_at', null)
        .order('created_at', { ascending: false });

      // Charger les factures archivées
      const { data: archivedData, error: archivedError } = await supabase
        .from('deferred_invoices')
        .select(`
          id,
          invoice_number,
          user_id,
          total_amount,
          currency,
          status,
          due_date,
          created_at,
          issued_date,
          archived_at,
          invoice_items(description, quantity, unit_price, total_price)
        `)
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });

      if (activeError || archivedError) {
        console.error('Error loading invoices:', activeError || archivedError);
        toast({
          title: "Erreur",
          description: "Impossible de charger les factures",
          variant: "destructive",
        });
        return;
      }

      // Récupérer les profils pour toutes les factures
      const allInvoices = [...(activeData || []), ...(archivedData || [])];
      const userIds = [...new Set(allInvoices.map(invoice => invoice.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, contact_name, email')
        .in('id', userIds);

      // Joindre les données pour les factures actives
      const activeInvoicesWithProfiles = activeData?.map(invoice => ({
        ...invoice,
        total_amount: invoice.total_amount / 100, // Conversion centimes vers euros
        profiles: profiles?.find(p => p.id === invoice.user_id) || { contact_name: 'N/A', email: 'N/A' },
        invoice_items: invoice.invoice_items?.map(item => ({
          ...item,
          unit_price: item.unit_price / 100,
          total_price: item.total_price / 100
        })) || []
      })) || [];

      // Joindre les données pour les factures archivées
      const archivedInvoicesWithProfiles = archivedData?.map(invoice => ({
        ...invoice,
        total_amount: invoice.total_amount / 100, // Conversion centimes vers euros
        profiles: profiles?.find(p => p.id === invoice.user_id) || { contact_name: 'N/A', email: 'N/A' },
        invoice_items: invoice.invoice_items?.map(item => ({
          ...item,
          unit_price: item.unit_price / 100,
          total_price: item.total_price / 100
        })) || []
      })) || [];

      setInvoices(activeInvoicesWithProfiles);
      setArchivedInvoices(archivedInvoicesWithProfiles);
    } catch (error) {
      console.error('Error in loadInvoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
    
    // Écouter l'événement de création de factures
    const handleInvoicesCreated = () => {
      loadInvoices();
    };
    
    window.addEventListener('invoices-created', handleInvoicesCreated);
    
    return () => {
      window.removeEventListener('invoices-created', handleInvoicesCreated);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'sent': return 'Envoyée';
      case 'paid': return 'Payée';
      case 'overdue': return 'En retard';
      default: return status;
    }
  };

  const handleViewInvoice = (invoice: DeferredInvoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleArchiveInvoice = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('deferred_invoices')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', invoiceId);

      if (error) {
        console.error('Error archiving invoice:', error);
        toast({
          title: "Erreur",
          description: "Impossible d'archiver la facture",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Facture archivée",
        description: "La facture a été déplacée vers la corbeille",
      });

      loadInvoices();
    } catch (error) {
      console.error('Error archiving invoice:', error);
    }
  };

  const handleRestoreInvoice = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('deferred_invoices')
        .update({ archived_at: null })
        .eq('id', invoiceId);

      if (error) {
        console.error('Error restoring invoice:', error);
        toast({
          title: "Erreur",
          description: "Impossible de restaurer la facture",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Facture restaurée",
        description: "La facture a été restaurée",
      });

      loadInvoices();
    } catch (error) {
      console.error('Error restoring invoice:', error);
    }
  };

  const handleEmptyTrash = async () => {
    try {
      const { error } = await supabase
        .from('deferred_invoices')
        .delete()
        .not('archived_at', 'is', null);

      if (error) {
        console.error('Error emptying trash:', error);
        toast({
          title: "Erreur",
          description: "Impossible de vider la corbeille",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Corbeille vidée",
        description: "Toutes les factures archivées ont été supprimées définitivement",
      });

      loadInvoices();
    } catch (error) {
      console.error('Error emptying trash:', error);
    }
  };

  const handleDownloadPDF = async (invoice: DeferredInvoice) => {
    try {
      // Créer un conteneur temporaire pour le contenu de la facture
      const printContent = document.getElementById('invoice-content');
      if (printContent) {
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload(); // Recharger pour restaurer les scripts React
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Factures Différées
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

  const currentInvoices = showArchived ? archivedInvoices : invoices;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {showArchived ? `Corbeille (${archivedInvoices.length})` : `Factures Différées (${invoices.length})`}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={showArchived ? "default" : "outline"}
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? <RotateCcw className="h-4 w-4 mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
              {showArchived ? "Retour" : "Corbeille"}
            </Button>
            {showArchived && archivedInvoices.length > 0 && (
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
              onClick={loadInvoices}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {currentInvoices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{showArchived ? "Aucune facture dans la corbeille" : "Aucune facture différée créée"}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentInvoices.map((invoice) => (
              <div key={invoice.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{invoice.invoice_number}</h4>
                    <p className="text-sm text-gray-600">
                      {invoice.profiles?.contact_name} ({invoice.profiles?.email})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                    <p className="text-lg font-bold mt-1">
                      {invoice.total_amount.toFixed(2)}€
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                  <div>
                    <span className="font-medium">Créée le :</span>{' '}
                    {new Date(invoice.created_at).toLocaleDateString('fr-FR')}
                  </div>
                  <div>
                    <span className="font-medium">Échéance :</span>{' '}
                    {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                {invoice.invoice_items && invoice.invoice_items.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <h5 className="font-medium text-sm mb-2">Détails :</h5>
                    {invoice.invoice_items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.description}</span>
                        <span>{item.total_price.toFixed(2)}€</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewInvoice(invoice)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Voir
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownloadPDF(invoice)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                  {showArchived ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRestoreInvoice(invoice.id)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Restaurer
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleArchiveInvoice(invoice.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Archiver
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <InvoiceModal
        invoice={selectedInvoice}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDownloadPDF={handleDownloadPDF}
      />
    </Card>
  );
};

export default DeferredInvoicesViewer;